use crate::{codec::CrlfTextCodec, config::Config, error::AppError};
use futures_util::{SinkExt, StreamExt};
use rustls_pki_types::ServerName;
use tokio::net::TcpStream;
use tokio_rustls::{client::TlsStream, TlsConnector};
use tokio_util::codec::Framed;

pub struct Upstream {
    framed: Option<Framed<TlsStream<TcpStream>, CrlfTextCodec>>,
}

pub struct UpstreamReader {
    inner: futures_util::stream::SplitStream<Framed<TlsStream<TcpStream>, CrlfTextCodec>>,
}

pub struct UpstreamWriter {
    inner: futures_util::stream::SplitSink<Framed<TlsStream<TcpStream>, CrlfTextCodec>, String>,
}

impl Upstream {
    pub fn split(self) -> (UpstreamWriter, UpstreamReader) {
        let framed = self.framed.expect("present");
        let (sink, stream) = framed.split();
        (
            UpstreamWriter { inner: sink },
            UpstreamReader { inner: stream },
        )
    }
}

impl UpstreamReader {
    pub async fn next_line(&mut self) -> Option<Result<String, AppError>> {
        match self.inner.next().await {
            Some(Ok(s)) => Some(Ok(s)),
            Some(Err(e)) => Some(Err(AppError::from(e))),
            None => None,
        }
    }
}

impl UpstreamWriter {
    pub async fn send_line(&mut self, line: &str) -> Result<(), AppError> {
        self.inner.send(line.to_string()).await?;
        Ok(())
    }

    pub async fn close(&mut self) -> Result<(), AppError> {
        self.inner.close().await?;
        Ok(())
    }
}

pub async fn connect(cfg: &Config, tls: &TlsConnector) -> Result<Upstream, AppError> {
    let addr = format!("{}:{}", cfg.betfair_host, cfg.betfair_port);
    let tcp = tokio::time::timeout(
        std::time::Duration::from_millis(cfg.upstream_connect_timeout_ms),
        TcpStream::connect(addr),
    )
    .await
    .map_err(|_| {
        AppError::Io(std::io::Error::new(
            std::io::ErrorKind::TimedOut,
            "upstream connect timeout",
        ))
    })??;

    let server_name = ServerName::try_from(cfg.betfair_host.clone())
        .map_err(|_| AppError::Tls("invalid betfair host for SNI".to_string()))?;

    let tls_stream = tokio::time::timeout(
        std::time::Duration::from_millis(cfg.upstream_connect_timeout_ms),
        tls.connect(server_name, tcp),
    )
    .await
    .map_err(|_| AppError::Tls("upstream tls handshake timeout".to_string()))??;

    let framed = Framed::new(tls_stream, CrlfTextCodec::new(cfg.upstream_max_frame_bytes));

    Ok(Upstream {
        framed: Some(framed),
    })
}
