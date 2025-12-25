# Architecture

This repo is a single Tauri v2 desktop app.

## Components

- UI: React/Vite app in `ui/`
  - Calls Rust via Tauri `invoke()`
  - Receives Stream API updates via Tauri events

- Rust core: Tauri app in `src/`
  - Owns Betfair auth (session token never leaves Rust)
  - Provides an allowlisted Betfair JSON-RPC gateway
  - Maintains the Stream API TLS connection and subscriptions

## Data flow (high level)

1. UI calls `auth_login(username, password)`.
2. Rust logs in, stores the session token internally.
3. UI calls `betfair_rpc(service, method, params)`.
4. Rust injects `X-Application` and `X-Authentication` headers and returns the JSON result.
5. UI initiates streaming; Rust emits updates as Tauri events (e.g. market changes).
