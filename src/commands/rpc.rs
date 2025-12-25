use crate::betfair;
use crate::state::AppState;
use crate::ui_error::UiErrorPayload;
use serde::Deserialize;
use tauri::State;
use tracing::{info, warn};

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct RpcArgs {
    pub service: String,
    pub method: String,
    pub params: serde_json::Value,
}

#[tauri::command]
pub async fn betfair_rpc(
    state: State<'_, AppState>,
    args: RpcArgs,
) -> Result<serde_json::Value, UiErrorPayload> {
    info!(service = %args.service, method = %args.method, "betfair_rpc");
    if !betfair::rpc::is_method_allowed(&state, &args.service, &args.method) {
        return Err(UiErrorPayload::key("errors:validation.methodNotAllowed"));
    }

    let token = state.session_token.read().await;
    let token = token.as_deref().unwrap_or("");
    if token.is_empty() {
        return Err(UiErrorPayload::key("errors:auth.notLoggedIn"));
    }

    betfair::rpc::call_json_rpc(
        &state.http,
        state.app_key.as_str(),
        token,
        &args.service,
        &args.method,
        args.params,
    )
    .await
    .map_err(|e| {
        warn!(key = %e.key, "betfair_rpc failed");
        e
    })
}
