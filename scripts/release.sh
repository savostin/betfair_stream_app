#!/usr/bin/env bash
set -euo pipefail

# Create and push a git tag matching Cargo.toml version.
# This triggers the GitHub Actions release workflow (tag pattern: v*).
#
# Usage:
#   scripts/release.sh
#   scripts/release.sh --remote origin
#   scripts/release.sh --dry-run

REMOTE="origin"
DRY_RUN="false"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --remote)
      REMOTE="${2:?missing value for --remote}"; shift 2 ;;
    --dry-run)
      DRY_RUN="true"; shift ;;
    -h|--help)
      sed -n '1,120p' "$0"; exit 0 ;;
    *)
      echo "Unknown arg: $1" >&2
      exit 2
      ;;
  esac
done

if ! git rev-parse --git-dir >/dev/null 2>&1; then
  echo "ERROR: not in a git repo" >&2
  exit 1
fi

BRANCH="$(git rev-parse --abbrev-ref HEAD)"
if [[ "${BRANCH}" == "HEAD" ]]; then
  echo "ERROR: detached HEAD; switch to main before releasing" >&2
  exit 1
fi


# Ensure Cargo.lock matches Cargo.toml before tagging.
# This prevents CI/release failures due to --locked refusing to update the lockfile.
if command -v cargo >/dev/null 2>&1; then
  cargo generate-lockfile
  if ! git diff --quiet -- Cargo.lock; then
    echo "ERROR: Cargo.lock was updated. Please commit Cargo.lock changes and re-run." >&2
    exit 1
  fi
fi

if [[ -n "$(git status --porcelain)" ]]; then
  echo "ERROR: working tree is dirty; commit or stash changes first" >&2
  exit 1
fi

VERSION="$(cargo pkgid | grep -oE '[0-9]+\.[0-9]+\.[0-9]+' | head -n1 || true)"
if [[ -z "${VERSION}" ]]; then
  echo "ERROR: failed to determine version from cargo" >&2
  exit 1
fi


TAG="v${VERSION}"

if git rev-parse "${TAG}" >/dev/null 2>&1; then
  echo "ERROR: tag already exists locally: ${TAG}" >&2
  exit 1
fi

if git ls-remote --tags "${REMOTE}" "refs/tags/${TAG}" | grep -q .; then
  echo "ERROR: tag already exists on remote ${REMOTE}: ${TAG}" >&2
  exit 1
fi

echo "Version: ${VERSION}"
echo "Tag:     ${TAG}"
echo "Remote:  ${REMOTE}"

if [[ "${DRY_RUN}" == "true" ]]; then
  echo "DRY RUN: would run: git tag \"${TAG}\""
  echo "DRY RUN: would run: git push ${REMOTE} \"${TAG}\""
  exit 0
fi

git tag "${TAG}"
git push "${REMOTE}" "${TAG}"

echo "Done. GitHub Actions release should start for ${TAG}."
