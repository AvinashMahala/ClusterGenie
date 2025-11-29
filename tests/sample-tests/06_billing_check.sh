#!/usr/bin/env bash
set -euo pipefail
BASE="http://localhost:8080/api/v1"
CLUSTER_ID=${1:-cluster-1}

echo "==> Billing estimate for ${CLUSTER_ID}"
resp=$(curl -s "$BASE/billing/cluster?cluster_id=${CLUSTER_ID}")

echo "$resp" | jq .
