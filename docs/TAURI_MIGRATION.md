# Tauri Migration Plan (Desktop-first, Mobile-ready)

## Summary
This repo has been migrated to a **proper Tauri v2 app** where the **Rust core owns authentication and all Betfair API calls**.

- The UI never sees or stores the Betfair session token.
- The Betfair AppKey is embedded in the app at build time.

## Target Architecture

### Components
- **Tauri Rust core**
  - `AuthManager`: logs in via Betfair Identity, stores session token in Rust state.
  - `BetfairRpcGateway`: generic JSON-RPC client for Betting/Account/Heartbeat APIs with allowlisted methods.
  - `StreamManager`: maintains Stream API connection and subscriptions, emits `mcm` updates as Tauri events.

- **UI (React/Vite/MUI)**
  - Calls `invoke()` for Betfair requests (no direct HTTP proxy calls).
  - Subscribes to stream updates via Tauri events.
  - Keeps rendering logic (tables, i18n, theme) and market-state reducer.

### Data Flow
1. UI calls `auth_login(username, password)`.
2. Rust logs in using embedded AppKey; stores token internally.
3. UI calls `betfair_rpc(service, method, params)`.
4. Rust injects `X-Application` + `X-Authentication` headers and returns JSON.
5. UI calls `stream_subscribe_market(marketId, options)`.
6. Rust authenticates stream using stored token; emits `betfair_stream_mcm` events.

## Notes

- The Tauri crate lives at the repo root.
- The UI lives in `ui/` and is built from `build.rs` during release builds (bundling).

### Phase 2 — “Full API support”
Goal: full coverage of Betfair JSON-RPC params/filters without adding hundreds of commands.

Steps:
1. Expand allowlists for Betting/Account/Heartbeat methods.
2. Add consistent Rust-side error normalization so the UI gets stable error shapes.
3. Optionally add a small typed TS wrapper for common methods, implemented on top of `betfair_rpc`.

### Phase 3 — Mobile readiness
Goal: keep the same architecture, adapt lifecycle and storage.

Steps:
1. Add token persistence using platform secure storage (Keychain/Keystore) via a Tauri/plugin.
2. Handle app background/foreground lifecycle:
   - reconnect, re-authenticate, and resubscribe
3. Review table UX on small screens (likely horizontal scroll / compact columns).

## Build/Config Notes
- Embed AppKey via build-time configuration (CI secret):
  - Example: `BETFAIR_APP_KEY` compiled into Rust.
- Ensure logs do not print tokens or auth headers.

## Open Questions
- Define “full support”: callable via generic JSON-RPC (fast) vs fully typed SDK (slow).
- Mobile UX expectations for the ladder table.
