import { test, expect } from '@playwright/test';

// These checks cover first-party SEO behavior, not third-party font availability.
test.beforeEach(async ({ page }) => {
  await page.route(/^https:\/\/fonts\.(googleapis|gstatic)\.com\//, route => route.abort());
});

for (const slug of ['uuid-generator', 'merge-pdf', 'online-timer', 'loan-calculator', 'qr-code-generator', 'currency-converter', 'my-ip-address', 'gta-6-pc-specs-calculator']) {
  test(`${slug} is indexable and renders a working tool interface`, async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(`/${slug}/`, { waitUntil: 'domcontentloaded' });
    await expect(page.locator('h1')).toHaveCount(1);
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', `https://zixtool.online/${slug}/`);
    await expect(page.locator('meta[name="robots"]')).not.toHaveAttribute('content', /noindex/);
    await expect(page.locator('main input:visible, main textarea:visible, main button:visible, main label:visible').first()).toBeVisible();
    if (slug === 'uuid-generator') {
      await expect(page.locator('main')).toContainText(/[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}/i);
    }
    expect(errors).toEqual([]);
  });
}

test('internal diagnostics remains noindex and explains supported discovery', async ({ page }) => {
  await page.goto('/internal/indexing-tester/', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /noindex/);
  await expect(page.locator('main')).toContainText("not eligible for Google's Indexing API");
  await expect(page.getByRole('link', { name: 'View the published XML sitemap' })).toHaveAttribute('href', '/sitemap-index.xml');
});
