Playwright E2E tests for ClusterGenie

Overview
- The tests exercise the frontend flows: cluster listing, cluster detail navigation, provisioning panel and create droplet form.

Setup
1) Change into the e2e/playwright directory

```bash
cd e2e/playwright
npm install
npm run install:browsers
```

2) Export the base URL if your frontend is running on a non-default port.

```bash
export E2E_BASE_URL='http://localhost:5173'
```

Run tests

```bash
npm test
```

Notes
- Tests assume the frontend is accessible and the backend (API) is running if create actions are executed.
- Use a dedicated QA instance to avoid modifying production data.
