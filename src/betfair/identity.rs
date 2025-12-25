use reqwest::Client;
use tracing::warn;

use crate::ui_error::UiErrorPayload;

#[derive(Debug, serde::Deserialize)]
#[serde(rename_all = "camelCase")]
struct IdentityJsonResponse {
    status: Option<String>,
    token: Option<String>,
    session_token: Option<String>,
    error: Option<String>,
}

fn identity_error_payload(code: &str, status_code: reqwest::StatusCode, content_type: &str) -> UiErrorPayload {
    let known = [
        "INVALID_USERNAME_OR_PASSWORD",
        "ACCOUNT_LOCKED",
        "ACCOUNT_SUSPENDED",
        "INVALID_APP_KEY",
        "INVALID_CONNECTIVITY_TO_REGULATOR_DK",
        "INVALID_CONNECTIVITY_TO_REGULATOR_IT",
        "INVALID_CONNECTIVITY_TO_REGULATOR_NZ",
        "KYC_SUSPEND",
        "PENDING_AUTH",
        "SECURITY_QUESTION_WRONG_3X",
        "SELF_EXCLUDED",
        "TOO_MANY_REQUESTS",
    ];

    let key = if known.contains(&code) {
        format!("errors:betfair.identity.{code}")
    } else if code == "INVALID_RESPONSE" {
        "errors:betfair.identity.invalidResponse".to_string()
    } else if code == "MISSING_SESSION_TOKEN" {
        "errors:betfair.identity.missingSessionToken".to_string()
    } else {
        "errors:betfair.identity.unknown".to_string()
    };

    UiErrorPayload::with_values(
        key,
        serde_json::json!({
            "code": code,
            "httpStatus": status_code.as_u16(),
            "contentType": content_type,
        }),
    )
}

pub async fn login(
    http: &Client,
    app_key: &str,
    username: &str,
    password: &str,
) -> Result<String, UiErrorPayload> {
    // Betfair Identity endpoint: returns URL-encoded body like:
    // status=SUCCESS&token=... OR status=FAIL&error=...
    let resp = http
        .post("https://identitysso.betfair.com/api/login")
        .header("X-Application", app_key)
        .header("Accept", "application/json")
        .header("Content-Type", "application/x-www-form-urlencoded")
        .form(&[("username", username.trim()), ("password", password)])
        .send()
        .await
        .map_err(|e| UiErrorPayload::unexpected(format!("request failed: {e}")))?;

    let status_code = resp.status();
    let content_type = resp
        .headers()
        .get(reqwest::header::CONTENT_TYPE)
        .and_then(|h| h.to_str().ok())
        .unwrap_or("")
        .to_string();

    let text = resp
        .text()
        .await
        .map_err(|e| UiErrorPayload::unexpected(format!("read failed: {e}")))?;

    // If we got a non-2xx response, try to parse error code anyway.
    if !status_code.is_success() {
        // Betfair sometimes returns URL-encoded or JSON even on error.
        // Try parsing below; if nothing matches, return unexpected.
    }

    // Parse JSON if content-type suggests it or the body looks like JSON.
    if content_type.to_ascii_lowercase().contains("json") || text.trim_start().starts_with('{') {
        if let Ok(v) = serde_json::from_str::<IdentityJsonResponse>(&text) {
            let status = v.status.unwrap_or_default();
            if status == "SUCCESS" {
                let tok = v
                    .session_token
                    .or(v.token)
                    .unwrap_or_default()
                    .trim()
                    .to_string();
                if tok.is_empty() {
                    return Err(identity_error_payload(
                        "MISSING_SESSION_TOKEN",
                        status_code,
                        content_type.as_str(),
                    ));
                }
                return Ok(tok);
            }

            if status == "FAIL" {
                let code = v.error.unwrap_or_else(|| "UNKNOWN".to_string());
                return Err(identity_error_payload(code.trim(), status_code, content_type.as_str()));
            }
        }
    }

    let mut status: Option<String> = None;
    let mut token: Option<String> = None;
    let mut error: Option<String> = None;

    for part in text.split('&') {
        let mut it = part.splitn(2, '=');
        let k = it.next().unwrap_or("");
        let v = it.next().unwrap_or("");
        let v = urlencoding::decode(v).unwrap_or_else(|_| v.into()).to_string();
        match k {
            "status" => status = Some(v),
            "token" => token = Some(v),
            "error" => error = Some(v),
            _ => {}
        }
    }

    match status.as_deref() {
        Some("SUCCESS") => {
            let Some(tok) = token.filter(|t| !t.trim().is_empty()) else {
                return Err(identity_error_payload(
                    "MISSING_SESSION_TOKEN",
                    status_code,
                    content_type.as_str(),
                ));
            };
            Ok(tok)
        }
        Some("FAIL") => {
            let code = error.unwrap_or_else(|| "UNKNOWN".to_string());
            Err(identity_error_payload(code.trim(), status_code, content_type.as_str()))
        }
        _ => {
            // Common reason: HTML/redirect response (geo/regulator) or unexpected format.
            warn!(
                http_status = %status_code,
                content_type = %content_type,
                text_len = text.len(),
                "identity login invalid response"
            );
            Err(identity_error_payload(
                "INVALID_RESPONSE",
                status_code,
                content_type.as_str(),
            ))
        }
    }
}
