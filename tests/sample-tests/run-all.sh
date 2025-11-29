#!/usr/bin/env bash
set -euo pipefail

SCRIPTS=(
  01_create_provider.sh
  02_create_cluster_and_droplet.sh
  03_start_deployment.sh
  04_create_autoscale_policy.sh
  05_evaluate_autoscaler.sh
  06_billing_check.sh
)

for s in "${SCRIPTS[@]}"; do
  echo "\n=== Running ${s} ==="
  bash "$s"
done

echo "\nAll scripts completed. You can run 07_migrate_droplet.sh <droplet-id> <target-provider> manually to test migrations."
