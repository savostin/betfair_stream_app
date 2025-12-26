use betfair_stream_app::commands;
use betfair_stream_app::state::AppState;

fn force_app_key_from_dotenv(dotenv_path: &std::path::Path) {
    let Ok(text) = std::fs::read_to_string(dotenv_path) else {
        return;
    };

    for raw_line in text.lines() {
        let line = raw_line.trim();
        if line.is_empty() || line.starts_with('#') {
            continue;
        }

        let Some((k, v)) = line.split_once('=') else {
            continue;
        };
        if k.trim() != "BETFAIR_APP_KEY" {
            continue;
        }

        let mut v = v.trim().to_string();
        if (v.starts_with('"') && v.ends_with('"')) || (v.starts_with('\'') && v.ends_with('\'')) {
            v = v[1..v.len().saturating_sub(1)].to_string();
        }

        if !v.trim().is_empty() {
            // Force `.env` to win for the AppKey so local dev isn't impacted by a
            // previously exported value (e.g. a dummy key used for CI/local builds).
            std::env::set_var("BETFAIR_APP_KEY", v);
        }

        break;
    }
}

fn main() {
    // Dev convenience: load env vars from `.env` (ignored by git).
    // `cargo tauri dev` can run the binary with a different working directory,
    // so load from the crate root explicitly first.
    let manifest_env = std::path::Path::new(env!("CARGO_MANIFEST_DIR")).join(".env");
    if manifest_env.exists() {
        let _ = dotenvy::from_path(&manifest_env);
        force_app_key_from_dotenv(&manifest_env);
    } else {
        let _ = dotenvy::dotenv();
    }

    tracing_subscriber::fmt()
        .with_env_filter(
            tracing_subscriber::EnvFilter::try_from_default_env().unwrap_or_else(|_| "info".into()),
        )
        .init();

    // Ensure a process-wide rustls CryptoProvider is installed.
    let _ = rustls::crypto::ring::default_provider().install_default();

    let http = reqwest::Client::builder()
        .user_agent("betfair_stream_app")
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
