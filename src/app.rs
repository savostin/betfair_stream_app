use crate::config::Config;
use axum::{
    extract::ws::WebSocketUpgrade,
    extract::Path,
    http::HeaderMap,
    http::{header, Method, Uri},
    http::StatusCode,
    response::{IntoResponse, Response},
    routing::{any, get},
    Extension,
    Router,
};
use bytes::Bytes;
use std::sync::Arc;
use tokio_util::sync::CancellationToken;
use tower_http::services::{ServeDir, ServeFile};
use tower_http::trace::TraceLayer;
use tracing::{info, warn};

#[derive(Clone)]
struct AppState {
    config: Arc<Config>,
    tls: Arc<tokio_rustls::TlsConnector>,
    http: reqwest::Client,
}

pub fn run_from_cli(force_gui: bool) {
    let config = Config::parse();
    let config = Arc::new(config);

    // Ensure a process-wide rustls CryptoProvider is installed.
    // Some dependency combinations (e.g., bringing in reqwest + rustls) can enable
    // multiple providers, which requires explicit selection.
    let _ = rustls::crypto::ring::default_provider().install_default();

    // Decide whether to use GUI mode.
    // - CLI: enabled by --gui (config.gui)
    // - Windows GUI executable: force_gui=true
    // - macOS app bundle: auto-enable to avoid an "invisible" agent app
    #[cfg(all(feature = "gui", target_os = "macos"))]
    let should_use_gui = force_gui || config.gui || is_macos_app_bundle_launch();

    #[cfg(not(all(feature = "gui", target_os = "macos")))]
    let should_use_gui = force_gui || config.gui;

    tracing_subscriber::fmt()
        .with_env_filter(
            tracing_subscriber::EnvFilter::try_from_default_env().unwrap_or_else(|_| "info".into()),
        )
        .init();

    let tls_config = rustls::ClientConfig::builder()
        .with_root_certificates(std::sync::Arc::new(rustls::RootCertStore::from_iter(
            webpki_roots::TLS_SERVER_ROOTS.iter().cloned(),
        )))
        .with_no_client_auth();
    let tls = Arc::new(tokio_rustls::TlsConnector::from(Arc::new(tls_config)));

    // Windows Service mode: run under Service Control Manager.
    #[cfg(windows)]
    {
        if config.service {
            if let Err(e) = crate::windows_service::run_as_service(config, tls) {
                eprintln!("service error: {e}");
            }
            return;
        }
    }

    if should_use_gui {
        #[cfg(feature = "gui")]
        {
            run_with_gui(config, tls);
            return;
        }

        #[cfg(not(feature = "gui"))]
        {
            eprintln!("--gui requires building with --features gui");
        }
    }

    run_headless(config, tls);
}

#[cfg(all(feature = "gui", target_os = "macos"))]
fn is_macos_app_bundle_launch() -> bool {
    let Ok(exe) = std::env::current_exe() else {
        return false;
    };
    let exe_str = exe.to_string_lossy();
    exe_str.contains(".app/Contents/MacOS/")
}

fn run_headless(config: Arc<Config>, tls: Arc<tokio_rustls::TlsConnector>) {
    let rt = tokio::runtime::Builder::new_multi_thread()
        .enable_all()
        .build()
        .unwrap();
    rt.block_on(async move {
        if let Err(e) = run_server(config, tls, None).await {
            eprintln!("server error: {e}");
        }
    });
}

#[cfg(feature = "gui")]
fn run_with_gui(config: Arc<Config>, tls: Arc<tokio_rustls::TlsConnector>) {
    let (shutdown_tx, shutdown_rx) = tokio::sync::oneshot::channel::<()>();
    let (server_err_tx, server_err_rx) = std::sync::mpsc::channel::<String>();

    let server_config = config.clone();
    let server_tls = tls.clone();
    let server_thread = std::thread::spawn(move || {
        let rt = tokio::runtime::Builder::new_multi_thread()
            .enable_all()
            .build()
            .unwrap();
        rt.block_on(async move {
            if let Err(e) = run_server(server_config, server_tls, Some(shutdown_rx)).await {
                let _ = server_err_tx.send(e.to_string());
            }
        });
    });

    if let Err(e) = crate::gui::run_gui(shutdown_tx, server_err_rx) {
        eprintln!("gui error: {e}");
    }

    let _ = server_thread.join();
}

