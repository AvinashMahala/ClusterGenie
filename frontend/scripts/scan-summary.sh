#!/usr/bin/env bash
# scan-summary.sh
# Aggregated scan for common CSS smells: !important, global classes, element selectors, deep nesting

set -euo pipefail
cd "$(dirname "${BASH_SOURCE[0]}")/.." || exit 1

echo "=== CSS Audit quick summary ===\n"

echo "1) !important occurrences:"
./scripts/find-important.sh || true

echo "\n2) Common global classes/duplicates:"
./scripts/find-global-classes.sh || true

echo "\n3) Element/type selectors (lines starting with h1, p, label, table, th, td, button, input):"
rg --hidden --line-number --no-ignore-vcs "^\s*(h1|h2|h3|p|label|table|th|td|button|input)" src || echo "None found."

echo "\n4) Deep nesting heuristic (lines with at least 8 leading spaces):"
rg --hidden --line-number --no-ignore-vcs "^\s{8,}.+" src || echo "None found."

echo "\n5) Count of files with SCSS:"
find src -name "*.scss" | wc -l

echo "\n(End of quick summary)"
exit 0
