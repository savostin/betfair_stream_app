use crate::betfair;
use crate::state::AppState;
use crate::ui_error::UiErrorPayload;
use serde::{Deserialize, Serialize};
use tauri::State;
use tracing::{info, warn};

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct AuthStatus {
    pub is_logged_in: bool,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AuthLoginArgs {
    pub username: String,
    pub password: String,
}

#[tauri::command]
pub async fn auth_status(state: State<'_, AppState>) -> Result<AuthStatus, String> {
    let token = state.session_token.read().await;
    info!("auth_status");
    Ok(AuthStatus {
        is_logged_in: !token.as_deref().unwrap_or("").is_empty(),
    })
}

#[tauri::command]
pub async fn auth_logout(state: State<'_, AppState>) -> Result<(), String> {
    info!("auth_logout");
    let mut token = state.session_token.write().await;
    *token = None;
    Ok(())
}

#[tauri::command]
pub async fn auth_login(
    state: State<'_, AppState>,
    args: AuthLoginArgs,
) -> Result<(), UiErrorPayload> {
    info!(username = %args.username.trim(), "auth_login");
    if args.username.trim().is_empty() {
        return Err(UiErrorPayload::key("errors:validation.usernameRequired"));
    }
    if args.password.is_empty() {
        return Err(UiErrorPayload::key("errors:validation.passwordRequired"));
    }

    if state.app_key.trim().is_empty() {
        return Err(UiErrorPayload::key("errors:validation.appKeyRequired"));
    }

    let token = betfair::identity::login(
        &state.http,
        state.app_key.as_str(),
        args.username.trim(),
        &args.password,
    )
    .await
    .inspect_err(|e| {
        warn!(key = %e.key, "auth_login failed");
    })?;

    let mut token_state = state.session_token.write().await;
    *token_state = Some(token);

    info!("auth_login success");

    Ok(())
}