pub(crate) async fn run_server(
    config: Arc<Config>,
    tls: Arc<tokio_rustls::TlsConnector>,
    gui_shutdown: Option<tokio::sync::oneshot::Receiver<()>>,
) -> Result<(), crate::error::AppError> {
    let http = reqwest::Client::builder()
        .user_agent("betfair_stream_proxy")
        .build()
        .map_err(|e| std::io::Error::other(e.to_string()))?;

    let state = AppState { config, tls, http };

    let mut app = Router::new()
        .route("/healthz", get(healthz))
        .route("/ws", get(ws_handler));

    if state.config.serve_betfair_http {
        app = app
            .route("/bf-identity/*path", any(bf_identity_proxy))
            .route("/bf-api/*path", any(bf_api_proxy));
    }

    if state.config.serve_ui {
        let ui_dir = std::path::PathBuf::from(&state.config.ui_dir);
        let index = ui_dir.join("index.html");
        if index.exists() {
            let ui_service = ServeDir::new(ui_dir).not_found_service(ServeFile::new(index));
            app = app.nest_service("/", ui_service);
        } else {
            app = app.route("/", get(ui_missing));
        }
    }

    // Apply layers after all routes are registered so everything (including
    // routes added conditionally and nested services) sees the same middleware.
    app = app
        .layer(TraceLayer::new_for_http())
        .layer(Extension(state.clone()));

    let listener = tokio::net::TcpListener::bind(&state.config.bind).await?;
    info!(bind = %state.config.bind, "listening");

    axum::serve(listener, app)
        .with_graceful_shutdown(shutdown_signal(gui_shutdown))
        .await
        .map_err(std::io::Error::other)?;

    Ok(())
}

async fn ui_missing() -> impl IntoResponse {
    (
        StatusCode::NOT_FOUND,
        "UI not found. Build it with: cd ui && npm install && npm run build",
    )
}

async fn bf_identity_proxy(
    Extension(state): Extension<AppState>,
    Path(path): Path<String>,
    method: Method,
    headers: HeaderMap,
    uri: Uri,
    body: axum::body::Body,
) -> Response {
    // Allowlist to avoid turning this into a general-purpose proxy.
    if path != "api/login" {
        return (StatusCode::NOT_FOUND, "unsupported identity endpoint").into_response();
    }

    let base = format!("https://identitysso.betfair.com/{path}");
    proxy_http(&state.http, base, method, headers, uri, body, 256 * 1024).await
}

async fn bf_api_proxy(
    Extension(state): Extension<AppState>,
    Path(path): Path<String>,
    method: Method,
    headers: HeaderMap,
    uri: Uri,
    body: axum::body::Body,
) -> Response {
    // Allowlist key betting API endpoints typically needed by the UI.
    let allowed = path.starts_with("exchange/betting/rest/v1.0/")
        || path == "exchange/betting/json-rpc/v1";
    if !allowed {
        return (StatusCode::NOT_FOUND, "unsupported api endpoint").into_response();
    }

    let base = format!("https://api.betfair.com/{path}");
    proxy_http(&state.http, base, method, headers, uri, body, 2 * 1024 * 1024).await
}

