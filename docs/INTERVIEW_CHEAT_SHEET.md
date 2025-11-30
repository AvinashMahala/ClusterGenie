# ClusterGenie — Interview Cheat Sheet (one page)

This one-pager is built to help you answer cross-questions during interviews quickly and confidently. Keep it open while you rehearse or bring it to an on-site interview (notes). Each answer is intentionally short — expand if asked and show the pointer to the code/docs.

Quick format: <Topic> → One-liner answer → File pointer for follow-up

- Health checks → POST /hello is used by frontend to detect backend availability. → `backend/docs/swagger.yaml`, `frontend/src/services`
- Diagnose → Implement → Diagnose response leads to POST /jobs to create actionable jobs processed by background workers. → `frontend/src/components/Diagnosis*`, `backend/core-api/handlers.go`
- Jobs & progress → UI polls /jobs and displays progress; check workers for runtime logs. → `frontend/src/components/Jobs*`, `logs/`, `backend/core-api/test`
- Autoscaling evaluation → Evaluate via AutoscalingService endpoints; use Evaluate UI to simulate actions. → `frontend/src/components/Autoscaling*`, backend autoscaling handlers
- Droplet lifecycle → ProvisioningService calls POST/DELETE /droplets; UI shows create/delete with toasts and highlights. → `frontend/src/components/Provisioning/*`, `backend/core-api` provisioning handlers
- Observability & metrics → Prometheus provides metrics; rate-limit configs persisted through backend observability endpoints (and Redis). → `monitoring/`, `backend/docs`
- RBAC/security → Add middleware in backend (auth/roles) + gate UI controls; add tests for allow/deny flows. → `backend/core-api/middleware`
- E2E verification → Use Playwright scripts plus fixtures for reliable tests. → `e2e/playwright/tests`, `tests/sample-tests`

Pro tips for live interviews:
- Lead with a short answer (1 sentence), then mention one tradeoff, and finish with a repo pointer to demonstrate knowledge of the codebase.
- Use the terms 'frontend service', 'backend handler', 'worker', and 'observability stack' when describing flows.
- When asked about design changes, propose a concrete approach + minimal backward-compatible steps and a test plan.

If you'd like a printable .pdf, I can generate one from this file next.
