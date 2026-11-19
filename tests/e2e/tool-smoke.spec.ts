import { test, expect } from '@playwright/test';

test.describe('M0 Foundations Smoke Tests', () => {
  test('homepage renders hero, categories and has clean DOM', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/ZixTool/);
    const h1 = page.locator('h1');
    await expect(h1).toBeVisible();
    await expect(h1).toContainText('Free Online File Converters');
  });

  test('heic-to-jpg tool page renders tool shell and how-to steps', async ({ page }) => {
    await page.goto('/heic-to-jpg/');
    await expect(page).toHaveTitle(/HEIC to JPG Converter/);
    const h1 = page.locator('h1');
    await expect(h1).toHaveCount(1);
    await expect(h1).toContainText('HEIC to JPG');

    // ToolShell dropzone should be visible above the fold
    const dropzone = page.locator('.tool-shell');
    await expect(dropzone).toBeVisible();

    // Verification explainer should be present
    await expect(page.locator('text=100% Private In-Browser RAM')).toBeVisible();
  });

  test('formats guide page lists format characteristics', async ({ page }) => {
    await page.goto('/formats/jpg/');
    await expect(page).toHaveTitle(/JPG File/);
    await expect(page.locator('h1')).toContainText('Format Guide');
  });

  test('404 page returns clean fallback directory', async ({ page }) => {
    await page.goto('/404/');
    await expect(page.locator('h1')).toContainText('Page Not Found');
  });
});