async fn proxy_http(
    client: &reqwest::Client,
    base_url: String,
    method: Method,
    headers: HeaderMap,
    uri: Uri,
    body: axum::body::Body,
    max_body_bytes: usize,
) -> Response {
    let url = if let Some(q) = uri.query() {
        format!("{base_url}?{q}")
    } else {
        base_url
    };

    let body_bytes = match axum::body::to_bytes(body, max_body_bytes).await {
        Ok(b) => b,
        Err(_) => return (StatusCode::PAYLOAD_TOO_LARGE, "request body too large").into_response(),
    };

    let mut req = client.request(method, url);

    // Copy headers, skipping hop-by-hop and Host.
    for (name, value) in headers.iter() {
        if name == header::HOST
            || name == header::CONNECTION
            || name == header::PROXY_AUTHENTICATE
            || name == header::PROXY_AUTHORIZATION
            || name == header::TE
            || name == header::TRAILER
            || name == header::TRANSFER_ENCODING
            || name == header::UPGRADE
        {
            continue;
        }
        req = req.header(name, value);
    }

    req = req.body(body_bytes);

    let resp = match req.send().await {
        Ok(r) => r,
        Err(e) => {
            return (
                StatusCode::BAD_GATEWAY,
                format!("upstream request failed: {e}"),
            )
                .into_response()
        }
    };

    let status = resp.status();
    let mut out_headers = HeaderMap::new();
    for (name, value) in resp.headers().iter() {
        if name == header::CONNECTION
            || name == header::PROXY_AUTHENTICATE
            || name == header::TRANSFER_ENCODING
            || name == header::UPGRADE
        {
            continue;
        }
        out_headers.insert(name.clone(), value.clone());
    }

    let bytes = match resp.bytes().await {
        Ok(b) => b,
        Err(e) => {
            return (
                StatusCode::BAD_GATEWAY,
                format!("failed reading upstream body: {e}"),
            )
                .into_response()
        }
    };

    (status, out_headers, Bytes::from(bytes)).into_response()
}

async fn healthz() -> impl IntoResponse {
    (StatusCode::OK, "ok")
}

async fn ws_handler(
    ws: WebSocketUpgrade,
    headers: HeaderMap,
    Extension(state): Extension<AppState>,
) -> impl IntoResponse {
    if let Err(resp) = validate_origin(&headers, &state.config) {
        return resp.into_response();
    }
    ws.on_upgrade(move |socket| async move {
        if let Err(err) = proxy_session(socket, state).await {
            warn!(error = %err, "ws session ended with error");
        }
    })
}

