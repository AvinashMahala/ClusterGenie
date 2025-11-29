#!/usr/bin/env bash
set -euo pipefail
BASE="http://localhost:8080/api/v1"
CLUSTER_ID=${1:-cluster-1}

echo "==> Evaluating autoscaling policies for ${CLUSTER_ID}"
resp=$(curl -s -X POST "$BASE/autoscaling/evaluate" -G --data-urlencode "cluster_id=${CLUSTER_ID}")

echo "$resp" | jq .
