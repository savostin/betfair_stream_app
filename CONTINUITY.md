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

## State:
- Done:
  - DMG packaging script and workflow wiring.
  - Added Cargo.lock freshness checks in CI/release and `scripts/release.sh`.
  - WiX version passing fixes (ProductVersion variable passed from workflow).
- Now:
  - Fix Windows MSI build error: WiX `Duplicate symbol 'Binary:WixCA'` due to defining `Binary Id="WixCA"` while linking `WixUtilExtension`.
- Next:
  - Remove custom `Binary Id="WixCA"` and stop passing `WixCAPath`; rely on `WixUtilExtension`’s built-in WixCA.
  - Re-tag/re-release after committing workflow + WiX fixes.

## Open questions (UNCONFIRMED if needed):
- None.

## Working set (files/ids/commands):
- installer/windows/product.wxs
- .github/workflows/release.yml
- scripts/release.sh
- .github/workflows/ci.yml
