/**
 * Google Indexing API (v3) CLI Notification & Testing Script
 *
 * Usage:
 *   GOOGLE_INDEXING_TOKEN="ya29..." pnpm exec tsx scripts/google-indexing.ts
 *   GOOGLE_INDEXING_TOKEN="ya29..." pnpm exec tsx scripts/google-indexing.ts --url https://convert.gudmud.site/json-formatter/
 *   GOOGLE_INDEXING_TOKEN="ya29..." pnpm exec tsx scripts/google-indexing.ts --status https://convert.gudmud.site/json-formatter/
 */

import { siteConfig } from '../src/config/site';
import { googleOAuthConfig } from '../src/config/google-oauth';

const DEFAULT_TEST_URLS = [
  `${siteConfig.url}/`,
  `${siteConfig.url}/json-formatter/`,
  `${siteConfig.url}/base64-encoder/`,
  `${siteConfig.url}/qr-code-generator/`,
  `${siteConfig.url}/password-generator/`,
  `${siteConfig.url}/emi-calculator/`,
  `${siteConfig.url}/compound-interest-calculator/`,
  `${siteConfig.url}/sip-calculator/`,
  `${siteConfig.url}/percentage-calculator/`,
  `${siteConfig.url}/merge-pdf/`,
  `${siteConfig.url}/compress-pdf/`,
  `${siteConfig.url}/png-to-jpg/`,
];

async function publishUrl(token: string, url: string, type: 'URL_UPDATED' | 'URL_DELETED' = 'URL_UPDATED') {
  console.log(`[Google Indexing] Publishing ${type} for: ${url}`);
  try {
    const res = await fetch(googleOAuthConfig.indexingEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        url,
        type,
      }),
    });

    const status = res.status;
    const body = await res.json();
    if (status === 200) {
      console.log(`[Google Indexing] SUCCESS (HTTP 200) -> Notified at: ${body.urlNotificationMetadata?.latestUpdate?.notifyTime || 'now'}`);
    } else {
      console.error(`[Google Indexing] FAILED (HTTP ${status}):`, JSON.stringify(body, null, 2));
    }
    return { status, body };
  } catch (err: any) {
    console.error(`[Google Indexing] ERROR:`, err.message);
    return { status: 0, error: err.message };
  }
}

async function queryUrlMetadata(token: string, url: string) {
  console.log(`[Google Indexing] Querying metadata for: ${url}`);
  try {
    const endpoint = `${googleOAuthConfig.metadataEndpoint}?url=${encodeURIComponent(url)}`;
    const res = await fetch(endpoint, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    const status = res.status;
    const body = await res.json();
    console.log(`[Google Indexing] Metadata Response (HTTP ${status}):`, JSON.stringify(body, null, 2));
    return { status, body };
  } catch (err: any) {
    console.error(`[Google Indexing] ERROR:`, err.message);
    return { status: 0, error: err.message };
  }
}

async function main() {
  console.log('\n--- [GOOGLE INDEXING API] v3 URL Notification Engine ---');
  console.log(`Project: ${googleOAuthConfig.projectId}`);
  console.log(`Client ID: ${googleOAuthConfig.clientId.slice(0, 30)}...`);

  const token = process.env.GOOGLE_INDEXING_TOKEN?.trim();

  if (!token) {
    console.log('\n⚠️  NO GOOGLE_INDEXING_TOKEN SUPPLIED.');
    console.log('To authenticate via CLI, provide an OAuth 2.0 access token with scope https://www.googleapis.com/auth/indexing:');
    console.log('  export GOOGLE_INDEXING_TOKEN="ya29..."');
    console.log('  pnpm exec tsx scripts/google-indexing.ts\n');
    console.log('Alternatively, open the internal in-browser tester at:');
    console.log(`  ${siteConfig.url}/internal/indexing-tester/\n`);
    process.exit(0);
  }

  const args = process.argv.slice(2);
  const statusFlagIndex = args.indexOf('--status');
  if (statusFlagIndex !== -1 && args[statusFlagIndex + 1]) {
    await queryUrlMetadata(token, args[statusFlagIndex + 1]);
    return;
  }

  const urlFlagIndex = args.indexOf('--url');
  if (urlFlagIndex !== -1 && args[urlFlagIndex + 1]) {
    await publishUrl(token, args[urlFlagIndex + 1]);
    return;
  }

  console.log(`Submitting batch of ${DEFAULT_TEST_URLS.length} top URLs...`);
  for (const url of DEFAULT_TEST_URLS) {
    await publishUrl(token, url);
    await new Promise((r) => setTimeout(r, 200)); // Rate-limiting guard
  }
}

main().catch(console.error);
