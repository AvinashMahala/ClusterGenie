#!/usr/bin/env bash
# Demo helper to quickly generate a variety of metrics so dashboards show activity
# Usage: ./demo_full.sh [api_url] [jobs] [diagnosis] [users] [clusters]
# example: ./demo_full.sh http://localhost:8080/api/v1 200 150 8 6

set -euo pipefail

API=${1:-http://localhost:8080/api/v1}
TOTAL_JOBS=${2:-200}
TOTAL_DIAG=${3:-150}
TOTAL_USERS=${4:-6}
TOTAL_CLUSTERS=${5:-5}

echo "Demo starting — API=$API jobs=$TOTAL_JOBS diag=$TOTAL_DIAG users=$TOTAL_USERS clusters=$TOTAL_CLUSTERS"

# helper to do concurrent POSTs with small jitter
_post() {
  curl -s -X POST "$1" -H "Content-Type: application/json" -d "$2" || true
}

# 1) create a few clusters (so monitoring DB has different cluster ids)
echo "Creating $TOTAL_CLUSTERS demo clusters"
for i in $(seq 1 $TOTAL_CLUSTERS); do
  name="demo-cluster-$i"
  body=$(jq -n --arg name "$name" --arg region "nyc3" '{name: $name, region: $region}')
  _post "$API/clusters" "$body" &
done
wait

# small sleep so the backend has time to persist clusters
sleep 1

# collect cluster ids from the API (best effort)
CLUSTER_IDS=()
for i in $(seq 1 $TOTAL_CLUSTERS); do
  CLUSTER_IDS+=("demo-cluster-$i")
done

echo "Seeding DB-backed cluster metrics (calls to /metrics create mock metrics when missing)"
for id in "${CLUSTER_IDS[@]}"; do
  # call the metrics endpoint to cause generateMockMetricsIfNeeded to run
  curl -s "$API/metrics?cluster_id=$id" >/dev/null || true
done

sleep 1

# 2) seed some limiter rules to demonstrate available tokens and rejected counts
echo "Seeding limiter rules for a few users"
for u in $(seq 1 $TOTAL_USERS); do
  uid="user-$u"
  # make a strict and small config so many requests cause rejects
  cfg=$(jq -n --arg name "jobs_create" --arg scope_type "user" --arg scope_id "$uid" --argjson refill_rate 0.1 --argjson capacity 1 '{name: $name, scope_type: $scope_type, scope_id: $scope_id, refill_rate: $refill_rate, capacity: $capacity}')
  _post "$API/observability/ratelimit/config" "$cfg" &
done
wait

sleep 0.5

echo "Flooding job creation for several users and clusters (this will produce queue length, queued/completed events and job timing histograms)"
# Spread jobs across users and clusters and types
TYPES=(diagnose monitor scale provision)
for i in $(seq 1 $TOTAL_JOBS); do
  userIdx=$(( (i % TOTAL_USERS) + 1 ))
  clusterIdx=$(( (i % TOTAL_CLUSTERS) + 1 ))
  user="user-$userIdx"
  cluster="demo-cluster-$clusterIdx"
  t=${TYPES[$((i % ${#TYPES[@]}))]}

  # craft parameters payload - CreateJobRequest wants { type, parameters }
  params=$(jq -n --arg cluster_id "$cluster" '{cluster_id: $cluster_id}')
  jobBody=$(jq -n --arg type "$t" --argjson params "$params" '{type: $type, parameters: $params}')

  # send NB: we add header X-User-ID to demonstrate per-user rate limiting
  curl -s -X POST "$API/jobs" -H "Content-Type: application/json" -H "X-User-ID: $user" -d "$jobBody" >/dev/null &

  # lightweight rate control — send bursts then sleep a tiny amount
  if (( i % 50 == 0 )); then
    sleep 0.5
  fi
done

wait

echo "Triggering diagnosis endpoint (hit rate-limited path) to increase rate-limit metrics and rejects"
for i in $(seq 1 $TOTAL_DIAG); do
  uidx=$(( (i % TOTAL_USERS) + 1 ))
  user="user-$uidx"
  clusterIdx=$(( (i % TOTAL_CLUSTERS) + 1 ))
  cluster="demo-cluster-$clusterIdx"
  body=$(jq -n --arg cluster_id "$cluster" '{cluster_id: $cluster_id}')
  curl -s -X POST "$API/diagnosis/diagnose" -H "Content-Type: application/json" -H "X-User-ID: $user" -d "$body" >/dev/null &
  if (( i % 40 == 0 )); then sleep 0.25; fi
done

wait

echo "Touching other endpoints and metrics to produce HTTP request diversity"
# Request a mix of endpoints
ENDPOINTS=("/clusters" "/providers" "/providers" "/jobs" "/jobs" "/observability/workerpool" "/observability/ratelimit")
for e in "${ENDPOINTS[@]}"; do
  curl -s "$API${e}" >/dev/null || true
done

echo "Demo completed — wait a moment and visit Grafana (http://localhost:3001) or Prometheus (http://localhost:9090)"

echo "Useful PromQL to inspect the created data:"
echo "  sum(rate(clustergenie_http_requests_total[1m])) by (path, status)"
echo "  histogram_quantile(0.95, sum(rate(clustergenie_job_processing_seconds_bucket[5m])) by (le))"

exit 0
