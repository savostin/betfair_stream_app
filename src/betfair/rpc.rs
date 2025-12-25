use crate::state::AppState;
use crate::ui_error::UiErrorPayload;
use reqwest::Client;
use tracing::{info, warn};

fn service_method_prefix(service: &str) -> Option<&'static str> {
    match service {
        // Betfair expects fully-qualified method names.
        // Examples: "SportsAPING/v1.0/listMarketCatalogue", "AccountAPING/v1.0/getAccountFunds"
        "betting" => Some("SportsAPING/v1.0"),
        "account" => Some("AccountAPING/v1.0"),
        "heartbeat" => Some("HeartbeatAPING/v1.0"),
        _ => None,
    }
}

pub fn service_base_url(service: &str) -> Option<&'static str> {
    match service {
        "betting" => Some("https://api.betfair.com/exchange/betting/json-rpc/v1"),
        "account" => Some("https://api.betfair.com/exchange/account/json-rpc/v1"),
        "heartbeat" => Some("https://api.betfair.com/exchange/heartbeat/json-rpc/v1"),
        _ => None,
    }
}

pub fn is_method_allowed(state: &AppState, service: &str, method: &str) -> bool {
    match service {
        "betting" => state.allowlist_betting.contains(method),
        "account" => state.allowlist_account.contains(method),
        "heartbeat" => state.allowlist_heartbeat.contains(method),
        _ => false,
    }
}

pub async fn call_json_rpc(
    http: &Client,
    app_key: &str,
    session_token: &str,
    service: &str,
    method: &str,
    params: serde_json::Value,
) -> Result<serde_json::Value, UiErrorPayload> {
    let Some(base_url) = service_base_url(service) else {
        return Err(UiErrorPayload::key("errors:validation.invalidService"));
    };

    let Some(prefix) = service_method_prefix(service) else {
        return Err(UiErrorPayload::key("errors:validation.invalidService"));
    };

    let full_method = format!("{prefix}/{method}");

    // Betfair's JSON-RPC endpoint is strict about request shape.
    // We send a single JSON-RPC object (not a 1-element batch) to avoid
    // "invalid request" errors seen in the wild (e.g. ANGX-0007).
    let request = serde_json::json!({
        "jsonrpc": "2.0",
        "method": full_method,
        "params": params,
        "id": 1
    });

    let params_len = serde_json::to_vec(&request).map(|b| b.len()).unwrap_or(0);
    info!(
        service = %service,
        method = %method,
        full_method = %request.get("method").and_then(|v| v.as_str()).unwrap_or(""),
        url = %base_url,
        app_key = app_key,
        session_token_len = session_token.len(),
        request_bytes = params_len,
        "betfair json-rpc request"
    );

    let resp = http
        .post(base_url)
        .header("X-Application", app_key)
        .header("X-Authentication", session_token)
        .header("Content-Type", "application/json")
        .header("Accept", "application/json")
        .json(&request)
        .send()
        .await
        .map_err(|e| UiErrorPayload::unexpected(format!("request failed: {e}")))?;

    let status = resp.status();

    // Capture a couple of potentially useful correlation headers (safe to log).
    let request_id = resp
        .headers()
        .get("x-request-id")
        .and_then(|v| v.to_str().ok())
        .map(|s| s.to_string());
    let bf_correlation_id = resp
        .headers()
        .get("x-bf-correlation-id")
        .and_then(|v| v.to_str().ok())
        .map(|s| s.to_string());

    let json = resp
        .json::<serde_json::Value>()
        .await
        .map_err(|e| UiErrorPayload::unexpected(format!("read failed: {e}")))?;

    // Tolerate both single-object and batch responses.
    let first = match &json {
        serde_json::Value::Array(items) if items.len() == 1 => Some(&items[0]),
        serde_json::Value::Array(items) if !items.is_empty() => Some(&items[0]),
        serde_json::Value::Object(_) => Some(&json),
        _ => None,
    };

    let Some(first) = first else {
        return Err(UiErrorPayload::with_values(
            "errors:betfair.rpc.invalidResponse",
            serde_json::json!({ "httpStatus": status.as_u16() }),
        ));
    };

    if let Some(err) = first.get("error") {
        let code = err.get("code").cloned().unwrap_or(serde_json::Value::Null);
        let message = err
            .get("message")
            .and_then(|m| m.as_str())
            .unwrap_or("UNKNOWN")
            .to_string();

        warn!(
            http_status = status.as_u16(),
            code = %code,
            message = %message,
            request_id = request_id.as_deref().unwrap_or(""),
            bf_correlation_id = bf_correlation_id.as_deref().unwrap_or(""),
            "betfair json-rpc error"
        );

        return Err(UiErrorPayload::with_values(
            "errors:betfair.rpc.failed",
            serde_json::json!({
                "httpStatus": status.as_u16(),
                "code": code,
                "message": message,
                "requestId": request_id,
                "bfCorrelationId": bf_correlation_id,
                "error": err,
            }),
        ));
    }

    if let Some(result) = first.get("result") {
        return Ok(result.clone());
    }

    Err(UiErrorPayload::with_values(
        "errors:betfair.rpc.invalidResponse",
        serde_json::json!({ "httpStatus": status.as_u16() }),
    ))
}
