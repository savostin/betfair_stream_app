#!/usr/bin/env bash
set -euo pipefail

# Creates a minimal macOS .app bundle so launching from Finder does NOT open Terminal.
# Usage:
#   scripts/macos-bundle.sh <path-to-built-binary> <output-dir>
#
# Environment overrides:
#   APP_BUNDLE_NAME   (default: betfair_stream_proxy)
#   BUNDLE_ID         (default: com.savostin.betfair-stream-proxy)
#   VERSION           (default: inferred from cargo)

BIN_PATH="${1:?expected path to built binary}"
OUT_DIR="${2:-dist}"

APP_BUNDLE_NAME="${APP_BUNDLE_NAME:-Betfair Stream API Proxy}"
BUNDLE_ID="${BUNDLE_ID:-com.savostin.betfair-stream-proxy}"

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
