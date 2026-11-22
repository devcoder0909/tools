import { test, expect } from '@playwright/test';

// These checks cover first-party SEO behavior, not third-party font availability.
test.beforeEach(async ({ page }) => {
  await page.route(/^https:\/\/fonts\.(googleapis|gstatic)\.com\//, route => route.abort());
});

test.use({ javaScriptEnabled: false });

for (const slug of ['image-upload-requirements', 'pdf-file-size-limits', 'json-to-csv-data-checklist', 'restaurant-tipping-and-bill-splitting', 'gta-6-pc-system-requirements-and-hardware-guide', 'gta-6-video-and-screenshot-optimization-guide', 'gta-6-map-size-comparison-and-scale-guide', 'gta-6-ps5-pro-and-pc-60-fps-performance-guide', 'gta-6-trailer-2-and-release-timeline-guide', 'gta-6-vehicles-and-police-ai-chase-guide', 'gta-6-official-download-and-pre-load-guide', 'gta-6-cheat-codes-and-phone-numbers-guide', 'gta-6-characters-lucia-and-jason-guide', 'gta-6-soundtrack-and-radio-stations-guide', 'gta-6-global-release-times-and-timezone-guide']) {
  test(`${slug} is complete and crawlable without JavaScript`, async ({ page }) => {
    await page.goto(`/guides/${slug}/`, { waitUntil: 'domcontentloaded' });
    await expect(page.locator('h1')).toHaveCount(1);
    await expect(page.locator('meta[name="robots"]')).not.toHaveAttribute('content', /noindex/);
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', `https://zixtool.online/guides/${slug}/`);
    const title = await page.locator('h1').innerText();
    const schemas = await page.locator('script[type="application/ld+json"]').allTextContents();
    expect(schemas.flatMap(text => JSON.parse(text)).some(item => item['@type'] === 'Article' && item.headline === title)).toBe(true);
    const anchors = page.getByRole('navigation', { name: 'Guide contents' }).locator('a');
    for (const anchor of await anchors.all()) {
      const href = await anchor.getAttribute('href');
      expect(href).toMatch(/^#[a-z-]+$/);
      await expect(page.locator(href!)).toHaveCount(1);
    }
    expect(await page.locator('article a[href^="/"]').count()).toBeGreaterThan(8);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  });
}

test('tool pages link to relevant guides in initial HTML', async ({ page }) => {
  await page.goto('/compress-image-to-20kb/', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('a[href="/guides/image-upload-requirements/"]').first()).toBeVisible();
  await page.goto('/tip-calculator/', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('a[href="/guides/restaurant-tipping-and-bill-splitting/"]').first()).toBeVisible();
  await page.goto('/aspect-ratio-calculator/', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('a[href="/guides/gta-6-pc-system-requirements-and-hardware-guide/"]').first()).toBeVisible();
  await page.goto('/guides/', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('h1')).toHaveCount(1);
  await expect(page.locator('a[href="/guides/pdf-file-size-limits/"]')).toBeVisible();
  await expect(page.locator('a[href="/guides/restaurant-tipping-and-bill-splitting/"]')).toBeVisible();
  await expect(page.locator('a[href="/guides/gta-6-pc-system-requirements-and-hardware-guide/"]')).toBeVisible();
});

test('unimplemented PDF rendering is excluded and explained', async ({ page }) => {
  await page.goto('/pdf-to-jpg/', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /noindex/);
  await expect(page.locator('main')).toContainText('not ready for PDF page conversion');
});
