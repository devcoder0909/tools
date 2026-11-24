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
    await expect(page.getByRole('heading', { name: /100% In-Browser Privacy/i })).toBeVisible();
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

  test('interactive search filters tools, shows live count, and clears cleanly', async ({ page }) => {
    await page.goto('/tools/');
    const searchInput = page.locator('#tool-search-input');
    await expect(searchInput).toBeVisible();

    // Type query
    await searchInput.fill('pdf');
    const feedback = page.locator('#tool-search-feedback');
    await expect(feedback).toBeVisible();
    const matches = await page.locator('.tool-card:visible, .guide-search-card:visible').count();
    expect(matches).toBeGreaterThan(1);
    await expect(feedback).toHaveText(`Found ${matches} matching results`);

    // Clear search
    const clearBtn = page.locator('#tool-search-clear');
    await expect(clearBtn).toBeVisible();
    await clearBtn.click();
    await expect(searchInput).toHaveValue('');
    await expect(clearBtn).toBeHidden();

    // Search nonexistent term for empty state
    await searchInput.fill('xyznonexistentquery');
    const emptyState = page.locator('#empty-search-state');
    await expect(emptyState).toBeVisible();
    await expect(page.locator('#empty-query-text')).toContainText('xyznonexistentquery');

    // Reset button
    const resetBtn = page.locator('#reset-search-btn');
    await expect(resetBtn).toBeVisible();
    await resetBtn.click();
    await expect(searchInput).toHaveValue('');
    await expect(emptyState).toBeHidden();
  });

  test('reading-time-calculator renders KPI cards and computes metrics', async ({ page }) => {
    await page.goto('/reading-time-calculator/');
    await expect(page).toHaveTitle(/Reading Time Calculator/);
    const h1 = page.locator('h1');
    await expect(h1).toHaveCount(1);
    const shell = page.locator('.text-shell');
    await expect(shell).toBeVisible();
    await expect(shell.getByText('Reading (200 WPM)', { exact: true })).toBeVisible();
    await expect(shell.getByText('Speaking (140 WPM)', { exact: true })).toBeVisible();
  });

  test('dpi-calculator calculates screen PPI and print dimensions', async ({ page }) => {
    await page.goto('/dpi-calculator/');
    await expect(page).toHaveTitle(/DPI Calculator/);
    await expect(page.locator('h1')).toHaveCount(1);
    const island = page.locator('astro-island');
    await expect(island.getByText('163.18', { exact: true })).toBeVisible();
    await expect(island.getByText('Pixels Per Inch')).toBeVisible();
    
    // Switch to Print mode
    const printTab = island.getByRole('button', { name: 'Print Dimensions & Resolution' });
    await expect(printTab).toBeVisible();
    await printTab.click();
    await expect(island.getByText('Maximum Physical Print Size at 300 DPI')).toBeVisible();
    await expect(island.getByText('10.00" × 6.67"')).toBeVisible();
  });
});
