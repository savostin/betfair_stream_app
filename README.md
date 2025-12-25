# BetFair Stream API App (Tauri)

![GitHub Release](https://img.shields.io/github/v/release/savostin/betfair_stream_app.rs)

Cross-platform **Tauri v2** desktop app that connects to Betfair Exchange APIs:

- Auth (Identity): credentials handled in Rust; session token stays in Rust
- JSON-RPC (Sports/Account/Heartbeat): UI calls Rust via Tauri `invoke()`
- Stream API: Rust maintains the TLS stream and forwards updates to the UI via Tauri events

Repo layout:

- [ui/](ui/): React/Vite UI
- [src/](src/): Tauri (Rust) app core

## Prereqs

- Rust toolchain
- Node.js (for the UI)

## Dev

Run the UI dev server, then run the desktop app in dev mode:

```bash
npm --prefix ui run dev
cargo tauri dev
```

## Build (bundles/installers)

Build platform installers/bundles via the Tauri bundler:

```bash
cargo tauri build
```

The UI production build is executed from `build.rs` during release builds (set `TAURI_SKIP_UI_BUILD=1` to skip if `ui/dist` is already up to date).

Outputs are written under `target/**/release/bundle/` (e.g. `.dmg`, `.msi`, `.AppImage`, `.deb`).

## Configuration

The Betfair AppKey is expected at build time:

- `BETFAIR_APP_KEY` (set in CI via repository secrets)

Runtime settings are stored by the app; see the UI settings screen.

## CI/CD

- CI runs on PRs and pushes to `main`.
- Releases are built and published when pushing a tag matching `v*`.

Suggested release flow:

```bash
scripts/release.sh
```
