#!/usr/bin/env bash
# Developer source export from a reviewed local commit; not a private-vault backup.
set -euo pipefail
REPO_DIR="$(cd "$(dirname "$0")/.." && pwd)"
exec node "$REPO_DIR/scripts/package-source.cjs" "$@"
