use crate::codec::CrlfTextCodec;
use crate::state::AppState;
use crate::stream::{StreamConnection, EVENT_STREAM_LINE};
use futures_util::{SinkExt, StreamExt};
use tauri::{AppHandle, Emitter, State};
use tracing::{info, warn};

#[tauri::command]
pub async fn stream_connect(app: AppHandle, state: State<'_, AppState>) -> Result<(), String> {
    info!("stream_connect");
    // Already connected?
    {
        let guard = state.stream.read().await;
        if guard.is_some() {
            // The UI may reload while the Rust-side stream connection is still alive.
            // In that case, re-emit a synthetic auth success status so the UI can
            // transition to authenticated state and send market subscriptions.
            let _ = app.emit(
                EVENT_STREAM_LINE,
                serde_json::json!({
                    "op": "status",
                    "id": 1,
                    "statusCode": "SUCCESS"
                })
                .to_string(),
            );
            return Ok(());
        }
    }

    if state.app_key.trim().is_empty() {
        return Err("errors:validation.appKeyRequired".to_string());
    }

    let token = state.session_token.read().await;
    if token.as_deref().unwrap_or("").is_empty() {
        return Err("errors:auth.notLoggedIn".to_string());
    }

    // Build a fresh TLS stream and framed codec.
    let addr = "stream-api.betfair.com:443";
    let tcp = tokio::net::TcpStream::connect(addr)
        .await
        .map_err(|e| format!("errors:network.requestFailed:{e}"))?;

    let server_name = rustls_pki_types::ServerName::try_from("stream-api.betfair.com")
        .map_err(|_| "errors:network.invalidHost".to_string())?;

    let tls_config = rustls::ClientConfig::builder()
        .with_root_certificates(std::sync::Arc::new(rustls::RootCertStore::from_iter(
            webpki_roots::TLS_SERVER_ROOTS.iter().cloned(),
        )))
        .with_no_client_auth();

    let tls = tokio_rustls::TlsConnector::from(std::sync::Arc::new(tls_config));
    let tls_stream = tls
        .connect(server_name, tcp)
        .await
        .map_err(|e| format!("errors:network.requestFailed:{e}"))?;

    let framed = tokio_util::codec::Framed::new(tls_stream, CrlfTextCodec::new(1_048_576));
    let (mut sink, mut stream) = framed.split();

    // Authenticate immediately using embedded AppKey + Rust-owned token.
    let auth = serde_json::json!({
      "op": "authentication",
            "id": 1,
      "appKey": state.app_key.as_str(),
      "session": token.as_deref().unwrap_or("")
    })
    .to_string();

    sink.send(auth)
        .await
        .map_err(|e| format!("errors:network.requestFailed:{e}"))?;

    let (tx, mut rx) = tokio::sync::mpsc::channel::<String>(256);

    // Writer task.
    tokio::spawn(async move {
        while let Some(line) = rx.recv().await {
            let _ = sink.send(line).await;
        }
        let _ = sink.close().await;
    });

    // Reader task.
    tokio::spawn(async move {
        while let Some(msg) = stream.next().await {
            match msg {
                Ok(line) => {
                    let _ = app.emit(EVENT_STREAM_LINE, line);
                }
                Err(_) => {
                    warn!("stream_in error");
                    break;
                }
            }
        }
        info!("stream reader exited");
    });

    let mut guard = state.stream.write().await;
    *guard = Some(StreamConnection { tx });

    Ok(())
}

#[tauri::command]
pub async fn stream_send(state: State<'_, AppState>, line: String) -> Result<(), String> {
    info!(n = line.len(), "stream_send");
    // Basic safety: don't allow UI to send authentication (token must not cross boundary).
    if let Ok(v) = serde_json::from_str::<serde_json::Value>(&line) {
        if v.get("op").and_then(|x| x.as_str()) == Some("authentication") {
            return Err("errors:validation.methodNotAllowed".to_string());
        }
    }

    let tx = {
        let guard = state.stream.read().await;
        guard.as_ref().map(|c| c.tx.clone())
    };

    let Some(tx) = tx else {
        return Err("errors:stream.notConnected".to_string());
    };

    tx.send(line)
        .await
        .map_err(|_| "errors:stream.notConnected".to_string())?;
    Ok(())
}

#[tauri::command]
pub async fn stream_disconnect(state: State<'_, AppState>) -> Result<(), String> {
    info!("stream_disconnect");
    let mut guard = state.stream.write().await;
    *guard = None;
    Ok(())
}
