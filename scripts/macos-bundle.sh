#!/usr/bin/env bash
set -euo pipefail

# Creates a minimal macOS .app bundle so launching from Finder does NOT open Terminal.
# Usage:
#   scripts/macos-bundle.sh <path-to-built-binary> <output-dir>
#
# Environment overrides:
#   APP_BUNDLE_NAME   (default: Betfair Stream API Proxy)
#   BUNDLE_ID         (default: com.savostin.betfair-stream-proxy)
#   VERSION           (default: inferred from cargo)

BIN_PATH="${1:?expected path to built binary}"
OUT_DIR="${2:-dist}"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# Load display name / bundle id defaults from Cargo.toml metadata.
# Environment overrides still take precedence.
source "${SCRIPT_DIR}/app-config.sh"

APP_BUNDLE_NAME="${APP_BUNDLE_NAME:-${APP_DISPLAY_NAME}}"
BUNDLE_ID="${BUNDLE_ID:-${APP_BUNDLE_ID}}"

# Best-effort version inference (works when run from repo root).
if [[ -z "${VERSION:-}" ]]; then
  VERSION="$(cargo pkgid 2>/dev/null | grep -oE '[0-9]+\.[0-9]+\.[0-9]+' | head -n1 || true)"
fi
VERSION="${VERSION:-0.0.0}"

APP_DIR="${OUT_DIR}/${APP_BUNDLE_NAME}.app"
CONTENTS_DIR="${APP_DIR}/Contents"
MACOS_DIR="${CONTENTS_DIR}/MacOS"
RES_DIR="${CONTENTS_DIR}/Resources"

mkdir -p "${MACOS_DIR}" "${RES_DIR}"

# Copy binary
cp -f "${BIN_PATH}" "${MACOS_DIR}/${APP_BUNDLE_NAME}"
chmod +x "${MACOS_DIR}/${APP_BUNDLE_NAME}"

# Copy icon
cp -f "assets/icon.icns" "${RES_DIR}/icon.icns"

# Info.plist
cat > "${CONTENTS_DIR}/Info.plist" <<PLIST
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>CFBundleDevelopmentRegion</key>
  <string>en</string>
  <key>CFBundleExecutable</key>
  <string>${APP_BUNDLE_NAME}</string>
  <key>CFBundleIdentifier</key>
  <string>${BUNDLE_ID}</string>
  <key>CFBundleInfoDictionaryVersion</key>
  <string>6.0</string>
  <key>CFBundleName</key>
  <string>${APP_BUNDLE_NAME}</string>
  <key>CFBundleDisplayName</key>
  <string>${APP_BUNDLE_NAME}</string>
  <key>CFBundlePackageType</key>
  <string>APPL</string>
  <key>CFBundleShortVersionString</key>
  <string>${VERSION}</string>
  <key>CFBundleVersion</key>
  <string>${VERSION}</string>
  <key>CFBundleIconFile</key>
  <string>icon</string>
  <key>LSUIElement</key>
  <true/>
  <key>NSHighResolutionCapable</key>
  <true/>
</dict>
</plist>
PLIST
