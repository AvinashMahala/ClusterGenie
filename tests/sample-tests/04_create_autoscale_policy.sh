#!/usr/bin/env bash
set -euo pipefail
BASE="http://localhost:8080/api/v1"

CLUSTER_ID=${1:-cluster-1}
POLICY_NAME=${2:-cpu-scale-demo}

echo "==> Creating autoscale policy ${POLICY_NAME} for ${CLUSTER_ID} (metrics, cpu > 80%)"
resp=$(curl -s -X POST "$BASE/autoscaling/policies" -H 'Content-Type: application/json' -d "{\"name\":\"${POLICY_NAME}\",\"cluster_id\":\"${CLUSTER_ID}\",\"type\":\"metrics\",\"enabled\":true,\"min_replicas\":1,\"max_replicas\":5,\"metric_type\":\"cpu\",\"metric_trigger\":0.8}")

echo "$resp" | jq .
