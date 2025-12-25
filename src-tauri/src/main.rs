use betfair_stream_proxy_tauri::commands;
use betfair_stream_proxy_tauri::state::AppState;

fn main() {
    // Dev convenience: load env vars from .env (ignored by git).
    // Try both repo-root and src-tauri local .env to support different working directories.
    let _ = dotenvy::from_filename("src-tauri/.env");
    let _ = dotenvy::dotenv();

    tracing_subscriber::fmt()
        .with_env_filter(
            tracing_subscriber::EnvFilter::try_from_default_env().unwrap_or_else(|_| "info".into()),
        )
        .init();

    // Ensure a process-wide rustls CryptoProvider is installed.
    let _ = rustls::crypto::ring::default_provider().install_default();

    let http = reqwest::Client::builder()
        .user_agent("betfair_stream_proxy_tauri")
        .build()
        .expect("reqwest client");

    let state = AppState::new(http);

    tauri::Builder::default()
        .manage(state)
        .invoke_handler(tauri::generate_handler![
            commands::auth::auth_status,
            commands::auth::auth_login,
            commands::auth::auth_logout,
            commands::rpc::betfair_rpc,
            commands::stream::stream_connect,
            commands::stream::stream_send,
            commands::stream::stream_disconnect
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
