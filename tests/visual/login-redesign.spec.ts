import { test, expect } from '@playwright/test';

test.describe('Login Page Visual Check', () => {
  test('should render the redesigned login page correctly', async ({ page }) => {
    // Acessa a página de login
    await page.goto('/');

    // Aguarda um elemento chave do novo design estar visível
    await expect(page.locator('h1:has-text("TourManager")')).toBeVisible({ timeout: 10000 });

    // Aguarda o formulário e o calendário estarem presentes
    await expect(page.locator('form')).toBeVisible();
    await expect(page.locator('h2:has-text("Disponibilidades")')).toBeVisible();

    // Tira uma screenshot para verificação visual
    await page.screenshot({ path: 'jules-scratch/login-redesign-check.png', fullPage: true });
  });
});
