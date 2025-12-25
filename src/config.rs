use clap::Parser;

#[derive(Debug, Clone, Parser)]
#[command(name = "betfair_stream_proxy")]
pub struct Config {
    /// Run with a GUI (system tray icon + Exit menu).
    ///
    /// Requires building with `--features gui`.
    #[arg(long, env = "GUI", default_value_t = false)]
    pub gui: bool,

    /// Address to bind the HTTP/WebSocket server on.
    #[arg(long, env = "BIND", default_value = "127.0.0.1:8080")]
    pub bind: String,

    /// Betfair streaming host.
    #[arg(long, env = "BETFAIR_HOST", default_value = "stream-api.betfair.com")]
    pub betfair_host: String,

    /// Betfair streaming port.
    #[arg(long, env = "BETFAIR_PORT", default_value_t = 443)]
    pub betfair_port: u16,

    /// Max upstream frame size in bytes before closing.
    #[arg(long, env = "UPSTREAM_MAX_FRAME_BYTES", default_value_t = 1_048_576)]
    pub upstream_max_frame_bytes: usize,

    /// WS outbound buffer (upstream->browser) messages.
    #[arg(long, env = "WS_OUTBOUND_BUFFER", default_value_t = 1024)]
    pub ws_outbound_buffer: usize,

    /// Comma-separated list of allowed Origin values for browser WebSocket connections.
    ///
    /// Empty means allow all origins.
    #[arg(long, env = "ALLOWED_ORIGINS", default_value = "")]
    pub allowed_origins: String,

    /// Upstream TCP/TLS connect timeout (milliseconds).
    #[arg(long, env = "UPSTREAM_CONNECT_TIMEOUT_MS", default_value_t = 10_000)]
    pub upstream_connect_timeout_ms: u64,

    /// Require the browser to send the first upstream message within this timeout (milliseconds).
    ///
    /// Betfair will close idle connections with TIMEOUT if no message is sent shortly after connect.
    #[arg(long, env = "FIRST_MESSAGE_TIMEOUT_MS", default_value_t = 10_000)]
    pub first_message_timeout_ms: u64,

    /// Maximum size of a single browser->proxy WebSocket message (bytes).
    #[arg(long, env = "WS_MAX_MESSAGE_BYTES", default_value_t = 1_048_576)]
    pub ws_max_message_bytes: usize,

    /// Timeout for writing a single message to the browser WebSocket (milliseconds).
    ///
    /// If exceeded, the proxy disconnects the client as "too slow".
    #[arg(long, env = "WS_SEND_TIMEOUT_MS", default_value_t = 5_000)]
    pub ws_send_timeout_ms: u64,

    /// Serve the built web UI (Vite output) from `/`.
    #[arg(long, env = "SERVE_UI", default_value_t = true)]
    pub serve_ui: bool,

    /// Directory containing the built UI assets (expects `index.html`).
    ///
    /// Default assumes you run from the repo root after building the UI: `ui/dist`.
    #[arg(long, env = "UI_DIR", default_value = "ui/dist")]
    pub ui_dir: String,

    /// Enable HTTP reverse proxies for Betfair Identity and Betting API.
    ///
    /// Routes:
    /// - `/bf-identity/*` -> `https://identitysso.betfair.com/*`
    /// - `/bf-api/*` -> `https://api.betfair.com/*`
    #[arg(long, env = "SERVE_BETFAIR_HTTP", default_value_t = true)]
    pub serve_betfair_http: bool,

    /// Run as a Windows Service (used by SCM).
    ///
    /// This is intended to be launched by Windows Service Control Manager, not by users.
    #[cfg(windows)]
    #[arg(long, env = "SERVICE", default_value_t = false, hide = true)]
    pub service: bool,
}

impl Config {
    pub fn parse() -> Self {
        <Self as Parser>::parse()
    }
}

impl Config {
    pub fn allowed_origins_set(&self) -> std::collections::HashSet<String> {
        self.allowed_origins
            .split(',')
            .map(|s| s.trim())
            .filter(|s| !s.is_empty())
            .map(|s| s.to_string())
            .collect()
    }
}
