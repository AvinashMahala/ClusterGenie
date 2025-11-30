#!/usr/bin/env bash
# find-global-classes.sh
# Non-destructive scan: report occurrences of frequently reused global classnames across frontend

set -euo pipefail
cd "$(dirname "${BASH_SOURCE[0]}")/.." || exit 1

PATTERNS=("\\.panel\\b" "\\.card\\b" "\\.form-section\\b" "\\.action-button\\b" "\\.sr-only\\b" "\\.alert\\b")

echo "Scanning frontend for top-level/global class patterns (panel, card, form-section, action-button, sr-only, alert)..."
for P in "${PATTERNS[@]}"; do
  echo "\nPattern: ${P} -> occurrences:" 
  rg --hidden --line-number --no-ignore-vcs "${P}" src || true
done

exit 0
