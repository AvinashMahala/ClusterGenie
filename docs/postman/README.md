How to use the Postman collection

1) Import `ClusterGenie.postman_collection.json` into Postman.
2) Import `ClusterGenie.postman_environment.json` as an environment and set `base_url` to your QA instance (eg. http://localhost:50052).
3) Update `cluster_id`, `droplet_id`, `job_id` as tests create resources so subsequent requests can reference them.

The collection includes health, clusters, droplets and job flows used in the ManualTestWorkflows.md
