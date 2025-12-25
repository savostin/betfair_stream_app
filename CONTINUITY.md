# CONTINUITY

## Goal (incl. success criteria):
- Maintain a single, Tauri v2 desktop app with reliable cross-platform packaging (macOS DMG, Windows MSI, Linux AppImage/deb) and release automation.
- Eliminate the legacy proxy/server project completely; the repo builds/packages only the Tauri app.
- App behavior:
  - Betfair AppKey is embedded in Rust (no UI input).
  - Betfair session token is stored only on the Rust side.
  - UI requests Betfair operations via a Rust-owned allowlisted JSON-RPC gateway with full API param/filter support.
  - End-to-end works: login → load next horse WIN markets → select market → receive Stream API `mcm` updates and render prices.

## Constraints/Assumptions:
- Packaging is produced by the Tauri bundler (no custom `.app`/DMG scripts, no custom WiX project files).
- Crate version stays semver `x.y.z`; MSI ProductVersion must be `x.y.z.w`.
- Release workflow builds with `--locked`; Cargo.lock must be committed and up to date.
- UI is Tauri-only (no legacy proxy/web mode).
- Dev secrets come from `.env` (ignored by git) or `BETFAIR_APP_KEY` env.

## Key decisions:
- Use Tauri bundler outputs as the canonical release artifacts (DMG/MSI/AppImage/deb) driven by `cargo tauri build`.
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
  - Started Tauri implementation and later moved the Tauri crate to the repo root.
  - Implemented Rust-owned auth state (session token stored in Rust) and a generic allowlisted `betfair_rpc` JSON-RPC command.
  - Added app icon for Tauri build (generated from `assets/icon.icns`).
  - Implemented initial Tauri Stream API plumbing: `stream_connect` authenticates using Rust-owned token, emits incoming CRLF frames as events, and `stream_send` allows outbound messages (excluding authentication).
  - Verified the Rust app builds successfully.
  - Embedded Betfair AppKey into the Tauri binary via build-time env `BETFAIR_APP_KEY` (fallback to runtime env for local dev).
  - Hid the AppKey + WS URL config block in the login UI when running inside Tauri.
  - Dropped legacy web/proxy mode: UI is now Tauri-only (no AppKey/WS URL fields, no `isTauri` branching, no token/appKey handling in the frontend).
  - Dev convenience: Tauri loads `BETFAIR_APP_KEY` from `.env` (ignored by git).
  - Identity login parsing made more robust (JSON-first, fallback to URL-encoded) and `auth_login` returns structured `{ key, values }` errors (values include `code`, HTTP status, and content-type). Invalid responses log status/content-type/length (no body).
  - UI invoke error decoding hardened to handle Tauri v2 error shapes (direct object, nested `error`, JSON-in-message).
  - Added UI translations for Identity internal failures: `errors:betfair.identity.invalidResponse` and `errors:betfair.identity.missingSessionToken`.
  - Fixed Betfair JSON-RPC gateway to use fully-qualified method names (e.g. `SportsAPING/v1.0/listMarketCatalogue`) and unwrap batch responses into `result`.
  - Verified builds: `cargo build` and `npm --prefix ui run build`.
  - Converted repository to a single root crate and removed legacy proxy crate sources.
  - Updated CI and release workflows to build the UI and bundle installers via `cargo tauri build`.
  - Updated root README to reflect Tauri-only usage.
  - Removed obsolete legacy packaging files/scripts.
  - Ran local `cargo tauri build` (macOS) and confirmed bundler outputs land under `target/<target>/release/bundle/**`.
  - Verified root-layout build hooks are reliable: `cargo tauri build --ci --bundles dmg` succeeds from repo root and runs UI build via the Node helper scripts.
  - Repo audit: no remaining legacy proxy/service references (excluding `target/` and `ui/node_modules/`).
  - Confirmed `cargo build` succeeds after the root-layout + hook changes.
  - Updated remaining markdown/docs naming to "BetFair Stream API App" and removed stale references.
  - Committed the Tauri-only root-layout migration + naming updates (commit: e38a0ff).
  - Switched Tauri bundling icon paths to `assets/icon.*` and removed the unused `icons/` folder (commit: f118416).
  - Removed legacy `assets/index.html` (temporary UI from the old app).
  - Added a safety guard in `scripts/release.sh` to refuse releasing from non-`main` branches (and from detached HEAD).
  - Fixed release workflow to build `ui/dist` before `cargo tauri build` (Tauri validates `frontendDist` early); bundling step sets `TAURI_SKIP_UI_BUILD=1` to avoid double-building.
  - Fixed release workflow artifact collection: replaced non-portable `**` globs with a `find` loop and fail-fast when no bundle outputs are produced (prevents empty `dist/*` uploads).
  - Fixed CI clippy failures (`len()>0` and `manual_inspect`) and committed Cargo.lock update.
- Confirmed Betfair RPC `ANGX-0007` root cause was a stale/dummy AppKey in the environment; runtime `.env` loading and precedence are now robust (crate-root `.env`, `.env` overrides sticky exported values).
- Removed Tauri `beforeBuildCommand`/`beforeDevCommand` hooks and moved UI production build into `build.rs` for release builds (opt-out via `TAURI_SKIP_UI_BUILD=1`).
- Now:
  - Audit Windows/Linux CI + release workflows after the Tauri-only root-layout switch (deps, artifact collection, redundant UI builds).
  - Validate release workflow artifact collection paths and shell compatibility on all OS runners (macOS/Windows/Linux).
  - Workflow tweaks (committed):
    - CI skips `build.rs` UI build during `cargo build --release` via `TAURI_SKIP_UI_BUILD=1`.
    - Release fails fast if `BETFAIR_APP_KEY` secret is missing/empty (prevents shipping bundles without embedded AppKey).
  - Local validation: `TAURI_SKIP_UI_BUILD=1 cargo build --release --locked` succeeds on macOS.
- Next:
  - Make any minimal workflow fixes needed for Windows/Linux bundling.
  - Commit the CI/release workflow adjustments (if uncommitted), then tag and publish a release.

## Open questions (UNCONFIRMED if needed):
- UNCONFIRMED: If login still fails, what exact response body/content-type does Betfair Identity return in your locale/account?

## Working set (files/ids/commands):
- .github/workflows/release.yml
- .github/workflows/ci.yml
- scripts/release.sh
- scripts/app-config.sh
- README.md
- ui/ (React/Vite subproject)
- src/ (Tauri app)
- tauri.conf.json

