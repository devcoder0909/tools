import fs from 'node:fs';
import path from 'node:path';
import { getAllTools, getAllFormats } from '../src/registry';
import { siteConfig } from '../src/config/site';

async function pingIndexNow() {
  const apiKey = process.env.INDEXNOW_KEY || 'fbfbc05b9070df2dcd6684c6d12c7a0b';

  const tools = getAllTools().filter((t) => t.indexable && t.reviewed && t.last_reviewed);
  const formats = getAllFormats().filter((f) => f.hub && f.indexable);

  const urlList = [
    `${siteConfig.url}/`,
    `${siteConfig.url}/tools/`,
    `${siteConfig.url}/calculators/`,
    `${siteConfig.url}/formats/`,
    `${siteConfig.url}/privacy-explained/`,
    `${siteConfig.url}/about/`,
    `${siteConfig.url}/contact/`,
    ...formats.map((f) => `${siteConfig.url}/formats/${f.id}/`),
    ...tools.map((t) => `${siteConfig.url}/${t.slug}/`),
  ];

  const collegesDataPath = path.resolve(process.cwd(), 'src/data/colleges.json');
  if (fs.existsSync(collegesDataPath)) {
    urlList.push(
      `${siteConfig.url}/colleges/`,
      `${siteConfig.url}/cutoff/`,
      `${siteConfig.url}/cutoff/computer-science/`,
      `${siteConfig.url}/cutoff/iits/`,
      `${siteConfig.url}/cutoff/nits/`,
      `${siteConfig.url}/cutoff/iiits/`,
      `${siteConfig.url}/cutoff/gftis/`,
      `${siteConfig.url}/jee-main-rank-college-predictor/`,
      `${siteConfig.url}/jee-advanced-rank-college-predictor/`,
      `${siteConfig.url}/nirf-ranking/`
    );
  }

  const payload = {
    host: siteConfig.domain,
    key: apiKey,
    keyLocation: `${siteConfig.url}/${apiKey}.txt`,
    urlList,
  };

  console.log(`[IndexNow] Preparing notification for ${urlList.length} URLs on ${siteConfig.domain}...`);

  const endpoints = [
    'https://api.indexnow.org/indexnow',
    'https://www.bing.com/indexnow',
  ];

  for (const endpoint of endpoints) {
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
        },
        body: JSON.stringify(payload),
      });

      if (res.ok || res.status === 200 || res.status === 202) {
        console.log(`[IndexNow] Successfully notified ${new URL(endpoint).hostname} for ${urlList.length} URLs (Status: ${res.status}).`);
      } else {
        const errorText = await res.text();
        console.warn(`[IndexNow] ${new URL(endpoint).hostname} returned status ${res.status}: ${errorText}`);
      }
    } catch (err: any) {
      console.warn(`[IndexNow] Notice: Could not reach ${endpoint} (${err.message}).`);
    }
  }
}

pingIndexNow();
