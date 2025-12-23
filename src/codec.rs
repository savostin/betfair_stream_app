use bytes::{Buf, BytesMut};
use std::fmt;
use tokio_util::codec::{Decoder, Encoder};

#[derive(Debug)]
pub struct CodecError(String);

impl From<std::io::Error> for CodecError {
    fn from(value: std::io::Error) -> Self {
        Self(value.to_string())
    }
}

impl fmt::Display for CodecError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        f.write_str(&self.0)
    }
}

impl std::error::Error for CodecError {}

/// CRLF-delimited UTF-8 text codec.
///
/// Betfair Exchange Stream API frames are JSON terminated with \r\n.
pub struct CrlfTextCodec {
    max_len: usize,
}

impl CrlfTextCodec {
    pub fn new(max_len: usize) -> Self {
        Self { max_len }
    }
}

impl Decoder for CrlfTextCodec {
    type Item = String;
    type Error = CodecError;

    fn decode(&mut self, src: &mut BytesMut) -> Result<Option<Self::Item>, Self::Error> {
        // Find "\r\n"
        let mut i = 0;
        while i + 1 < src.len() {
            if src[i] == b'\r' && src[i + 1] == b'\n' {
                let line = src.split_to(i);
                // Drop CRLF
                src.advance(2);

                if line.len() > self.max_len {
                    return Err(CodecError("frame exceeds max length".to_string()));
                }

                let text = std::str::from_utf8(&line)
                    .map_err(|_| CodecError("non-utf8 upstream frame".to_string()))?
                    .to_string();
                return Ok(Some(text));
            }
            i += 1;
        }

        if src.len() > self.max_len {
            return Err(CodecError(
                "buffer exceeds max length without delimiter".to_string(),
            ));
        }

        Ok(None)
    }
}

impl Encoder<String> for CrlfTextCodec {
    type Error = CodecError;

    fn encode(&mut self, item: String, dst: &mut BytesMut) -> Result<(), Self::Error> {
        if item.len() > self.max_len {
            return Err(CodecError("frame exceeds max length".to_string()));
        }
        dst.extend_from_slice(item.as_bytes());
        dst.extend_from_slice(b"\r\n");
        Ok(())
    }
}

impl Encoder<&str> for CrlfTextCodec {
    type Error = CodecError;

    fn encode(&mut self, item: &str, dst: &mut BytesMut) -> Result<(), Self::Error> {
        if item.len() > self.max_len {
            return Err(CodecError("frame exceeds max length".to_string()));
        }
        dst.extend_from_slice(item.as_bytes());
        dst.extend_from_slice(b"\r\n");
        Ok(())
    }
}
