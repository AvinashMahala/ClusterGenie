#!/usr/bin/env bash
set -euo pipefail
BASE="http://localhost:8080/api/v1"

echo "==> Creating demo provider 'demo-cloud'"
resp=$(curl -s -X POST "$BASE/providers" -H 'Content-Type: application/json' -d '{"name":"demo-cloud","regions":["eu1","us1"],"capacity":10,"classes":["small","medium"],"price_per_hour":0.05}')
echo "$resp" | jq .
