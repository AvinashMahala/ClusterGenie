import { test, expect } from '@playwright/test';

test.describe('Autoscaling UI flows', () => {
  test('create -> duplicate -> delete -> evaluate', async ({ page, request }) => {
      const API_BASE = process.env.E2E_API_BASE ?? 'http://localhost:8080/api/v1';

      // ensure at least one cluster exists in the backend so UI flows can proceed
      let clustersBody: any = null;
      try {
        const clustersResp = await request.get(`${API_BASE}/clusters`);
        if (!clustersResp.ok()) {
          test.skip(true, `backend clusters endpoint unreachable at ${API_BASE}/clusters`);
        }
        clustersBody = await clustersResp.json();
      } catch (err) {
        // network errors (connect refused) — skip the e2e autoscaling flow in CI when backend is not present
        test.skip(true, `unable to query backend clusters endpoint: ${err}`);
      }
      let clusters = clustersBody?.clusters || clustersBody?.Clusters || [];
      if (!Array.isArray(clusters) || clusters.length === 0) {
        // create a lightweight cluster to use for the e2e run
        try {
          const createResp = await request.post(`${API_BASE}/clusters`, { data: { name: `e2e-cluster-${Date.now()}`, region: 'nyc1' } });
          if (!createResp.ok()) test.skip(true, 'failed to provision cluster via API for e2e test');
          const created = await createResp.json();
          clusters = [created.cluster || created.Cluster || created];
        } catch (err) {
          test.skip(true, `failed to create cluster: ${err}`);
        }
      }

      await page.goto('/autoscaling');

    // ensure the page loaded
    await expect(page.locator('h2')).toContainText('Autoscaling');

    // pick a cluster if available
    const clusterSelect = page.locator('select').first();
    await expect(clusterSelect).toBeVisible();
    const options = await clusterSelect.locator('option').allTextContents();
    // pick a non-empty cluster option if present
    let clusterFound = false;
    for (const optText of options) {
      if (optText && !optText.startsWith('--')) { clusterFound = true; break; }
    }
    test.skip(!clusterFound, 'no clusters available in the environment');

    // choose first non-empty option
    const optionHandles = await clusterSelect.locator('option').elementHandles();
    for (const h of optionHandles) {
      const val = await h.getAttribute('value');
      if (val && val.trim() !== '') {
        await clusterSelect.selectOption(val);
        break;
      }
    }

    // Open editor and create a policy — wait for the create POST response so the test is deterministic
    await page.locator('button', { hasText: 'New Policy' }).click();
    await expect(page.locator('[data-testid="editor-name"]')).toBeVisible();

    const name = 'e2e-policy-' + Date.now();
    await page.locator('[data-testid="editor-name"]').fill(name);
    // ensure cluster is selected
    const editorCluster = page.locator('[data-testid="editor-cluster"]');
    const clusterValue = await editorCluster.inputValue();
    if (!clusterValue) {
      // pick a cluster
      const options2 = await editorCluster.locator('option').elementHandles();
      for (const o of options2) {
        const val = await o.getAttribute('value');
        if (val && val.trim() !== '') { await editorCluster.selectOption(val); break; }
      }
    }

    // set type to metrics
    await page.locator('[data-testid="editor-type"]').selectOption('metrics');
    // set min/max and trigger
    await page.locator('input[placeholder="Min replicas"]').fill('1');
    await page.locator('input[placeholder="Max replicas"]').fill('3');
    await page.locator('select').filter({ hasText: 'CPU' }).first().selectOption('cpu').catch(() => {});
    await page.locator('input[placeholder="Trigger (0-1)"]').fill('0.5');

    // Intercept the create request and wait for the backend response
    const createPromise = page.waitForResponse(r => r.url().includes('/autoscaling/policies') && (r.status() === 200 || r.status() === 201));
    await page.locator('[data-testid="editor-save"]').click();
    await createPromise;

    // verify card created
    const card = page.locator(`[data-testid^="policy-"]`).filter({ hasText: name }).first();
    await expect(card).toBeVisible({ timeout: 5000 });

    // duplicate the new policy
    const duplicateBtn = page.locator(`button[aria-label="Duplicate ${name}"]`);
    await expect(duplicateBtn).toBeVisible();
    const duplicateResp = page.waitForResponse(r => r.url().includes('/autoscaling/policies') && (r.status() === 200 || r.status() === 201));
    await duplicateBtn.click();
    await duplicateResp;

    // save duplicated (editor opens prefilled)
    await expect(page.locator('[data-testid="editor-name"]')).toBeVisible();
    await page.locator('[data-testid="editor-save"]').click();

    // expect both original and copy
    // Use exact-text searches so we don't match the copy when looking for the original name
    await expect(page.getByText(name, { exact: true })).toHaveCount(1);
    await expect(page.getByText(`${name} (copy)`, { exact: true })).toBeVisible();

    // delete both
    // delete both by waiting for delete network responses
    page.on('dialog', dialog => dialog.accept());
    const delOrig = page.locator(`button[aria-label="Delete ${name}"]`);
    const delResp = page.waitForResponse(r => r.url().includes('/autoscaling/policies') && r.request().method() === 'DELETE');
    await delOrig.click();
    await delResp;
    // ensure the original (exact) is removed, but the copy remains
    await expect(page.getByText(name, { exact: true })).toHaveCount(0);

    const delCopy = page.locator(`button[aria-label="Delete ${name} (copy)"]`);
    const delCopyResp = page.waitForResponse(r => r.url().includes('/autoscaling/policies') && r.request().method() === 'DELETE');
    await delCopy.click();
    await delCopyResp;
    await expect(page.getByText(`${name} (copy)`, { exact: true })).toHaveCount(0);

    // Evaluate cluster
    // Evaluate cluster — the evaluate action hits /autoscaling/evaluate
    const evalResp = page.waitForResponse(r => r.url().includes('/autoscaling/evaluate') && (r.status() === 200));
    await page.locator('button', { hasText: 'Evaluate' }).click();
    await evalResp;
    await expect(page.locator('div', { hasText: 'Evaluate result' })).toBeVisible();
    // close modal
    await page.locator('button', { hasText: 'Close' }).click();
  });
});