async fn proxy_session(
    ws: axum::extract::ws::WebSocket,
    state: AppState,
) -> Result<(), crate::error::AppError> {
    use axum::extract::ws::Message;
    use futures_util::{SinkExt, StreamExt};
    use tokio::sync::mpsc;
    use tokio::time::timeout;

    let upstream = crate::upstream::connect(&state.config, &state.tls).await?;

    let (mut upstream_writer, mut upstream_reader) = upstream.split();

    let (mut ws_tx, mut ws_rx) = ws.split();

    let (ws_out_tx, mut ws_out_rx) = mpsc::channel::<Message>(state.config.ws_outbound_buffer);

    let cancel = CancellationToken::new();

    // WS writer task (single owner of ws_tx)
    let cancel_ws_writer = cancel.clone();
    let ws_send_timeout = std::time::Duration::from_millis(state.config.ws_send_timeout_ms);
    let ws_writer = tokio::spawn(async move {
        loop {
            tokio::select! {
                _ = cancel_ws_writer.cancelled() => {
                    break;
                }
                maybe_msg = ws_out_rx.recv() => {
                    let Some(msg) = maybe_msg else { break; };
                    let send_res = timeout(ws_send_timeout, ws_tx.send(msg)).await;
                    match send_res {
                        Ok(Ok(())) => {}
                        // timed out or websocket errored -> disconnect
                        _ => {
                            cancel_ws_writer.cancel();
                            break;
                        }
                    }
                }
            }
        }
    });

    // Upstream reader -> WS
    let ws_out_tx_up = ws_out_tx.clone();
    let cancel_upstream_to_ws = cancel.clone();
    let upstream_to_ws = tokio::spawn(async move {
        while let Some(next) = upstream_reader.next_line().await {
            if cancel_upstream_to_ws.is_cancelled() {
                break;
            }
            match next {
                Ok(line) => match ws_out_tx_up.try_send(Message::Text(line)) {
                    Ok(()) => {}
                    Err(tokio::sync::mpsc::error::TrySendError::Full(_)) => {
                        // Slow client: disconnect rather than buffering indefinitely.
                        cancel_upstream_to_ws.cancel();
                        break;
                    }
                    Err(tokio::sync::mpsc::error::TrySendError::Closed(_)) => break,
                },
                Err(_) => break,
            }
        }
    });

    // WS -> upstream writer
    // Require the first message quickly to avoid upstream TIMEOUT and avoid keeping idle resources.
    let first_msg = tokio::time::timeout(
        std::time::Duration::from_millis(state.config.first_message_timeout_ms),
        ws_rx.next(),
    )
    .await
    .ok()
    .flatten();

    let mut pending_first = first_msg;
    loop {
        if cancel.is_cancelled() {
            break;
        }
        let msg = if let Some(m) = pending_first.take() {
            Some(m)
        } else {
            tokio::select! {
                _ = cancel.cancelled() => None,
                next = ws_rx.next() => next,
            }
        };

        let Some(msg) = msg else { break };
        let msg = match msg {
            Ok(m) => m,
            Err(_) => break,
        };

        match msg {
            Message::Text(text) => {
                if text.len() > state.config.ws_max_message_bytes {
                    break;
                }
                let normalized = normalize_ws_payload(&text);
                if upstream_writer.send_line(&normalized).await.is_err() {
                    break;
                }
            }
            Message::Binary(bin) => {
                if bin.len() > state.config.ws_max_message_bytes {
                    break;
                }
                if let Ok(text) = String::from_utf8(bin) {
                    let normalized = normalize_ws_payload(&text);
                    if upstream_writer.send_line(&normalized).await.is_err() {
                        break;
                    }
                }
            }
            Message::Close(_) => break,
            Message::Ping(payload) => {
                // Keep browser clients happy.
                match ws_out_tx.try_send(Message::Pong(payload)) {
                    Ok(()) => {}
                    Err(tokio::sync::mpsc::error::TrySendError::Full(_)) => {
                        cancel.cancel();
                        break;
                    }
                    Err(tokio::sync::mpsc::error::TrySendError::Closed(_)) => break,
                }
            }
            Message::Pong(_) => {}
        }
    }

    cancel.cancel();
    drop(ws_out_tx);
    upstream_writer.close().await.ok();

    // Wait for tasks to finish (best-effort)
    upstream_to_ws.abort();
    ws_writer.abort();

    Ok(())
}

fn normalize_ws_payload(s: &str) -> String {
    // Upstream transport is CRLF-delimited JSON. If a client sends JSON containing raw newlines
    // (e.g. pretty-printed), it can break the upstream framing. Remove any raw CR/LF characters
    // and rely on the upstream writer to append a single CRLF delimiter.
    let mut out = String::with_capacity(s.len());
    for ch in s.chars() {
        if ch != '\r' && ch != '\n' {
            out.push(ch);
        }
    }
    out.trim().to_string()
}

fn validate_origin(headers: &HeaderMap, cfg: &Config) -> Result<(), (StatusCode, &'static str)> {
    let allowed = cfg.allowed_origins_set();
    if allowed.is_empty() {
        return Ok(());
    }

    let Some(origin) = headers.get(axum::http::header::ORIGIN) else {
        return Err((StatusCode::FORBIDDEN, "missing origin"));
    };

    let Ok(origin) = origin.to_str() else {
        return Err((StatusCode::FORBIDDEN, "invalid origin"));
    };

    if allowed.contains(origin) {
        Ok(())
    } else {
        Err((StatusCode::FORBIDDEN, "origin not allowed"))
    }
}

async fn shutdown_signal(mut gui_shutdown: Option<tokio::sync::oneshot::Receiver<()>>) {
    // Cross-platform CTRL-C handling.
    let gui = async {
        if let Some(rx) = gui_shutdown.as_mut() {
            let _ = rx.await;
        } else {
            std::future::pending::<()>().await;
        }
    };

    tokio::select! {
        _ = tokio::signal::ctrl_c() => {
            info!("shutdown signal received (ctrl-c)");
        }
        _ = gui => {
            info!("shutdown signal received (gui)");
        }
    }
}
