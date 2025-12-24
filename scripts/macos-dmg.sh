#!/usr/bin/env bash
set -euo pipefail

# Create a simple macOS .dmg containing an .app bundle and an /Applications shortcut.
# This produces a standard "drag the app into Applications" installer experience.
#
# Usage:
#   scripts/macos-dmg.sh <path-to-app-bundle> <output-dmg>
#
# Environment overrides:
#   DMG_VOLUME_NAME (default: Betfair Stream Proxy)

APP_PATH="${1:?expected path to .app bundle}"
OUT_DMG="${2:?expected output .dmg path}"

if [[ ! -d "${APP_PATH}" || "${APP_PATH}" != *.app ]]; then
  echo "ERROR: expected a .app bundle directory, got: ${APP_PATH}" >&2
  exit 2
fi

VOL_NAME="${DMG_VOLUME_NAME:-Betfair Stream API Proxy}"

STAGE_DIR="$(mktemp -d)"
cleanup() {
  rm -rf "${STAGE_DIR}" || true
}
trap cleanup EXIT

cp -R "${APP_PATH}" "${STAGE_DIR}/"
ln -s /Applications "${STAGE_DIR}/Applications"

mkdir -p "$(dirname "${OUT_DMG}")"
rm -f "${OUT_DMG}" || true

# UDZO = compressed read-only. "-ov" overwrites, "-quiet" to keep logs clean.
hdiutil create \
  -volname "${VOL_NAME}" \
  -srcfolder "${STAGE_DIR}" \
  -format UDZO \
  -ov \
  "${OUT_DMG}" \
  >/dev/null

echo "Created: ${OUT_DMG}"
