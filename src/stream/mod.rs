pub const EVENT_STREAM_LINE: &str = "betfair_stream_line";

pub struct StreamConnection {
    pub tx: tokio::sync::mpsc::Sender<String>,
}
