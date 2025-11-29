#!/usr/bin/env bash
set -euo pipefail

# Run Postman collection with newman (if installed)
COLL="$(dirname "$0")/../postman/ClusterGenie.postman_collection.json"
ENV="$(dirname "$0")/../postman/ClusterGenie.postman_environment.json"

if ! command -v newman >/dev/null 2>&1; then
  echo "newman is not installed. Install with: npm install -g newman"
  exit 2
fi

echo "Running Postman collection via newman"
newman run "$COLL" -e "$ENV" --reporters cli
