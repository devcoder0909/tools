import { getAllTools, getAllFormats } from '../src/registry';
import { siteConfig } from '../src/config/site';

async function pingIndexNow() {
  const apiKey = process.env.INDEXNOW_KEY || 'c0nvert8892df91024gudmud';

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

  const payload = {
    host: siteConfig.domain,
    key: apiKey,
    keyLocation: `${siteConfig.url}/${apiKey}.txt`,
    urlList,
  };

  console.log(`[IndexNow] Preparing notification for ${urlList.length} URLs on ${siteConfig.domain}...`);

  try {
    const res = await fetch('https://api.indexnow.org/indexnow', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
      },
      body: JSON.stringify(payload),
    });

    if (res.ok || res.status === 200 || res.status === 202) {
      console.log(`[IndexNow] Successfully notified IndexNow for ${urlList.length} URLs (Status: ${res.status}).`);
    } else {
      const errorText = await res.text();
      console.warn(`[IndexNow] Ping returned status ${res.status}: ${errorText}`);
    }
  } catch (err: any) {
    console.warn(`[IndexNow] Notice: Could not reach IndexNow endpoint (${err.message}). Notification will retry on next build/deploy.`);
  }
}

pingIndexNow();
