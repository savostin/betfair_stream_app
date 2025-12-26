use crate::state::AppState;
use crate::ui_error::UiErrorPayload;
use serde::{Deserialize, Serialize};
use tauri::State;
use tracing::{info, warn};

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AccountFunds {
    pub available_to_bet_balance: Option<f64>,
    pub exposure: Option<f64>,
    pub retained_commission: Option<f64>,
    pub exposure_limit: Option<f64>,
    pub discount_rate: Option<f64>,
    pub points_balance: Option<i64>,
    pub wallet: Option<String>,
}

#[tauri::command]
pub async fn get_account_funds(
    state: State<'_, AppState>,
) -> Result<AccountFunds, UiErrorPayload> {
    info!("get_account_funds");

    let token_guard = state.session_token.read().await;
    let Some(ref token) = *token_guard else {
        warn!("get_account_funds: no session token");
        return Err(UiErrorPayload::key("errors:auth.notAuthenticated"));
    };

    let method = "AccountAPING/v1.0/getAccountFunds";
    let url = "https://api.betfair.com/exchange/account/json-rpc/v1";

    let request_body = serde_json::json!({
        "jsonrpc": "2.0",
        "method": method,
        "params": {
            "wallet": "UK"
        },
        "id": 1
    });

    let resp = state
        .http
        .post(url)
        .header("X-Application", state.app_key.as_str())
        .header("X-Authentication", token.as_str())
        .header("Content-Type", "application/json")
        .json(&request_body)
        .send()
        .await
        .map_err(|e| UiErrorPayload::unexpected(format!("request failed: {e}")))?;

    let status = resp.status();
    if !status.is_success() {
        let _text = resp.text().await.unwrap_or_default();
        warn!(status = %status, "get_account_funds failed");
        return Err(UiErrorPayload::unexpected(format!(
            "getAccountFunds failed: {status}"
        )));
    }

    let json_resp: serde_json::Value = resp
        .json()
        .await
        .map_err(|e| UiErrorPayload::unexpected(format!("invalid JSON response: {e}")))?;

    // Betfair JSON-RPC response shape: { "jsonrpc": "2.0", "result": {...}, "id": 1 }
    let result = json_resp
        .get("result")
        .ok_or_else(|| UiErrorPayload::unexpected("missing result field"))?;

    let funds: AccountFunds = serde_json::from_value(result.clone())
        .map_err(|e| UiErrorPayload::unexpected(format!("invalid funds response: {e}")))?;

    info!(available = ?funds.available_to_bet_balance, "get_account_funds success");
    Ok(funds)
}
