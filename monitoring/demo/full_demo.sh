#!/usr/bin/env bash
# Comprehensive demo script to generate various backend activities and logs
# This will create jobs, test rate limiting, query endpoints, etc.
# Usage: ./full_demo.sh [user] [job_count]
# Defaults: user=alice job_count=10

set -euo pipefail

USER_ID=${1:-alice}
JOB_COUNT=${2:-12}

API="http://localhost:8085/api/v1"

echo "=== Full Demo: Generating backend activities for user=${USER_ID} ==="

# 1. Seed rate limiter config
echo "1. Seeding rate limiter config..."
curl -s -X POST "$API/observability/ratelimit/config" -H 'Content-Type: application/json' -d \
  "{\"name\":\"jobs_create\",\"scope_type\":\"user\",\"scope_id\":\"$USER_ID\",\"refill_rate\":0.5,\"capacity\":2}" | jq '.' || echo "Config set"

# 2. Create multiple jobs (some will be rate limited) - mix of job types
echo "2. Creating $JOB_COUNT jobs (mix of provision/monitor/diagnose/scale)..."
types=(provision monitor diagnose scale)
for i in $(seq 1 $JOB_COUNT); do
  t=${types[$((i % ${#types[@]}))]}
  payload="{\"name\":\"demo-job-$i\", \"cluster_id\":\"demo-cluster-$((i%3))\", \"type\":\"$t\"}"
  response=$(curl -s -X POST "$API/jobs" -H "Content-Type: application/json" -H "X-User-ID: $USER_ID" -d "$payload" || true)
  echo "Job $i ($t): $(echo $response | jq -r '.message // .error // .error_code // "unknown"')"
  sleep 0.1
done

# 3. Query jobs list
echo "3. Querying jobs list..."
curl -s -X GET "$API/jobs" -H "X-User-ID: $USER_ID" | jq '.jobs | length' || echo "Jobs query done"

# 4. Get specific job (if any exist)
echo "4. Getting first job details..."
job_id=$(curl -s -X GET "$API/jobs" -H "X-User-ID: $USER_ID" | jq -r '.jobs[0].id // empty')
if [ -n "$job_id" ]; then
  curl -s -X GET "$API/jobs/$job_id" -H "X-User-ID: $USER_ID" | jq '.message' || echo "Job details retrieved"
fi

# 5. Query droplets
echo "5. Querying droplets..."
curl -s -X GET "$API/droplets" -H "X-User-ID: $USER_ID" | jq '.message // "Droplets queried"' || echo "Droplets query done"

# 5b. Create/Delete a droplet quickly (to produce DB logs)
echo "5b. Creating + Deleting a demo droplet..."
droplet_resp=$(curl -s -X POST "$API/droplets" -H "Content-Type: application/json" -H "X-User-ID: $USER_ID" -d '{"region":"nyc1","size":"s-1vcpu-1gb","image":"ubuntu-20-04-x64","cluster_id":"demo-cluster"}') || droplet_resp="{}"
droplet_id=$(echo "$droplet_resp" | jq -r '.droplet.id // empty')
if [ -n "$droplet_id" ]; then
  echo "Created droplet: $droplet_id"
  curl -s -X DELETE "$API/droplets/$droplet_id" -H "X-User-ID: $USER_ID" >/dev/null || true
  echo "Deleted droplet $droplet_id"
fi

# 6. Test metrics endpoint
echo "6. Hitting metrics endpoint..."
curl -s -X GET "$API/metrics" | head -5 || echo "Metrics endpoint hit"

# 6b. Health check and rate limiter status
echo "6b. Health and rate-limiter checks..."
curl -s -X GET "$API/health/" -H "X-User-ID: $USER_ID" | jq '.status // .message' || true
curl -s -X GET "$API/observability/ratelimit/config" -H "X-User-ID: $USER_ID" | jq '. | length' || true

# 6c. Workerpool: show and nudge
echo "6c. Workerpool details + attempts to enqueue worker tasks"
curl -s -X GET "$API/observability/workerpool" -H "X-User-ID: $USER_ID" | jq -c || true

# 7. Additional rate limit triggers (rapid fire)
echo "7. Rapid job creation to trigger more rate limits..."
for i in $(seq 1 5); do
  curl -s -X POST "$API/jobs" -H "Content-Type: application/json" -H "X-User-ID: $USER_ID" -d "{\"name\":\"rapid-job-$i\", \"type\":\"monitor\"}" &
done
wait

# 8. Test autoscaling / policies endpoints
echo "8. Testing autoscaling policies and evaluation endpoints..."
curl -s -X POST "$API/autoscaling/policies" -H "Content-Type: application/json" -H "X-User-ID: $USER_ID" -d '{"name":"demo-policy","min":1,"max":3,"metric":"cpu","threshold":70}' | jq -r '.id // .message' || true
curl -s -X GET "$API/autoscaling/policies" -H "X-User-ID: $USER_ID" | jq '. | length' || true
curl -s -X POST "$API/autoscaling/evaluate" -H "Content-Type: application/json" -H "X-User-ID: $USER_ID" -d '{}' >/dev/null || true

# 9. Trigger schedule / migrations / providers endpoints that are present in core-api
echo "9. Exercising providers, schedule and migrations endpoints..."
curl -s -X GET "$API/providers" -H "X-User-ID: $USER_ID" | jq '. | length' || true
curl -s -X POST "$API/schedule" -H "X-User-ID: $USER_ID" -d '{"job":"noop"}' >/dev/null || true
curl -s -X POST "$API/migrations" -H "X-User-ID: $USER_ID" -d '{"action":"noop"}' >/dev/null || true

# 10. Small burst of GETs to produce HTTP request activity
echo "10. Bursts of GETs to produce metrics & logs"
for i in $(seq 1 10); do
  curl -s -X GET "$API/metrics" >/dev/null &
  curl -s -X GET "$API/droplets" -H "X-User-ID: $USER_ID" >/dev/null &
  sleep 0.05
done
wait

echo "=== Demo complete! ==="
echo "Check Grafana (http://localhost:3001): Loki logs for service='core-api' and dashboards."
echo "Check Prometheus (http://localhost:9090): Metrics like clustergenie_jobs_processed_total grouped by job_type and status."