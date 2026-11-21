import { test, expect } from '@playwright/test';

test('saves a DP and status video, and handles a failed media link', async ({ page }) => {
  await page.route(/fonts\.(googleapis|gstatic)\.com/, r => r.abort());
  await page.goto('/whatsapp-dp-status-downloader/', { waitUntil: 'domcontentloaded' });
  const image = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=', 'base64');
  await page.locator('input[type=file]').setInputFiles({ name: 'profile.png', mimeType: 'image/png', buffer: image });
  const download = page.waitForEvent('download');
  await page.getByRole('link', { name: 'Download profile photo' }).click();
  expect((await download).suggestedFilename()).toBe('whatsapp-dp.png');
  await page.getByLabel('Media to save').selectOption('status');
  await expect(page.getByRole('link', { name: 'Download profile photo' })).toHaveCount(0);
  const url = 'https://media.example/status.mp4';
  await page.route(url, route => route.fulfill({ contentType: 'video/mp4', headers: { 'access-control-allow-origin': '*' }, body: Buffer.from('fixture') }));
  await page.getByLabel('Direct media link').fill(url);
  await page.getByRole('button', { name: 'Load media' }).click();
  const href = await page.getByRole('link', { name: 'Download status' }).getAttribute('href');
  expect(await page.evaluate(async url => (await fetch(url!)).text(), href)).toBe('fixture');
  await page.route('https://media.example/missing', route => route.abort());
  await page.getByLabel('Direct media link').fill('https://media.example/missing');
  await page.getByRole('button', { name: 'Load media' }).click();
  await expect(page.getByRole('status')).toContainText('Could not read');
});
