#!/usr/bin/env bash
set -euo pipefail
BASE="http://localhost:8080/api/v1"

echo "==> Create demo cluster 'cluster-1'"
cluster=$(curl -s -X POST "$BASE/clusters" -H 'Content-Type: application/json' -d '{"id":"cluster-1","name":"cluster-1","region":"eu1"}')
# show cluster
echo "$cluster" | jq .

echo "==> Create a droplet attached to cluster-1 (auto placement provider: demo-cloud)"
drop=$(curl -s -X POST "$BASE/droplets" -H 'Content-Type: application/json' -d '{"name":"demo-droplet-1","cluster_id":"cluster-1","region":"eu1","provider":"demo-cloud","size":"s-1vcpu-1gb","image":"ubuntu-22-04-x64"}')

echo "$drop" | jq .
