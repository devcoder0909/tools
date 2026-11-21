import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import * as cheerio from 'cheerio';
import { siteConfig } from '../src/config/site';

export function pageIssues(html: string, expected: string, headers: Headers): string[] {
  const $ = cheerio.load(html);
  const issues: string[] = [];
  const directives = [headers.get('x-robots-tag') || '', ...$('meta').toArray()
    .filter(node => /^(robots|googlebot)$/i.test($(node).attr('name') || ''))
    .map(node => $(node).attr('content') || '')].join(',');
  if (/\b(noindex|none)\b/i.test(directives)) issues.push('Indexing blocked by robots directive');
  const canonicals = $('link[rel="canonical"]');
  if (canonicals.length !== 1 || canonicals.attr('href') !== expected) issues.push('Canonical differs from expected URL');
  if (!$('title').text().trim()) issues.push('Missing title');
  if (!$('meta[name="description"]').attr('content')?.trim()) issues.push('Missing description');
  if ($('h1').length !== 1) issues.push('Expected one H1');
  return issues;
}

export function sitemapUrls(xml: string): string[] {
  const $ = cheerio.load(xml, { xmlMode: true });
  return $('urlset > url > loc').toArray().map(node => $(node).text().trim());
}

export async function verifyRelease(dist: string, origin: string, request: typeof fetch = fetch) {
  const issues: { url: string; kind: 'response' | 'network'; message: string }[] = [];
  const expected = new Set<string>();
  const files = fs.readdirSync(dist).filter(name => /^sitemap.*\.xml$/.test(name));
  if (!files.length) throw new Error('Build the site first: no generated sitemaps found');
  // Read only local build URLs, never arbitrary destinations supplied by a remote sitemap.
  for (const file of files) for (const url of sitemapUrls(fs.readFileSync(path.join(dist, file), 'utf8'))) {
    if (new URL(url).origin !== siteConfig.url) throw new Error(`Unexpected sitemap origin: ${url}`);
    expected.add(url);
  }
  if (!expected.size) throw new Error('Generated sitemaps contain no pages');
  const fetchText = async (url: string): Promise<{ text: string; headers: Headers } | undefined> => {
    try {
      const response = await request(url, { redirect: 'manual', signal: AbortSignal.timeout(15000) });
      if (response.status !== 200) {
        issues.push({ url, kind: 'response', message: `Expected HTTP 200, received ${response.status}` });
        await response.body?.cancel();
        return;
      }
      return { text: await response.text(), headers: response.headers };
    } catch (error) {
      issues.push({ url, kind: 'network', message: `Could not verify: ${error instanceof Error ? error.message : String(error)}` });
    }
  };
  for (const file of files) {
    const url = new URL(file, origin).href;
    const live = await fetchText(url);
    if (!live) continue;
    const local = cheerio.load(fs.readFileSync(path.join(dist, file), 'utf8'), { xmlMode: true });
    const remote = cheerio.load(live.text, { xmlMode: true });
    // Includes child sitemap references as well as image/page locations.
    const locations = (doc: cheerio.CheerioAPI) => doc('loc').toArray().map(node => doc(node).text().trim()).sort();
    if (JSON.stringify(locations(local)) !== JSON.stringify(locations(remote))) {
      issues.push({ url, kind: 'response', message: 'Published sitemap locations differ from the build' });
    }
  }
  const queue = [...expected];
  let checked = 0;
  await Promise.all(Array.from({ length: 3 }, async () => {
    while (queue.length) {
      const canonical = queue.shift()!;
      const url = new URL(new URL(canonical).pathname, origin).href;
      const live = await fetchText(url);
      if (live) for (const message of pageIssues(live.text, canonical, live.headers)) issues.push({ url, kind: 'response', message });
      checked++;
    }
  }));
  return { checkedAt: new Date().toISOString(), origin, checked, issues };
}

async function main() {
  const origin = new URL(process.env.SEO_CHECK_ORIGIN || siteConfig.url).origin;
  const report = await verifyRelease(path.resolve('dist'), origin);
  fs.mkdirSync('.seo-reports', { recursive: true });
  fs.writeFileSync('.seo-reports/live-release.json', JSON.stringify(report, null, 2) + '\n');
  console.log(`Checked ${report.checked} pages; ${report.issues.length} issues. Report: .seo-reports/live-release.json`);
  for (const issue of report.issues.slice(0, 20)) console.error(`[${issue.kind}] ${issue.url}: ${issue.message}`);
  if (report.issues.length) process.exitCode = 1;
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  main().catch(error => { console.error(error); process.exitCode = 1; });
}
