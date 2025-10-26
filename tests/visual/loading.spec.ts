import { test, expect } from '@playwright/test';

test('Verifica o loading inicial', async ({ page }) => {
  await page.goto('/');
  await page.waitForSelector('div[role="status"]', { state: 'visible' });
  await page.screenshot({ path: 'tests/visual/screenshots/loading-spinner.png' });
  await expect(page.locator('div[role="status"]')).toBeVisible();
});
