Quick verification steps for the Autoscaling UI (Playwright)

1) Start frontend dev server locally (needs backend running or a QA environment the dev server talks to):

```bash
cd frontend
# install if first run
yarn install
# start the dev server
yarn dev
```

2) Open the UI at http://localhost:5173 and navigate to /autoscaling to manually verify the flows described below.

3) To run the new Playwright test (requires Playwright installed and configured):

```bash
# from repo root
cd e2e/playwright
# install playwright and run tests (if not installed in project or CI)
yarn
npx playwright test autoscaling.spec.ts
```

What this test covers:
- Selects a cluster from the topbar selector
- Opens the policy editor modal, creates a new metrics policy
- Duplicates the policy and saves the copy
- Deletes original & duplicate policies
- Runs the Evaluate action and checks the results modal

Notes:
- The test assumes there is at least one cluster available in the environment (it will skip if none found).
- If the backend APIs are mocked, ensure the dev environment responds as expected for create/list/delete/evaluate endpoints.

If you want, I can add Playwright setup instructions or a GitHub Actions job to run UI e2e on CI next.