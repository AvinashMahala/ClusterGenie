import { test, expect } from '@playwright/test';

test.describe('Autoscaling UI flows', () => {
  test('create -> duplicate -> delete -> evaluate', async ({ page }) => {
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

    // Open editor and create a policy
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

    await page.locator('[data-testid="editor-save"]').click();

    // verify card created
    const card = page.locator(`[data-testid^="policy-"]`).filter({ hasText: name }).first();
    await expect(card).toBeVisible({ timeout: 5000 });

    // duplicate the new policy
    const duplicateBtn = page.locator(`button[aria-label="Duplicate ${name}"]`);
    await expect(duplicateBtn).toBeVisible();
    await duplicateBtn.click();

    // save duplicated (editor opens prefilled)
    await expect(page.locator('[data-testid="editor-name"]')).toBeVisible();
    await page.locator('[data-testid="editor-save"]').click();

    // expect both original and copy
    await expect(page.locator(`text=${name}`)).toHaveCount(1);
    await expect(page.locator(`text=${name} (copy)`)).toBeVisible();

    // delete both
    page.on('dialog', dialog => dialog.accept());
    const delOrig = page.locator(`button[aria-label="Delete ${name}"]`);
    await delOrig.click();
    await expect(page.locator(`text=${name}`)).toHaveCount(0);

    const delCopy = page.locator(`button[aria-label="Delete ${name} (copy)"]`);
    await delCopy.click();
    await expect(page.locator(`text=${name} (copy)`)).toHaveCount(0);

    // Evaluate cluster
    await page.locator('button', { hasText: 'Evaluate' }).click();
    await expect(page.locator('div', { hasText: 'Evaluate result' })).toBeVisible();
    // close modal
    await page.locator('button', { hasText: 'Close' }).click();
  });
});
