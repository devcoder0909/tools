import { getIndexableTools } from '../src/registry';
import { siteConfig } from '../src/config/site';

async function pingIndexNow() {
  const apiKey = process.env.INDEXNOW_KEY;
  if (!apiKey) {
    console.log('[IndexNow] INDEXNOW_KEY environment variable not configured. Skipping IndexNow ping.');
    return;
  }

  const indexableTools = getIndexableTools();
  const urlList = [
    `${siteConfig.url}/`,
    `${siteConfig.url}/tools/`,
    `${siteConfig.url}/calculators/`,
    `${siteConfig.url}/formats/`,
    ...indexableTools.map((t) => `${siteConfig.url}/${t.slug}/`),
  ];

  const payload = {
    host: siteConfig.domain,
    key: apiKey,
    keyLocation: `${siteConfig.url}/${apiKey}.txt`,
    urlList,
  };

  try {
    const res = await fetch('https://api.indexnow.org/indexnow', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
      },
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      console.log(`[IndexNow] Successfully notified IndexNow for ${urlList.length} URLs (Status: ${res.status}).`);
    } else {
      console.warn(`[IndexNow] Ping returned status ${res.status}: ${await res.text()}`);
    }
  } catch (err: any) {
    console.warn(`[IndexNow] Failed to reach IndexNow API: ${err.message}`);
  }
}

pingIndexNow();
