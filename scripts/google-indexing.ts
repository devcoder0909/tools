/**
 * Google Indexing API (v3) & IndexNow Multi-Engine Notification System
 *
 * Supports:
 *  1. Google Service Account Key (automatic RS256 JWT signing - no OAuth consent screen needed)
 *  2. OAuth 2.0 Access Token (via GOOGLE_INDEXING_TOKEN env var)
 *  3. IndexNow Key (Bing & Yandex)
 *  4. Single URL, Batch URLs, Status Check, or Continuous Scheduled Auto-Indexing
 *
 * Usage:
 *   # Service account automatic authentication (looks for service-account.json or GOOGLE_APPLICATION_CREDENTIALS):
 *   pnpm exec tsx scripts/google-indexing.ts
 *
 *   # OAuth Bearer Token:
 *   GOOGLE_INDEXING_TOKEN="ya29..." pnpm exec tsx scripts/google-indexing.ts
 *
 *   # Single URL Publish or Status Check:
 *   pnpm exec tsx scripts/google-indexing.ts --url https://convert.gudmud.site/heic-to-jpg/
 *   pnpm exec tsx scripts/google-indexing.ts --status https://convert.gudmud.site/heic-to-jpg/
 *
 *   # Continuous Auto-Indexing (e.g. every 60 minutes):
 *   pnpm exec tsx scripts/google-indexing.ts --continuous --interval 60
 */

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { siteConfig } from '../src/config/site';
import { googleOAuthConfig } from '../src/config/google-oauth';
import { getIndexableTools } from '../src/registry';

interface ServiceAccountKey {
  client_email: string;
  private_key: string;
  project_id?: string;
}

const INDEXNOW_KEY = 'fbfbc05b9070df2dcd6684c6d12c7a0b';
const STATUS_LOG_PATH = path.resolve(process.cwd(), 'dist', 'indexing-report.json');

function base64url(source: Buffer | string): string {
  const buf = typeof source === 'string' ? Buffer.from(source, 'utf-8') : source;
  return buf.toString('base64').replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
}

/**
 * Mint Google OAuth 2.0 Access Token from a Service Account JSON Key
 */
async function getAccessTokenFromServiceAccount(key: ServiceAccountKey): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const header = { alg: 'RS256', typ: 'JWT' };
  const payload = {
    iss: key.client_email,
    scope: googleOAuthConfig.indexingScope,
    aud: 'https://oauth2.googleapis.com/token',
    exp: now + 3600,
    iat: now,
  };

  const encodedHeader = base64url(JSON.stringify(header));
  const encodedPayload = base64url(JSON.stringify(payload));
  const unsignedToken = `${encodedHeader}.${encodedPayload}`;

  const signer = crypto.createSign('RSA-SHA256');
  signer.update(unsignedToken);
  const signature = signer.sign(key.private_key, 'base64');
  const encodedSignature = signature.replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  const jwt = `${unsignedToken}.${encodedSignature}`;

  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt,
    }).toString(),
  });

  const body = (await res.json()) as any;
  if (!res.ok || !body.access_token) {
    throw new Error(`Failed to exchange JWT for access token: ${JSON.stringify(body)}`);
  }

  return body.access_token;
}

/**
 * Locate and read Service Account credentials if available
 */
function findServiceAccountKey(): ServiceAccountKey | null {
  const possiblePaths = [
    process.env.GOOGLE_APPLICATION_CREDENTIALS,
    path.resolve(process.cwd(), 'service-account.json'),
    path.resolve(process.cwd(), 'service-account.json.json'),
    path.resolve(process.cwd(), 'google-service-account.json'),
    path.resolve(process.cwd(), 'converter-service-account.json'),
    path.resolve(process.cwd(), '.google-service-account.json'),
  ].filter(Boolean) as string[];

  for (const p of possiblePaths) {
    if (fs.existsSync(p)) {
      try {
        const raw = fs.readFileSync(p, 'utf-8');
        const parsed = JSON.parse(raw);
        if (parsed.client_email && parsed.private_key) {
          console.log(`[Google Indexing] Loaded Service Account from: ${p} (${parsed.client_email})`);
          return parsed;
        }
      } catch (err: any) {
        console.warn(`[Google Indexing] Could not parse key file at ${p}:`, err.message);
      }
    }
  }

  // Also check if raw JSON key was passed in environment variable
  if (process.env.GCP_SERVICE_ACCOUNT_KEY) {
    try {
      const parsed = JSON.parse(process.env.GCP_SERVICE_ACCOUNT_KEY);
      if (parsed.client_email && parsed.private_key) {
        console.log(`[Google Indexing] Loaded Service Account from GCP_SERVICE_ACCOUNT_KEY env var (${parsed.client_email})`);
        return parsed;
      }
    } catch {}
  }

  return null;
}

