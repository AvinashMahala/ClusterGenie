# Sample integration tests (curl)

These are lightweight curl-based scripts that exercise the Phase 8 demo flows — autoscaling, deployments, multi-cloud providers and billing.

Pre-requisites
- Core API server running locally at http://localhost:8080 (see README)
- jq installed (for response parsing) — `brew install jq` on macOS

How to run
1. Make scripts executable:
   chmod +x ./run-all.sh *.sh
2. Run the collection (will run in sequence):
   ./run-all.sh

Files
- 01_create_provider.sh — create a demo provider
- 02_create_cluster_and_droplet.sh — create a demo cluster and attach a droplet
- 03_start_deployment.sh — start a canary deployment for a cluster
- 04_create_autoscale_policy.sh — create a sample autoscale policy
- 05_evaluate_autoscaler.sh — kick off evaluation, which may scale the cluster
- 06_billing_check.sh — query billing for a cluster
- 07_migrate_droplet.sh — migrate a droplet to another provider
- run-all.sh — run all scripts in order

Notes
- Scripts are intentionally simple and use jq for JSON formatting and basic checks. They're meant for local demo purposes, not production tests.
- If you prefer Postman/Newman, a collection is included under `/tests/postman` which also covers many of these flows.
