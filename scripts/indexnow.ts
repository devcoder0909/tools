import fs from 'node:fs';
import path from 'node:path';
import * as cheerio from 'cheerio';
import { siteConfig } from '../src/config/site';

async function main() {
  if (!process.argv.includes('--submit')) {
    console.log('[IndexNow] Build only. After deployment run: pnpm exec tsx scripts/indexnow.ts --submit');
    return;
  }
  const key = process.env.INDEXNOW_KEY || 'c0nvert8892df91024gudmud';
  if (!/^[a-zA-Z0-9-]{8,128}$/.test(key)) throw new Error('Invalid IndexNow key.');
  const keyLocation = `${siteConfig.url}/${key}.txt`;
  const keyResponse = await fetch(keyLocation, { signal: AbortSignal.timeout(15000) });
  if (!keyResponse.ok || (await keyResponse.text()).trim() !== key) {
    throw new Error('Deploy the matching IndexNow key file before submitting URLs.');
  }
  const urls = new Set<string>();
  for (const shard of ['pages', 'tools', 'formats']) {
    const xml = fs.readFileSync(path.resolve('dist', `sitemap-${shard}.xml`), 'utf-8');
    const $ = cheerio.load(xml, { xmlMode: true });
    $('url > loc').each((_, element) => {
      const url = new URL($(element).text());
      if (url.origin !== siteConfig.url || url.search || url.hash) throw new Error('Invalid sitemap URL.');
      urls.add(url.href);
    });
  }
  const urlList = [...urls];
  if (!urlList.length) throw new Error('No sitemap URLs. Build first.');
  // Participating engines share notifications; one endpoint is sufficient.
  for (let offset = 0; offset < urlList.length; offset += 10000) {
    const batch = urlList.slice(offset, offset + 10000);
    const response = await fetch('https://api.indexnow.org/indexnow', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
      body: JSON.stringify({ host: siteConfig.domain, key, keyLocation, urlList: batch }),
      signal: AbortSignal.timeout(30000),
    });
    if (response.status !== 200 && response.status !== 202) throw new Error(`IndexNow HTTP ${response.status}`);
    console.log(`[IndexNow] ${batch.length} notifications accepted (HTTP ${response.status}). This does not confirm indexing. Google does not use IndexNow.`);
  }
}
main().catch((error) => {
  console.error(`[IndexNow] ${error.message}`);
  process.exitCode = 1;
});
