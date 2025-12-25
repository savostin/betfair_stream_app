#!/usr/bin/env bash
# Shell helper to get packaging/release metadata from Cargo.toml.
#
# Single source of truth is [package.metadata.app] in Cargo.toml.
# This avoids inventing another config file while keeping Cargo package name
# (which cannot contain spaces) separate from the human-friendly app name.
#
# Usage:
#   source scripts/app-config.sh
#   echo "$APP_DISPLAY_NAME"
#
# Environment overrides (optional):
#   APP_DISPLAY_NAME, APP_BUNDLE_ID, APP_DMG_VOLUME_NAME, APP_WINDOWS_PRODUCT_NAME

set -euo pipefail

_repo_root() {
  local script_path
  script_path="${BASH_SOURCE[0]:-$0}"
  cd "$(dirname "${script_path}")/.." && pwd
}

_toml_get_app_meta() {
  local key="${1:?expected key}"
  local cargo_toml
  cargo_toml="$(_repo_root)/Cargo.toml"

  # Minimal TOML parsing for simple string values in the [package.metadata.app] table.
  # Assumptions:
  # - values are double-quoted strings on a single line
  # - no embedded unescaped double quotes
  awk -v key="$key" '
    BEGIN { in_table=0 }
    /^[[:space:]]*\[package\.metadata\.app\][[:space:]]*$/ { in_table=1; next }
    in_table && /^[[:space:]]*\[/ { in_table=0 }
    in_table {
      line=$0
      sub(/[[:space:]]+#.*/, "", line)
      if (line ~ "^[[:space:]]*" key "[[:space:]]*=") {
        sub("^[[:space:]]*" key "[[:space:]]*=[[:space:]]*\"", "", line)
        sub("\"[[:space:]]*$", "", line)
        print line
        exit
      }
    }
  ' "$cargo_toml" || true
}

APP_DISPLAY_NAME="${APP_DISPLAY_NAME:-$(_toml_get_app_meta display_name)}"
APP_BUNDLE_ID="${APP_BUNDLE_ID:-$(_toml_get_app_meta bundle_id)}"
APP_DMG_VOLUME_NAME="${APP_DMG_VOLUME_NAME:-$(_toml_get_app_meta dmg_volume_name)}"
APP_WINDOWS_PRODUCT_NAME="${APP_WINDOWS_PRODUCT_NAME:-$(_toml_get_app_meta windows_product_name)}"

# Sensible fallbacks (kept consistent with prior defaults).
APP_DISPLAY_NAME="${APP_DISPLAY_NAME:-Betfair Stream API App}"
APP_BUNDLE_ID="${APP_BUNDLE_ID:-com.savostin.betfair-stream-app}"
APP_DMG_VOLUME_NAME="${APP_DMG_VOLUME_NAME:-$APP_DISPLAY_NAME}"
APP_WINDOWS_PRODUCT_NAME="${APP_WINDOWS_PRODUCT_NAME:-$APP_DISPLAY_NAME}"
