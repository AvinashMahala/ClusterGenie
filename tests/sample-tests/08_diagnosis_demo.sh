#!/usr/bin/env bash
set -euo pipefail

# Simple end-to-end demo (curl + jq) for Diagnosis flows
# 1) create a cluster
# 2) run an immediate (synchronous) diagnosis
# 3) create an asynchronous diagnose job
# 4) poll the job until completion and show progress updates

BASE="${BASE:-http://localhost:8080/api/v1}"
JQ=${JQ:-jq}

usage() {
  cat <<EOF
Usage: $0 [cluster-id]

Optional environment variables:
  BASE - API base url (default: http://localhost:8080/api/v1)
  JQ   - path to jq binary (default: jq)

Example:
  BASE=http://localhost:8080/api/v1 $0 demo-cluster

EOF
}

if [[ "${1:-}" == "-h" || "${1:-}" == "--help" ]]; then
  usage
  exit 0
fi

CLUSTER_ID=${1:-demo-cluster}

echo "==> Demo: create cluster '$CLUSTER_ID'"
create=$(curl -s -X POST "$BASE/clusters" -H 'Content-Type: application/json' -d "{\"id\":\"$CLUSTER_ID\",\"name\":\"$CLUSTER_ID\",\"region\":\"eu1\"}")
echo "$create" | $JQ .

echo
echo "==> Run synchronous diagnosis (POST /diagnosis/diagnose)"
diag=$(curl -s -X POST "$BASE/diagnosis/diagnose" -H 'Content-Type: application/json' -d "{\"cluster_id\":\"$CLUSTER_ID\"}")
echo "$diag" | $JQ .

echo
echo "==> Create asynchronous diagnose job (POST /jobs)"
job_resp=$(curl -s -X POST "$BASE/jobs" -H 'Content-Type: application/json' -d "{\"type\":\"diagnose\",\"parameters\":{\"cluster_id\":\"$CLUSTER_ID\",\"target\":\"node-1\"}}")
echo "$job_resp" | $JQ .

job_id=$(echo "$job_resp" | $JQ -r '.job.id // empty')
if [[ -z "$job_id" ]]; then
  echo "ERROR: failed to create job or parse job id. Full response:" >&2
  echo "$job_resp" >&2
  exit 1
fi

echo
echo "==> Polling job status for job id: $job_id"
max_wait=30 # seconds
elapsed=0
interval=1
while true; do
  job_status=$(curl -s "$BASE/jobs/$job_id")
  status=$(echo "$job_status" | $JQ -r '.job.status // empty')
  progress=$(echo "$job_status" | $JQ -r '.job.progress // empty')
  echo "Status: ${status:-unknown}, progress: ${progress:-0}%"
  if [[ "$status" == "completed" || "$status" == "failed" ]]; then
    echo "Final job result:"; echo "$job_status" | $JQ .
    break
  fi
  sleep $interval
  elapsed=$((elapsed + interval))
  if [[ $elapsed -ge $max_wait ]]; then
    echo "Timeout waiting for job to complete (waited ${max_wait}s). Last seen:"; echo "$job_status" | $JQ .
    exit 2
  fi
done

echo
echo "Demo finished."
