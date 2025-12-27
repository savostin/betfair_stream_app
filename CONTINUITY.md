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
- Now:
  - Runner status filtering & display complete. HIDDEN runners hidden completely. REMOVED runners: all price cells (back depth 3, b1, LTP, lay depth 3) joined into single colspan cell showing adjustment factor (×0.5) and removal date/time centered on light error background. ACTIVE/WINNER/LOSER rows show normally. Build succeeds.

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
  - Restored the repo to a clean, non-debug state at `dev` HEAD (`dc05193`) after identifying the root cause outside the code; removed local debug/duplicate client changes and verified `cargo build` + `npm --prefix ui run build`.
- Confirmed Betfair RPC `ANGX-0007` root cause was a stale/dummy AppKey in the environment; runtime `.env` loading and precedence are now robust (crate-root `.env`, `.env` overrides sticky exported values).
- Removed Tauri `beforeBuildCommand`/`beforeDevCommand` hooks and moved UI production build into `build.rs` for release builds (opt-out via `TAURI_SKIP_UI_BUILD=1`).
  - Implemented account funds display in app header with configurable periodic refresh (minimum 15 seconds, default 30 seconds).
  - Uses generic `betfair_rpc` command for account API calls (consistent with existing betting API pattern).
  - Fetches account details (including currencyCode) alongside funds on authentication.
  - Currency symbol dynamically displayed based on account currency (GBP→£, EUR→€, USD→$, etc.) with fallback to currency code.
  - Created `useFunds` hook with periodic refresh based on user-configurable interval in settings.
  - Added `getCurrencySymbol` helper in format.ts with support for 11 common currencies.
  - Settings panel includes TextField for configuring funds refresh interval with minimum 15 seconds validation.
  - Created proper modular TypeScript architecture for Betfair API client:
    - `ui/src/lib/betfair/types/{common,account,betting}.ts` - Domain-separated types
    - `ui/src/lib/betfair/{account,betting}.ts` - Typed API method implementations
    - `ui/src/lib/betfair/index.ts` - Re-exports all types and functions
    - `ui/src/lib/betfair.ts` - Legacy wrapper (re-exports + auth functions for backwards compatibility)
  - Updated all imports throughout codebase to use new modular structure.
  - Verified builds: `cargo build` and `npm --prefix ui run build` both succeed.
  - Implemented one-click betting feature:
    - Added bet size (default £10, min £0.50) and price offset (0-10 ticks) settings to SettingsPanel with localStorage persistence.
    - Updated `incrementPrice` and `decrementPrice` in `price.ts` to accept `ticks` parameter for multi-tick price adjustments.
    - Added `listMarketProfitAndLoss` API: types in `types/betting.ts`, implementation in `api/betting.ts`, exported from `index.ts`.
    - Created `quickPlaceBet()` function in `betting.ts` that reads settings, applies tick offset (decrement for BACK, increment for LAY), places LIMIT order with LAPSE persistence.
    - Wired quick-place to B1/L1 price cells in MarketTable - click to place bet instantly without confirmation.
    - PriceAmountCell now accepts onClick/clickable props with hover effects (opacity + scale).
    - Created `useMarketProfitAndLoss` hook with 5-second refresh interval polling `listMarketProfitAndLoss`.
    - Display live P&L under runner names in MarketTable: green for profit, red for loss, shows `ifWin` or `ifLose` value.
    - Added bet placement notifications with i18n (success info, error codes like INSUFFICIENT_FUNDS, INVALID_ODDS).
    - Quick-place automatically refreshes orders and account funds queries on successful bet placement.
    - Added `listMarketProfitAndLoss` to Rust betting allowlist in `src/state.rs`.
    - Modified `listNextHorseWinMarkets` to include races from -10 minutes ago.
    - Refined hover effects on B1/L1 cells: removed zoom/opacity, now uses header background color on entire TableCell.
    - Refactored stream types: moved all type definitions from `streamState.ts` to `stream-types/stream-types.ts`, added `@stream-types/*` path alias in `tsconfig.app.json`, updated imports in `streamState.ts` (imports and re-exports) and `useMarketStream.ts`.
    - Added market status display (IN-PLAY/status) from stream marketDefinition under market name.
    - Added price ladder depth setting (best only vs best 3), stored in settings and applied to market table rendering.
  - Verified builds: `cargo build` and `npm --prefix ui run build` both succeed.

  ## Key decisions (update):
  - Separated general Betfair API methods into `ui/src/lib/betfair/api/` (`account.ts`, `betting.ts`).
  - Kept custom convenience wrappers in `ui/src/lib/betfair/` (e.g., `listNextHorseWinMarkets`, `quickPlaceBet`).
  - Central re-exports in `ui/src/lib/betfair/index.ts` now export general methods from `api/` and custom wrappers from top-level.
  - One-click betting: no confirmation dialog for speed; price offset applied automatically based on side (BACK decrements, LAY increments).

  ## State (delta):
  - Done:
    - ✅ Created `ui/src/lib/betfair/api/account.ts` and `api/betting.ts` with typed general methods.
    - ✅ Updated `ui/src/lib/betfair/index.ts` to re-export from `api/` and custom.
    - ✅ Refactored `ui/src/lib/betfair/betting.ts` to only hold custom helpers and import general methods from `api/`.
    - ✅ Build verified after separation (npm run build ✓).
    - ✅ Added `ui/src/lib/betfair/invoke.ts` with `betfairInvoke<T>()` to wrap `tauriInvoke('betfair_rpc', ...)` and refactored API calls to use it (reduces duplication and centralizes RPC command usage).
    - ✅ Extended invoke helper with `betfairInvokeSafe<T>()` that centralizes error extraction (`extractInvokeUiError`) and throws `UiError` for structured errors; updated API methods to use the safe wrapper (removed local try/catch duplication).
    - ✅ Removed legacy duplicated account API in `ui/src/lib/betfair/account.ts` and replaced with a thin re-export to `ui/src/lib/betfair/api/account.ts`.
    - ✅ Added TS/Vite path aliases (`@lib`, `@errors`, `@betfair`) and refactored imports to use them.
    - ✅ Currency symbols threaded to matched volume and amounts in markets table.

