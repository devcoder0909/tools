import { test, expect } from '@playwright/test';

test.describe('Tip Calculator E2E Tests', () => {
  test('tip calculator computes accurate gratuities, split amounts, and renders guide', async ({ page }) => {
    await page.goto('/tip-calculator/', { waitUntil: 'domcontentloaded' });

    // 1. Heading and metadata
    await expect(page.locator('h1')).toHaveCount(1);
    await expect(page.locator('h1')).toContainText('Tip Calculator');
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', 'https://zixtool.online/tip-calculator/');

    // 2. Guide link present in content
    const guideLink = page.locator('a[href="/guides/restaurant-tipping-and-bill-splitting/"]').first();
    await expect(guideLink).toBeVisible();

    // 3. Images rendered with alt
    const etiquetteImg = page.locator('img[src="/images/tools/tipping-etiquette-chart.svg"]');
    await expect(etiquetteImg).toBeVisible();
    await expect(etiquetteImg).toHaveAttribute('alt', /Tipping Standards and Bill Splitting/i);

    const workflowImg = page.locator('img[src="/images/tools/tip-calculator-workflow.svg"]').first();
    await expect(workflowImg).toBeVisible();

    // 4. Interactive calculations in CalculatorShell
    const billInput = page.locator('input[placeholder="65.00"]');
    await billInput.fill('100');

    // Click 20% preset
    await page.getByRole('button', { name: '20%' }).click();

    // Split for 2 guests
    const splitInput = page.locator('input[type="number"]').nth(2);
    await splitInput.fill('2');

    // Verify per person share is $60.00 inside calculator shell
    const shell = page.locator('.calculator-shell');
    await expect(shell.getByText('$60.00')).toBeVisible();
    await expect(shell.getByText('$20.00')).toBeVisible(); // Total tip
    await expect(shell.getByText('$120.00')).toBeVisible(); // Grand total

    // 5. Stepper increment to 4 guests
    await page.getByRole('button', { name: '+' }).click();
    await page.getByRole('button', { name: '+' }).click();
    await expect(shell.getByText('$30.00')).toBeVisible(); // $120 / 4 = $30.00
  });
});
