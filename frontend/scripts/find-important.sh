#!/usr/bin/env bash
# find-important.sh
# Non-destructive scan: report all occurrences of !important in frontend SCSS files

set -euo pipefail
cd "$(dirname "${BASH_SOURCE[0]}")/.." || exit 1

echo "Scanning frontend for '!important' occurrences..."
rg --hidden --line-number "!important" src || echo "No !important found." 

exit 0
