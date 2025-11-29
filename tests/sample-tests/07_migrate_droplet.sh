#!/usr/bin/env bash
set -euo pipefail
BASE="http://localhost:8080/api/v1"
DROPLET_ID=${1:-}
TARGET=${2:-demo-cloud}

if [ -z "$DROPLET_ID" ]; then
  echo "Usage: $0 <droplet-id> <target-provider>"
  exit 1
fi

echo "==> Migrating droplet $DROPLET_ID to provider $TARGET"
resp=$(curl -s -X POST "$BASE/migrations" -H 'Content-Type: application/json' -d "{\"droplet_id\":\"${DROPLET_ID}\",\"target_provider\":\"${TARGET}\"}")

echo "$resp" | jq .