- Now:
  - **TanStack Query Migration (Complete)**
    - ✅ Installed @tanstack/react-query v5
    - ✅ Created `ui/src/lib/queries.ts` with 6 query hooks (useAccountFunds, useAccountDetails, useNextHorseWinMarkets, useCurrentOrders, useAccountStatement) + 2 mutation hooks + utility function
    - ✅ Updated `ui/src/app/AppProviders.tsx` with QueryClientProvider setup (staleTime: 30s, gcTime: 5min, retry: 1)
    - ✅ Rewrote `ui/src/app/useAppModel.ts` to use TanStack Query hooks instead of custom hooks
    - ✅ Removed legacy hooks `useFunds.ts` and `useMarkets.ts`
    - ✅ MarketsView/App now consume the query-backed model directly (prop plumbing simplified)
    - ✅ UI build succeeded (`npm --prefix ui run build` - passes TypeScript strict mode)
  - **Domain context split**
    - ✅ Added context-wrapped hooks for session, notifications (snackbar+status), account (funds/details), markets list, selected market (stream + selection), and orders under `ui/src/hooks/*Context.tsx`
    - ✅ AppProviders now composes these providers
    - ✅ App/Markets components consume contexts directly; removed `useAppModel`
    - ✅ AppShell consumes contexts directly (no prop drilling for auth/funds/status/snackbar)
    - ✅ UI build succeeds after refactor
   - **Navigation context for Tauri SPA routing**
     - ✅ Added NavigationProvider with page enum (main, settings, accountStatement, orders)
     - ✅ App uses currentPage from navigation context and renders appropriate component
     - ✅ Auth gating: unauthenticated users see only LoginController; authenticated users see pages
     - ✅ SessionContext.logout resets navigation to 'main'
     - ✅ Removed isSettingsPage props from AppShell; uses navigation hooks for nav buttons
     - ✅ UI build succeeds
- .github/workflows/ci.yml
- scripts/release.sh
- scripts/app-config.sh
- README.md
- ui/ (React/Vite subproject)
- ui/src/lib/betfair/types/{common,betting}.ts
- ui/src/lib/betfair/api/{account,betting}.ts
- ui/src/lib/betfair/index.ts
- src/ (Tauri app)
- tauri.conf.json

