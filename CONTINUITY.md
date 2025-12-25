# CONTINUITY

## Goal (incl. success criteria):
- Maintain the Rust Betfair stream proxy with polished cross-platform packaging (macOS DMG, Windows MSI) and reliable release automation.
- Create a React/Vite single-page app subproject (in a subfolder) that:
  - Stores an application key option.
  - Authenticates to Betfair (login+password) and stores a session token.
  - Fetches and displays the next 100 horse racing WIN markets via `listMarketCatalogue`.
  - On market selection: shows runners and subscribes to market updates via the local WebSocket proxy.
  - Builds and displays live market state from `mcm` updates per the Stream API delta rules.
  - Unsubscribes on market switch and supports logout (disconnect + clear session).
  - Presents a betting-app style runner table: 3 best Back prices, an LTP (last traded price) column, and 3 best Lay prices, plus market matched volume.
  - Keep the UI maintainable: avoid monolithic components; settings should be on a dedicated page (not an inline block).

## Constraints/Assumptions:
- WiX Toolset v3 used for MSI.
- Crate version stays semver `x.y.z`; MSI ProductVersion must be `x.y.z.w`.
- Release workflow builds with `--locked`; Cargo.lock must be committed and up to date.
- Main Rust proxy may be modified to serve the UI and to proxy Betfair HTTP endpoints so the SPA can run same-origin on `http://127.0.0.1:8080/`.

## Key decisions:
- macOS: produce `.app` via `scripts/macos-bundle.sh` and `.dmg` via `scripts/macos-dmg.sh`.
- Windows service install: single console exe with `--service`, service created/removed via WiX custom actions (WixQuietExec + `sc.exe`).
- Variant code consolidated under `src/variants/` and re-exported for compatibility.
- Human-friendly app/product name is centralized in `Cargo.toml` under `[package.metadata.app]` and exposed to scripts/workflows via `scripts/app-config.sh`.
- UI framework: use MUI (Material UI) for the React UI (mobile-friendly, compact layout).
- UI architecture: keep SPA single-screen with conditional auth gating, but split UI into app shell + feature components.
- Localization: use i18next/react-i18next with locale JSON (en/es) and a language selector.
- Theming: support light/dark mode via a ColorModeProvider persisted in localStorage; theme toggle in AppBar.

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
- Now:
  - UI polishing: full-width layout; compact runner table with Back(3-2-1), LTP, Lay(1-2-3); centered price/amount cells; show matched volume in header; hide settings when logged in; show info/error via top snackbars.
  - UI layout: make markets list + table fill remaining viewport height under the AppBar (flex layout; internal scrolling).
  - UI refactor: continue validating end-to-end flow (login → markets → select market → stream updates) after hook extraction and navigation changes.
  - UNCONFIRMED: ensure the next tag/release contains packaging changes.
  - Investigate tiny Windows MSI size: ensure CAB is embedded (WiX `MediaTemplate EmbedCab="yes"`).
  - Safety net: upload any WiX-generated `dist/*.cab` alongside the MSI.
- Next:
  - Validate end-to-end: UI served from the Rust proxy origin, login, load markets, select market, and see live Back/LTP/Lay updates.
  - Tag and publish a release built from the commit that contains the metadata + workflow updates.

## Open questions (UNCONFIRMED if needed):
- None.

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
