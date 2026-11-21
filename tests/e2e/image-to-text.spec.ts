import { test, expect } from '@playwright/test';

test('recognizes printed words from a PNG using the local OCR assets', async ({ page }) => {
  test.setTimeout(90000);
  await page.route(/fonts\.(googleapis|gstatic)\.com/, route => route.abort());
  await page.goto('/image-to-text/', { waitUntil: 'domcontentloaded' });
  const png = await page.evaluate(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 640; canvas.height = 140;
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = 'white'; ctx.fillRect(0, 0, 640, 140);
    ctx.font = '48px Arial'; ctx.fillStyle = 'black'; ctx.fillText('TRAIN TIME 123', 30, 85);
    return canvas.toDataURL().split(',')[1];
  });
  await page.getByLabel('Image file').setInputFiles({ name: 'sample.png', mimeType: 'image/png', buffer: Buffer.from(png, 'base64') });
  await page.getByRole('button', { name: 'Extract text' }).click();
  await expect(page.getByLabel('Extracted text')).toHaveValue(/TRAIN TIME 123/, { timeout: 60000 });
  await page.getByLabel('Extracted text').fill('Edited text');
  await expect(page.getByRole('button', {name:'Copy text'})).toBeEnabled();
});
