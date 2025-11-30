#!/usr/bin/env bash
set -euo pipefail

echo "Checking for top-level shared selector declarations that may cause collisions..."

ROOT="$(cd "$(dirname "$0")/.." && pwd)"

PATTERN='^\s*\.(panel|card|action-button|alert|loading-spinner|select-wrapper)\b'

echo "Searching under frontend for top-level declarations of: panel, card, action-button, alert, loading-spinner, select-wrapper"
grep -Enr --exclude-dir=node_modules --exclude-dir=dist --include='*.scss' -e "${PATTERN}" "${ROOT}" || true

echo "Check finished. If any offender appears outside 'components/common' or is not nested under a component root (e.g. .my-component { .panel { ... } }), consider scoping or using the cg- prefixed selectors."

exit 0
