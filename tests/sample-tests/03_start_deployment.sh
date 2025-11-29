#!/usr/bin/env bash
set -euo pipefail
BASE="http://localhost:8080/api/v1"

CLUSTER_ID=${1:-cluster-1}
VERSION=${2:-v1.2}
STRATEGY=${3:-canary}
TARGET=${4:-10}

echo "==> Starting deployment for cluster ${CLUSTER_ID} (version=${VERSION}, strategy=${STRATEGY})"
resp=$(curl -s -X POST "$BASE/deployments/start" -H 'Content-Type: application/json' -d "{\"cluster_id\":\"${CLUSTER_ID}\",\"version\":\"${VERSION}\",\"strategy\":\"${STRATEGY}\",\"target_percent\":${TARGET}}")

echo "$resp" | jq .
