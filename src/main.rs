mod codec;
mod config;
mod error;
mod upstream;

use axum::{
    extract::{ws::WebSocketUpgrade, State},
    http::HeaderMap,
    http::StatusCode,
    response::IntoResponse,
    routing::get,
    Router,
};
use config::Config;
use std::sync::Arc;
use tracing::{info, warn};
use tower_http::trace::TraceLayer;
use tokio_util::sync::CancellationToken;

#[derive(Clone)]
struct AppState {
    config: Arc<Config>,
    tls: Arc<tokio_rustls::TlsConnector>,
}

#[tokio::main]
async fn main() {
    let config = Arc::new(Config::parse());

    tracing_subscriber::fmt()
        .with_env_filter(
            tracing_subscriber::EnvFilter::try_from_default_env()
                .unwrap_or_else(|_| "info".into()),
        )
        .init();

    let tls_config = rustls::ClientConfig::builder()
        .with_root_certificates(std::sync::Arc::new(
            rustls::RootCertStore::from_iter(webpki_roots::TLS_SERVER_ROOTS.iter().cloned()),
        ))
        .with_no_client_auth();
    let tls = Arc::new(tokio_rustls::TlsConnector::from(Arc::new(tls_config)));

    let state = AppState { config, tls };

    let app = Router::new()
        .route("/healthz", get(healthz))
        .route("/ws", get(ws_handler))
        .layer(TraceLayer::new_for_http())
        .with_state(state.clone());

    let listener = tokio::net::TcpListener::bind(&state.config.bind).await.unwrap();
    info!(bind = %state.config.bind, "listening");
    axum::serve(listener, app)
        .with_graceful_shutdown(shutdown_signal())
        .await
        .unwrap();
}

async fn healthz() -> impl IntoResponse {
    (StatusCode::OK, "ok")
}

async fn ws_handler(
    ws: WebSocketUpgrade,
    headers: HeaderMap,
    State(state): State<AppState>,
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

async fn proxy_session(ws: axum::extract::ws::WebSocket, state: AppState) -> Result<(), error::AppError> {
    use axum::extract::ws::Message;
    use futures_util::{SinkExt, StreamExt};
    use tokio::sync::mpsc;
    use tokio::time::timeout;

    let upstream = upstream::connect(&state.config, &state.tls).await?;

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
                Ok(line) => {
                    match ws_out_tx_up.try_send(Message::Text(line)) {
                        Ok(()) => {}
                        Err(tokio::sync::mpsc::error::TrySendError::Full(_)) => {
                            // Slow client: disconnect rather than buffering indefinitely.
                            cancel_upstream_to_ws.cancel();
                            break;
                        }
                        Err(tokio::sync::mpsc::error::TrySendError::Closed(_)) => break,
                    }
                }
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
    // Browser clients sometimes send JSON with a trailing CRLF. The upstream framing already appends CRLF.
    // Strip common line endings to avoid sending double-CRLF.
    s.trim_end_matches(['\r', '\n']).to_string()
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

async fn shutdown_signal() {
    // Cross-platform CTRL-C handling.
    let _ = tokio::signal::ctrl_c().await;
    info!("shutdown signal received");
}
