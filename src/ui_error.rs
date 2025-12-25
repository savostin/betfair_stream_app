use serde::Serialize;

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct UiErrorPayload {
    pub key: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub values: Option<serde_json::Value>,
}

impl UiErrorPayload {
    pub fn key(key: impl Into<String>) -> Self {
        Self {
            key: key.into(),
            values: None,
        }
    }

    pub fn with_values(key: impl Into<String>, values: serde_json::Value) -> Self {
        Self {
            key: key.into(),
            values: Some(values),
        }
    }

    pub fn unexpected(details: impl Into<String>) -> Self {
        Self::with_values(
            "errors:unexpected.withDetails",
            serde_json::json!({ "details": details.into() }),
        )
    }
}
