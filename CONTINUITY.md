# CONTINUITY

## Goal (incl. success criteria):
- Ship a production-grade Rust Betfair stream proxy with polished cross-platform packaging (macOS DMG, Windows MSI) and reliable release automation.

## Constraints/Assumptions:
- WiX Toolset v3 used for MSI.
- Crate version stays semver `x.y.z`; MSI ProductVersion must be `x.y.z.w`.
- Release workflow builds with `--locked`; Cargo.lock must be committed and up to date.

## Key decisions:
- macOS: produce `.app` via `scripts/macos-bundle.sh` and `.dmg` via `scripts/macos-dmg.sh`.
- Windows service install: single console exe with `--service`, service created/removed via WiX custom actions (WixQuietExec + `sc.exe`).
- Variant code consolidated under `src/variants/` and re-exported for compatibility.
- Human-friendly app/product name is centralized in `Cargo.toml` under `[package.metadata.app]` and exposed to scripts/workflows via `scripts/app-config.sh`.

## State:
- Done:
  - DMG packaging script and workflow wiring.
  - Added Cargo.lock freshness checks in CI/release and `scripts/release.sh`.
  - WiX version passing fixes (ProductVersion variable passed from workflow).
  - Centralized app/product naming in `Cargo.toml` `[package.metadata.app]` and wired scripts/workflows to consume it via `scripts/app-config.sh` (portable on macOS default awk).
- Now:
  - UNCONFIRMED: ensure the next tag/release contains these changes.
- Next:
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
