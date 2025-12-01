#!/usr/bin/env bash
# Lightweight demo script to populate limiter configs and send jobs to the API
# Usage: ./demo.sh [user] [count] [rate]
# Defaults: user=alice count=50 rate=20

set -euo pipefail

USER_ID=${1:-alice}
COUNT=${2:-50}
RATE=${3:-20}

API="http://localhost:8085/api/v1"

echo "Demo: seed limiter rule for user=${USER_ID}"

curl -s -X POST "$API/observability/ratelimit/config" -H 'Content-Type: application/json' -d \
  "{\"name\":\"jobs_create\",\"scope_type\":\"user\",\"scope_id\":\"$USER_ID\",\"refill_rate\":0.2,\"capacity\":1}" | jq '.' || true

echo "Starting load: sending $COUNT job create requests as user $USER_ID at ~$RATE req/s"

for i in $(seq 1 $COUNT); do
  # send job create request; backend will rate-limit depending on config
  curl -s -X POST "$API/jobs" -H "Content-Type: application/json" -H "X-User-ID: $USER_ID" -d '{"name":"demo-job-'$i'", "cluster_id":"demo-cluster", "type":"provision"}' &
  # throttle to desired approximate rate
  sleep $(awk "BEGIN {print 1.0/$RATE}")
done

wait

echo "Load complete. Check Grafana dashboard (http://localhost:3001) and Prometheus metrics to see rejects and latency histograms."
