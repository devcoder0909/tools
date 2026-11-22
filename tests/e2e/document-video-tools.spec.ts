import {test,expect} from '@playwright/test';
import {PDFDocument} from 'pdf-lib';
import {unzipSync,strFromU8} from 'fflate';

test.beforeEach(async({page})=>{await page.route(/fonts\.(googleapis|gstatic)\.com/,r=>r.abort());});
for(const slug of ['pdf-to-text','pdf-to-word']){
  test(slug+' exports text from two PDF pages',async({page})=>{
    test.setTimeout(60000);
    const pdf=await PDFDocument.create();
    for(const line of ['First sample','Second sample']) pdf.addPage().drawText(line);
    await page.goto('/'+slug+'/',{waitUntil:'domcontentloaded'});
    await page.locator('section[data-hydrated="true"]').waitFor({ timeout: 15000 });
    await page.getByLabel('PDF document').setInputFiles({name:'sample.pdf',mimeType:'application/pdf',buffer:Buffer.from(await pdf.save())});
    await expect(page.getByLabel('Extracted text preview')).toHaveValue(/First sample[\s\S]*Second sample/, { timeout: 30000 });
    const href=await page.locator('a[download]').getAttribute('href');
    const bytes=Uint8Array.from(await page.evaluate(async u=>Array.from(new Uint8Array(await (await fetch(u!)).arrayBuffer())),href));
    const content=slug==='pdf-to-word'?strFromU8(unzipSync(bytes)['word/document.xml']):strFromU8(bytes);
    expect(content).toContain('First sample'); expect(content).toContain('Second sample');
  });
}
test('compresses a real MP4 into a playable smaller clip',async({page})=>{
  test.setTimeout(90000);
  await page.goto('/video-compressor/',{waitUntil:'domcontentloaded'});
  await page.locator('section[data-hydrated="true"]').waitFor({ timeout: 15000 });
  // Public-domain fixture from MDN interactive examples, media/cc0-videos/flower.mp4.
  await page.getByLabel('Video file').setInputFiles('tests/fixtures/flower-cc0.mp4');
  await page.getByLabel('Target size in MB').fill('0.3');
  await page.getByRole('button',{name:'Compress video'}).click();
  await expect(page.getByRole('link',{name:'Download compressed video'})).toBeVisible({timeout:60000});
  const output=await page.locator('video').evaluate(async v=>({size:(await (await fetch((v as HTMLVideoElement).src)).blob()).size,width:(v as HTMLVideoElement).videoWidth}));
  expect(output.size).toBeGreaterThan(1000); expect(output.size).toBeLessThan(1128375);
  await expect.poll(()=>page.locator('video').evaluate(v=>(v as HTMLVideoElement).videoWidth)).toBeGreaterThan(0);
});