/**
 * Publish URL notification to Google Indexing API v3
 */
async function publishGoogleUrl(token: string, url: string, type: 'URL_UPDATED' | 'URL_DELETED' = 'URL_UPDATED') {
  try {
    const res = await fetch(googleOAuthConfig.indexingEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ url, type }),
    });

    const status = res.status;
    const body = (await res.json()) as any;
    if (status === 200) {
      console.log(`  ✓ [Google 200 OK] ${url} (notifyTime: ${body.urlNotificationMetadata?.latestUpdate?.notifyTime || 'now'})`);
    } else {
      console.error(`  ✗ [Google ${status}] ${url}:`, body.error?.message || JSON.stringify(body));
    }
    return { status, body };
  } catch (err: any) {
    console.error(`  ✗ [Google Error] ${url}:`, err.message);
    return { status: 0, error: err.message };
  }
}

/**
 * Query URL metadata from Google Indexing API v3
 */
async function queryGoogleUrlMetadata(token: string, url: string) {
  try {
    const endpoint = `${googleOAuthConfig.metadataEndpoint}?url=${encodeURIComponent(url)}`;
    const res = await fetch(endpoint, {
      method: 'GET',
      headers: { Authorization: `Bearer ${token}` },
    });
    const status = res.status;
    const body = (await res.json()) as any;
    console.log(`[Google Indexing Metadata] HTTP ${status} for ${url}:`);
    console.log(JSON.stringify(body, null, 2));
    return { status, body };
  } catch (err: any) {
    console.error(`[Google Indexing Metadata Error] ${url}:`, err.message);
    return { status: 0, error: err.message };
  }
}

/**
 * Ping IndexNow (Bing, Yandex, Seznam, Naver)
 */
async function notifyIndexNow(urls: string[]) {
  console.log(`\n[IndexNow] Submitting ${urls.length} URLs to https://api.indexnow.org/indexnow...`);
  try {
    const res = await fetch('https://api.indexnow.org/indexnow', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
      body: JSON.stringify({
        host: 'convert.gudmud.site',
        key: INDEXNOW_KEY,
        keyLocation: `https://convert.gudmud.site/${INDEXNOW_KEY}.txt`,
        urlList: urls,
      }),
    });

    if (res.status === 200 || res.status === 202) {
      console.log(`  ✓ [IndexNow ${res.status}] Successfully notified Bing/Yandex for ${urls.length} URLs!`);
    } else {
      const text = await res.text();
      console.error(`  ✗ [IndexNow ${res.status}] Notification response:`, text);
    }
  } catch (err: any) {
    console.error(`  ✗ [IndexNow Error]:`, err.message);
  }
}

/**
 * Collect all active, reviewed, indexable URLs across the site
 */
function getActiveSiteUrls(): string[] {
  const staticPages = [
    `${siteConfig.url}/`,
    `${siteConfig.url}/tools/`,
    `${siteConfig.url}/calculators/`,
    `${siteConfig.url}/formats/`,
    `${siteConfig.url}/privacy-explained/`,
    `${siteConfig.url}/about/`,
  ];

  const toolPages = getIndexableTools().map((t) => `${siteConfig.url}/${t.slug}/`);
  return Array.from(new Set([...staticPages, ...toolPages]));
}

