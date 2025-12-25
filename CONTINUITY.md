# CONTINUITY

## Goal (incl. success criteria):
- Maintain the Rust Betfair stream proxy with polished cross-platform packaging (macOS DMG, Windows MSI) and reliable release automation.
- Convert to a proper Tauri v2 desktop app where:
  - Betfair AppKey is embedded in Rust (no UI input).
  - Betfair session token is stored only on the Rust side.
  - UI requests Betfair operations via a Rust-owned allowlisted JSON-RPC gateway with full API param/filter support.
  - End-to-end works: login → load next horse WIN markets → select market → receive Stream API `mcm` updates and render prices.

## Constraints/Assumptions:
- WiX Toolset v3 used for MSI.
- Crate version stays semver `x.y.z`; MSI ProductVersion must be `x.y.z.w`.
- Release workflow builds with `--locked`; Cargo.lock must be committed and up to date.
- UI is Tauri-only (no legacy proxy/web mode).
- Dev secrets come from `src-tauri/.env` (ignored by git) or `BETFAIR_APP_KEY` env.

## Key decisions:
- macOS: produce `.app` via `scripts/macos-bundle.sh` and `.dmg` via `scripts/macos-dmg.sh`.
- Windows service install: single console exe with `--service`, service created/removed via WiX custom actions (WixQuietExec + `sc.exe`).
- Variant code consolidated under `src/variants/` and re-exported for compatibility.
- Human-friendly app/product name is centralized in `Cargo.toml` under `[package.metadata.app]` and exposed to scripts/workflows via `scripts/app-config.sh`.
- UI framework: use MUI (Material UI) for the React UI (mobile-friendly, compact layout).
- UI architecture: keep SPA single-screen with conditional auth gating, but split UI into app shell + feature components.
- Localization: use i18next/react-i18next with locale JSON (en/es) and a language selector.
- Theming: support light/dark mode via a ColorModeProvider persisted in localStorage; theme toggle in AppBar.

- Tauri direction:
  - Tauri v2 for desktop + future mobile.
  - Generic allowlisted Betfair JSON-RPC gateway command (full param/filter coverage).
  - Session token kept in Rust state; UI never receives/stores it.
  - AppKey embedded in Rust; `.env` supported for local dev.

## State:
- Done:
  - DMG packaging script and workflow wiring.
  - Linux release archive naming includes version from tag and uses app display name (sanitized) as the filename base.
  - Added Cargo.lock freshness checks in CI/release and `scripts/release.sh`.
  - WiX version passing fixes (ProductVersion variable passed from workflow).
  - Centralized app/product naming in `Cargo.toml` `[package.metadata.app]` and wired scripts/workflows to consume it via `scripts/app-config.sh` (portable on macOS default awk).
  - UI refactor: extracted orchestration out of `ui/src/App.tsx` into hooks (`useSession`, `useMarkets`, `useMarketStream`, `useAppSnackbar`) composed by `ui/src/app/useAppModel.ts`.
  - Added `ui/src/features/auth/LoginController.tsx` for username/password local state; `ui/src/App.tsx` is now a thin composer.
  - Verified UI builds successfully (`npm run build`).
  - Fixed infinite market reload loop by stabilizing `useMarkets` dependencies.
  - Removed inline settings block from Markets view; added a minimal Settings page with AppBar navigation.
  - Started Tauri implementation: added `src-tauri/` (Tauri v2) crate that builds on macOS.
  - Implemented Rust-owned auth state (session token stored in Rust) and a generic allowlisted `betfair_rpc` JSON-RPC command.
  - Added app icon for Tauri build (`src-tauri/icons/icon.png`) generated from `assets/icon.icns`.
  - Implemented initial Tauri Stream API plumbing: `stream_connect` authenticates using Rust-owned token, emits incoming CRLF frames as events, and `stream_send` allows outbound messages (excluding authentication).
  - Verified `src-tauri` builds successfully after stream changes (`cd src-tauri && cargo build`).
  - Embedded Betfair AppKey into the Tauri binary via build-time env `BETFAIR_APP_KEY` (fallback to runtime env for local dev).
  - Hid the AppKey + WS URL config block in the login UI when running inside Tauri.
  - Dropped legacy web/proxy mode: UI is now Tauri-only (no AppKey/WS URL fields, no `isTauri` branching, no token/appKey handling in the frontend).
  - Dev convenience: Tauri loads `BETFAIR_APP_KEY` from `.env` (ignored by git), preferring `src-tauri/.env` then `.env`.
  - Identity login parsing made more robust (JSON-first, fallback to URL-encoded) and `auth_login` returns structured `{ key, values }` errors (values include `code`, HTTP status, and content-type). Invalid responses log status/content-type/length (no body).
  - UI invoke error decoding hardened to handle Tauri v2 error shapes (direct object, nested `error`, JSON-in-message).
  - Added UI translations for Identity internal failures: `errors:betfair.identity.invalidResponse` and `errors:betfair.identity.missingSessionToken`.
  - Fixed Betfair JSON-RPC gateway to use fully-qualified method names (e.g. `SportsAPING/v1.0/listMarketCatalogue`) and unwrap batch responses into `result`.
  - Verified builds: `cd src-tauri && cargo build` and `npm --prefix ui run build`.
- Now:
  - Validate Identity login end-to-end (fix was made; confirm Betfair response format and successful token extraction).
  - Validate end-to-end Tauri flow (login → markets → select market → stream updates).
  - UNCONFIRMED: ensure the next tag/release contains packaging changes.
  - Investigate tiny Windows MSI size: ensure CAB is embedded (WiX `MediaTemplate EmbedCab="yes"`).
  - Safety net: upload any WiX-generated `dist/*.cab` alongside the MSI.

  - Architecture planning: document the Tauri migration and Betfair gateway design.
  - Implement Tauri-aware UI transport: use `invoke` for auth + `betfair_rpc`, and use events/commands for stream when running inside Tauri.
- Next:
  - Validate end-to-end in Tauri dev: run Vite dev server + run Tauri, then login, load markets, select market, see live updates.
  - Tag and publish a release built from the commit that contains the metadata + workflow updates.

## Open questions (UNCONFIRMED if needed):
- UNCONFIRMED: If login still fails, what exact response body/content-type does Betfair Identity return in your locale/account?

## Working set (files/ids/commands):
- installer/windows/product.wxs
- .github/workflows/release.yml
- scripts/release.sh
- .github/workflows/ci.yml
- Cargo.toml
- scripts/app-config.sh
- scripts/macos-bundle.sh
- scripts/macos-dmg.sh
- ui/ (React/Vite subproject)
