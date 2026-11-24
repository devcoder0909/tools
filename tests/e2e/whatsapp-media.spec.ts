import { test, expect } from '@playwright/test';

test('saves a DP and status video, and handles a failed media link', async ({ page }) => {
  await page.route(/fonts\.(googleapis|gstatic)\.com/, r => r.abort());
  await page.goto('/whatsapp-dp-status-downloader/', { waitUntil: 'domcontentloaded' });
  const image = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=', 'base64');
  await page.locator('input[type=file]').setInputFiles({ name: 'profile.png', mimeType: 'image/png', buffer: image });
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('WhatsApp DP Downloader');
  await expect(page.getByText('1 × 1 pixels')).toBeVisible();
  await page.getByRole('button', { name: 'View original size' }).click();
  await expect(page.getByRole('dialog', { name: 'Original size photo' })).toBeVisible();
  await page.getByRole('button', { name: 'Close preview' }).click();
  const download = page.waitForEvent('download');
  await page.getByRole('link', { name: 'Download profile photo' }).click();
  expect((await download).suggestedFilename()).toBe('whatsapp-dp.png');

  // Verify phone number direct open helper
  const phoneInput = page.getByLabel('WhatsApp phone number');
  await phoneInput.fill('15551234567');
  const viewButton = page.getByRole('link', { name: 'View Profile Picture' });
  await expect(viewButton).toHaveAttribute('href', /https:\/\/wa\.me\/\d+/);

  const link = page.getByLabel('Direct media link');
  await link.fill('https://wa.me/123');
  await page.getByRole('button', { name: 'Load media' }).click();
  await expect(page.getByRole('status')).toContainText('chat or invite link');
  await link.evaluate((input, bytes) => {
    const clipboard = new DataTransfer();
    clipboard.items.add(new File([new Uint8Array(bytes)], 'copied.png', { type: 'image/png' }));
    input.dispatchEvent(new ClipboardEvent('paste', { bubbles: true, cancelable: true, clipboardData: clipboard }));
  }, Array.from(image));
  await expect(page.getByText('1 × 1 pixels')).toBeVisible();
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
