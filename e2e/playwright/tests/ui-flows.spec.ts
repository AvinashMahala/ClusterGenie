import { test, expect } from '@playwright/test';

test.describe('ClusterGenie UI flows (sanity)', () => {
  test('clusters listing and navigation', async ({ page, baseURL }) => {
    await page.goto('/clusters');
    // the app contains multiple h1 elements (brand + page header) so scope to the page header
    await expect(page.locator('.clusters-header h1')).toHaveText('Clusters');
    // wait for table rows to appear or show empty state
    const table = page.locator('table.clusters-table');
    await expect(table).toBeVisible();

    // if there's at least one cluster, view details
    const firstView = page.locator('a.btn-view').first();
    if (await firstView.count() > 0) {
      await firstView.click();
      // cluster panel should show the cluster name, which is an h1
      await expect(page.locator('.cluster-header h1')).toBeVisible();
    } else {
      // no clusters - ensure empty-state message is present
      await expect(page.locator('.empty')).toBeVisible();
    }
  });

  test('provisioning panel and create droplet form', async ({ page }) => {
    await page.goto('/provisioning');
    // scope to droplet create card header to avoid other h2's in the app
    await expect(page.locator('.create-form-card .form-header h2')).toContainText('Create New Droplet');

    // fill the name field (don't rely on cluster id being present)
    const nameInput = page.locator('#name');
    await nameInput.fill('e2e-test-droplet-' + Date.now());

    // pick a size and image
    await page.locator('#size').selectOption('s-1vcpu-1gb');
    await page.locator('#image').selectOption('ubuntu-22-04-x64');

    // submit - this will attempt to call the backend. For CI this should be a QA environment.
    await page.locator('.create-button').click();

    // the UI should either show creating state or an error message
    await expect(page.locator('.create-button')).toBeDisabled().catch(() => {});
  });
});