async function runIndexingBatch(token: string | null, targetUrl?: string) {
  const urls = targetUrl ? [targetUrl] : getActiveSiteUrls();
  const timestamp = new Date().toISOString();
  console.log(`\n[Indexing Dispatch] Started at ${timestamp} (${urls.length} URLs)`);

  const results: any[] = [];

  // 1. Google Indexing API Notification
  if (token) {
    console.log(`[Google Indexing API] Publishing ${urls.length} URLs...`);
    for (const u of urls) {
      const res = await publishGoogleUrl(token, u);
      results.push({ url: u, googleStatus: res.status, googleBody: res.body });
      await new Promise((r) => setTimeout(r, 150)); // Respect Google API rate quotas
    }
  } else {
    console.log('\n[Google Indexing API] Skipped: No Service Account key or GOOGLE_INDEXING_TOKEN available.');
  }

  // 2. IndexNow Notification (Always runs, requires no OAuth)
  await notifyIndexNow(urls);

  // 3. Write report to disk
  try {
    const distDir = path.dirname(STATUS_LOG_PATH);
    if (!fs.existsSync(distDir)) fs.mkdirSync(distDir, { recursive: true });
    fs.writeFileSync(
      STATUS_LOG_PATH,
      JSON.stringify(
        {
          lastRun: timestamp,
          totalUrls: urls.length,
          googleAuthenticated: !!token,
          results,
        },
        null,
        2
      )
    );
    console.log(`\n[Indexing Status] Report saved to ${STATUS_LOG_PATH}`);
  } catch {}
}

async function main() {
  console.log('\n======================================================');
  console.log(' Gudmud Convert - Instant Multi-Engine Indexing Engine');
  console.log('======================================================');
  console.log(`Host: ${siteConfig.url}`);
  console.log(`GCP Project: ${googleOAuthConfig.projectId}`);
  console.log(`OAuth Client: ${googleOAuthConfig.clientId.slice(0, 32)}...`);
  console.log(`Known GSC Owners: converter@precise-space-365809.iam.gserviceaccount.com`);
  console.log(`                 converter-594@precise-space-365809.iam.gserviceaccount.com`);

  const args = process.argv.slice(2);
  let token = process.env.GOOGLE_INDEXING_TOKEN?.trim() || null;

  // Attempt Service Account key authentication if no token provided
  if (!token) {
    const saKey = findServiceAccountKey();
    if (saKey) {
      try {
        console.log(`[Google Indexing] Authenticating via Service Account (${saKey.client_email})...`);
        token = await getAccessTokenFromServiceAccount(saKey);
        console.log(`[Google Indexing] Service Account Access Token acquired successfully!`);
      } catch (err: any) {
        console.error(`[Google Indexing] Service Account authentication error:`, err.message);
      }
    }
  }

  // Status query flag
  const statusIndex = args.indexOf('--status');
  if (statusIndex !== -1 && args[statusIndex + 1]) {
    const queryUrl = args[statusIndex + 1];
    if (!token) {
      console.error('Error: Token or Service Account key required to query Google metadata.');
      process.exit(1);
    }
    await queryGoogleUrlMetadata(token, queryUrl);
    return;
  }

  // Single URL flag
  const urlIndex = args.indexOf('--url');
  const targetUrl = urlIndex !== -1 && args[urlIndex + 1] ? args[urlIndex + 1] : undefined;

  // Continuous auto-indexing mode
  const continuous = args.includes('--continuous') || args.includes('--watch');
  const intervalIndex = args.indexOf('--interval');
  const intervalMinutes = intervalIndex !== -1 && parseInt(args[intervalIndex + 1], 10) ? parseInt(args[intervalIndex + 1], 10) : 60;

  if (continuous) {
    console.log(`\n🔄 Continuous auto-indexing enabled. Running every ${intervalMinutes} minute(s)...`);
    // Run immediately first
    await runIndexingBatch(token, targetUrl);

    // Schedule recurrence
    setInterval(async () => {
      console.log(`\n⏰ Interval trigger (${intervalMinutes}m elapsed)...`);
      // Refresh token if using service account
      const saKey = findServiceAccountKey();
      if (saKey) {
        try {
          token = await getAccessTokenFromServiceAccount(saKey);
        } catch {}
      }
      await runIndexingBatch(token, targetUrl);
    }, intervalMinutes * 60 * 1000);
  } else {
    await runIndexingBatch(token, targetUrl);
  }
}

main().catch((err) => {
  console.error('Fatal Indexing Error:', err);
  process.exit(1);
});
