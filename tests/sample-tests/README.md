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
- 08_diagnosis_demo.sh — full diagnosis demo (create cluster → sync diagnose → create job → poll progress)
- run-all.sh — run all scripts in order

Adding the diagnosis demo:
- Run only the diagnosis demo:
   chmod +x 08_diagnosis_demo.sh && ./08_diagnosis_demo.sh demo-cluster
  
   # Or use a custom base url:
   BASE=http://localhost:8080/api/v1 ./08_diagnosis_demo.sh my-cluster

Notes
- Scripts are intentionally simple and use jq for JSON formatting and basic checks. They're meant for local demo purposes, not production tests.
- If you prefer Postman/Newman, a collection is included under `/tests/postman` which also covers many of these flows.

Fixtures (JSON)
----------------

This directory now includes a `fixtures/` folder containing JSON fixtures you can use for E2E tests or to seed a local test instance. Files were added for the common frontend pages and resources:

Path: `tests/sample-tests/fixtures`

Files included (examples):
- `clusters.json` — clusters list
- `droplets.json` — droplets list
- `jobs.json` — job list + metadata
- `metrics.json` — recent metrics samples
- `policies.json` — autoscaling policies
- `deployments.json` — deployments / rollouts
- `providers.json` — provider simulation data
- `billing.json` — billing estimate example
- `limiter_rules.json` — persisted rate-limit configs
- `diagnosis.json` — sample diagnosis response for `/diagnosis/diagnose`
- `hello.json` — a simple /hello response used by dashboard health check

Quick usage examples
--------------------

1. Use fixtures with curl to POST items one-by-one (useful to seed local API):

```bash
# set base URL to your running local API (adjust if needed)
BASE=${BASE:-http://localhost:8080}

# Example: create clusters from fixtures/clusters.json
cat fixtures/clusters.json | jq -c '.[]' | while read -r obj; do
   curl -s -X POST "$BASE/clusters" -H "Content-Type: application/json" -d "$obj" | jq .
done

# Example: create droplets
cat fixtures/droplets.json | jq -c '.[]' | while read -r obj; do
   curl -s -X POST "$BASE/droplets" -H "Content-Type: application/json" -d "$obj" | jq .
done
```

2. Use fixture files directly in a test framework (Playwright / Cypress / Newman) as the mocked API responses or as seed data.

3. Consult `backend/docs/swagger.yaml` for exact endpoint payload shapes before seeding in automation.

If you'd like, I can also add a convenience loader script (Bash/Node) that reads the fixtures folder and POSTs items in an order suitable for seeding the local development environment (clusters → droplets → providers → jobs → deployments → policies). Say the word and I will add it.

Seeder script
-------------

A convenience seeder script is included: `seed-fixtures.sh` (Bash). It POSTS items from `fixtures/` into a running ClusterGenie API.

Example usage:

```bash
# dry-run (shows what would be POSTed)
./seed-fixtures.sh --dry-run

# actually post fixtures (change BASE as necessary)
BASE=http://localhost:8080 ./seed-fixtures.sh

# override the default endpoint mapping for clusters
MAP_CLUSTERS=/api/v1/clusters BASE=http://localhost:8080 ./seed-fixtures.sh
```

Permissions: make it executable when running locally:

```bash
chmod +x seed-fixtures.sh
```

The script is intentionally conservative and prints HTTP response codes for each POST. Review `backend/docs/swagger.yaml` when seeding a new or production-like server.
