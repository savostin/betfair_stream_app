use reqwest::Client;
use std::collections::HashSet;
use std::sync::Arc;
use tokio::sync::RwLock;

use crate::stream::StreamConnection;

#[derive(Clone)]
pub struct AppState {
    pub app_key: Arc<String>,
    pub session_token: Arc<RwLock<Option<String>>>,
    pub http: Client,
    pub allowlist_betting: Arc<HashSet<String>>,
    pub allowlist_account: Arc<HashSet<String>>,
    pub allowlist_heartbeat: Arc<HashSet<String>>,
    pub stream: Arc<RwLock<Option<StreamConnection>>>,
}

impl AppState {
    pub fn new(http: Client) -> Self {
        Self {
            app_key: Arc::new(resolve_app_key()),
            session_token: Arc::new(RwLock::new(None)),
            http,
            allowlist_betting: Arc::new(build_allowlist_betting()),
            allowlist_account: Arc::new(build_allowlist_account()),
            allowlist_heartbeat: Arc::new(build_allowlist_heartbeat()),
            stream: Arc::new(RwLock::new(None)),
        }
    }
}

pub fn resolve_app_key() -> String {
    // Prefer runtime env for local dev (including values loaded from `.env` in `main.rs`).
    // This avoids getting stuck with a stale embedded key if you previously built with a
    // different `BETFAIR_APP_KEY`.
    if let Ok(v) = std::env::var("BETFAIR_APP_KEY") {
        let v = v.trim().to_string();
        if !v.is_empty() {
            return v;
        }
    }

    // Fallback to compile-time embedding (used for release bundling/CI).
    let embedded = option_env!("BETFAIR_APP_KEY").unwrap_or("");
    embedded.trim().to_string()
}

fn build_allowlist_betting() -> HashSet<String> {
    [
        "listEventTypes",
        "listCompetitions",
        "listTimeRanges",
        "listEvents",
        "listMarketTypes",
        "listCountries",
        "listVenues",
        "listMarketCatalogue",
        "listMarketBook",
        "listRunnerBook",
        "listCurrentOrders",
        "listClearedOrders",
        "listMarketProfitAndLoss",
        "placeOrders",
        "cancelOrders",
        "replaceOrders",
        "updateOrders",
    ]
    .into_iter()
    .map(|s| s.to_string())
    .collect()
}

fn build_allowlist_account() -> HashSet<String> {
    [
        "getAccountFunds",
        "getAccountDetails",
        "getDeveloperAppKeys",
        "getVendorClientId",
        "listCurrencyRates",
        "getAccountStatement",
    ]
    .into_iter()
    .map(|s| s.to_string())
    .collect()
}

fn build_allowlist_heartbeat() -> HashSet<String> {
    ["keepAlive"].into_iter().map(|s| s.to_string()).collect()
}
