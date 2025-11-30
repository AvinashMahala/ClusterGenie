#!/usr/bin/env bash
# docs/architecture/verify_e2e.sh
# Quick end-to-end verification script (expects core-api accessible at http://localhost:8080/api/v1)
# Creates a cluster, creates a diagnose job for it, polls until job completes, then prints simple checks

set -euo pipefail
API_BASE=${API_BASE:-http://localhost:8080/api/v1}
USER_HEADER=${USER_HEADER:-user:localtester}

echo "Using API_BASE=${API_BASE}"

# 1) Create cluster
CLUSTER_PAYLOAD='{"name":"ktd-demo-$(date +%s)","region":"nyc3"}'
echo "Creating cluster..."
cluster_resp=$(curl -s -X POST -H "Content-Type: application/json" -d "$CLUSTER_PAYLOAD" ${API_BASE}/clusters)
cluster_id=$(echo "$cluster_resp" | jq -r '.cluster.id')
if [ "$cluster_id" == "null" ] || [ -z "$cluster_id" ]; then
  echo "Failed to create cluster: $cluster_resp" >&2
  exit 1
fi

echo "Cluster created: $cluster_id"

# 2) Create diagnose job
JOB_PAYLOAD=$(jq -n --arg cid "$cluster_id" '{type: "diagnose", parameters: { cluster_id: $cid }}')
echo "Creating diagnose job for cluster $cluster_id..."
job_resp=$(curl -s -X POST -H "Content-Type: application/json" -H "X-User-ID: $USER_HEADER" -d "$JOB_PAYLOAD" ${API_BASE}/jobs)
job_id=$(echo "$job_resp" | jq -r '.job.id')
if [ "$job_id" == "null" ] || [ -z "$job_id" ]; then
  echo "Failed to create job: $job_resp" >&2
  exit 1
fi

echo "Job created: $job_id"

# 3) Poll job status until completed or timeout
max_wait=60
interval=2
elapsed=0
while [ $elapsed -lt $max_wait ]; do
  js=$(curl -s ${API_BASE}/jobs/${job_id})
  status=$(echo "$js" | jq -r '.job.status')
  progress=$(echo "$js" | jq -r '.job.progress // 0')
  echo "status=$status, progress=$progress"
  if [ "$status" == "completed" ] || [ "$status" == "failed" ]; then
    echo "Job finished: $status"
    echo "$js" | jq .
    break
  fi
  sleep $interval
  elapsed=$((elapsed+interval))
done

if [ $elapsed -ge $max_wait ]; then
  echo "Timeout waiting for job $job_id" >&2
  exit 2
fi

# 4) Quick metrics check — ask Prometheus for job_processing p95 (if running on localhost:9090)
if curl -sS http://localhost:9090 >/dev/null 2>&1; then
  echo "Prometheus is available; querying job p95..."
  curl -s "http://localhost:9090/api/v1/query?query=histogram_quantile(0.95%2C%20sum(rate(clustergenie_job_processing_seconds_bucket[5m]))%20by%20(le))" | jq -C
else
  echo "Prometheus not available at http://localhost:9090 — skipping metric checks"
fi

# 5) Loki quick check — overview for core-api logs
if curl -sS http://localhost:3100/ready >/dev/null 2>&1; then
  echo "Loki is available; fetch recent logs for service=\"core-api\" (limited)
"
  curl -s "http://localhost:3100/loki/api/v1/query?query={service=\"core-api\"}&limit=5" | jq -C
else
  echo "Loki not available at http://localhost:3100 — skipping log checks"
fi

echo "E2E verify script completed."