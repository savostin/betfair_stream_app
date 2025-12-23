use thiserror::Error;

#[derive(Debug, Error)]
pub enum AppError {
    #[error("io error: {0}")]
    Io(#[from] std::io::Error),

    #[error("tls error: {0}")]
    Tls(String),

    #[error("json error: {0}")]
    Json(#[from] serde_json::Error),

    #[error("upstream codec error: {0}")]
    Codec(String),
}

impl From<tokio_rustls::rustls::Error> for AppError {
    fn from(value: tokio_rustls::rustls::Error) -> Self {
        Self::Tls(value.to_string())
    }
}

impl From<crate::codec::CodecError> for AppError {
    fn from(value: crate::codec::CodecError) -> Self {
        Self::Codec(value.to_string())
    }
}
