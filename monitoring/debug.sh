#!/usr/bin/env bash
set -euo pipefail

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT="$(cd "$HERE/.." && pwd)"

echo "=== ClusterGenie monitoring debug helper ==="
echo

function print_heading() { echo -e "\n--- $* ---"; }

print_heading "docker-compose status"
docker-compose ps --services --filter "status=running" || true

print_heading "Prometheus targets (http://localhost:9090/targets)"
if curl -sS http://localhost:9090/- &>/dev/null; then
  echo "Prometheus reachable at http://localhost:9090"
else
  echo "Prometheus not reachable on localhost:9090"
fi

print_heading "Grafana (http://localhost:3001)"
if curl -sS http://localhost:3001/- &>/dev/null; then
  echo "Grafana reachable at http://localhost:3001"
else
  echo "Grafana not reachable on localhost:3001"
fi

print_heading "Loki ready (http://localhost:3100/ready)"
curl -sS http://localhost:3100/ready || echo "Loki not ready or unreachable"

print_heading "Check Prometheus targets summary"
curl -sS http://localhost:9090/targets | head -n 80 || true

print_heading "Check Prometheus rules summary"
curl -sS http://localhost:9090/rules | head -n 80 || true

print_heading "Check for recent logs in Loki (service=\"core-api\")"
curl -sS "http://localhost:3100/loki/api/v1/query?query={service=\"core-api\"}&limit=5" | jq -C || echo "Loki query failed"

print_heading "Tail log-consumer logs (5 lines)"
docker-compose logs --tail=5 log-consumer || true

print_heading "Tail vector logs (5 lines)"
docker-compose logs --tail=5 vector || true

print_heading "Sample Prometheus query: rate(clustergenie_http_requests_total[1m])"
curl -sS "http://localhost:9090/api/v1/query?query=rate(clustergenie_http_requests_total[1m])" | jq -C || true

echo
echo "Done. If a step fails, inspect the container logs or check docker-compose status." 
