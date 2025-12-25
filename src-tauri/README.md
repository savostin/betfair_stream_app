# Tauri App (WIP)

This is the Tauri v2 app shell for the planned "proper app" migration.

## Dev

From repo root:

- UI dev server: `cd ui && npm run dev`
- Tauri dev: (requires `tauri-cli` installed)

## Config

- AppKey is resolved from `BETFAIR_APP_KEY`:
  - Prefer compile-time embedding via `option_env!("BETFAIR_APP_KEY")`.
  - Falls back to runtime env var for local development.

## Commands (current)
- `auth_login({ username, password })`
- `auth_logout()`
- `auth_status()`
- `betfair_rpc({ service, method, params })`

