import { test, expect } from '@playwright/test';
import QRCode from 'qrcode';

test('reads QR images and offers a link only for web addresses', async ({page}) => {
  await page.route(/fonts\.(googleapis|gstatic)\.com/, route=>route.abort());
  await page.goto('/qr-code-scanner/', {waitUntil:'domcontentloaded'});
  const file = page.getByLabel('QR code image');
  for (const value of ['https://example.com/menu?table=2','WIFI:T:WPA;S:Example;P:sample;;','javascript:alert(1)']) {
    await file.setInputFiles({name:'qr.png',mimeType:'image/png',buffer:await QRCode.toBuffer(value)});
    await expect(page.getByLabel('Decoded content')).toHaveValue(value);
    const open = page.getByRole('link',{name:/^Open example\.com$/});
    if(value.startsWith('https:')) await expect(open).toHaveAttribute('href',value);
    else await expect(open).toHaveCount(0);
  }
  await file.setInputFiles({name:'bad.png',mimeType:'image/png',buffer:Buffer.from('unreadable')});
  await expect(page.getByRole('status')).toContainText('Could not read');
  await expect(page.getByLabel('Decoded content')).toHaveCount(0);
});
