import { getAllTools } from '../src/registry';
import { siteConfig } from '../src/config/site';
import fs from 'node:fs';
import path from 'node:path';
import * as cheerio from 'cheerio';

// Editorial targets are hypotheses, not measured search demand or rankings.
const tools = getAllTools();
const terms = new Map<string, string[]>();
const dist = path.resolve('dist');
if (!fs.existsSync(path.join(dist, 'index.html'))) throw new Error('Run pnpm run build before auditing generated HTML.');
const inbound = new Map<string, Set<string>>();
function visit(dir: string) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const file = path.join(dir, entry.name);
    if (entry.isDirectory()) visit(file);
    else if (entry.name === 'index.html') {
      const relative = path.relative(dist, path.dirname(file)).split(path.sep).filter(Boolean).join('/');
      const source = relative ? `/${relative}/` : '/';
      const $ = cheerio.load(fs.readFileSync(file, 'utf8'));
      $('a[href]').each((_, el) => {
        try {
          const url = new URL($(el).attr('href')!, siteConfig.url);
          if (url.origin !== siteConfig.url) return;
          const target = url.pathname.endsWith('/') ? url.pathname : `${url.pathname}/`;
          if (!inbound.has(target)) inbound.set(target, new Set());
          inbound.get(target)!.add(source);
        } catch { /* Ignore malformed links in the report. */ }
      });
    }
  }
}
visit(dist);
const normalize = (s: string) => s.toLocaleLowerCase('en-US').replace(/[^\p{L}\p{N}]+/gu, ' ').trim();
const rows = tools.map(tool => {
  const primary = tool.seo?.primary_kw?.trim() || '';
  const key = normalize(primary);
  if (key) terms.set(key, [...(terms.get(key) || []), tool.slug]);
  const file = path.join(dist, tool.slug, 'index.html');
  const $ = fs.existsSync(file) ? cheerio.load(fs.readFileSync(file, 'utf8')) : null;
  const title = $?.('title').text().trim() || '';
  const h1 = $?.('h1').first().text().trim() || '';
  const description = $?.('meta[name="description"]').attr('content')?.trim() || '';
  const mentions = (value: string) => key ? normalize(value).includes(key) : null;
  return { slug: tool.slug, url: `${siteConfig.url}/${tool.slug}/`, indexable: !!(tool.indexable && tool.reviewed && tool.last_reviewed), primary, secondary: tool.seo?.secondary_kws || [], title, h1, description, primaryInTitle: mentions(title), primaryInH1: mentions(h1), primaryInDescription: mentions(description), inboundPages: inbound.get(`/${tool.slug}/`)?.size || 0, built: !!$ };
});
const report = { generatedAt: new Date().toISOString(), note: 'Editorial targets and literal phrase checks only; wording variants may be valid. Search volume, competition and ranking are unknown without external data.', pages: rows, missingPrimary: rows.filter(row => row.indexable && !row.primary).map(row => row.slug), duplicatePrimary: [...terms.entries()].filter(([, slugs]) => slugs.length > 1).map(([keyword, slugs]) => ({ keyword, slugs })), review: rows.filter(row => row.indexable && (!row.built || !row.primaryInTitle || !row.primaryInH1 || row.inboundPages < 3)).map(row => row.slug) };
fs.mkdirSync('.seo-reports', { recursive: true });
fs.writeFileSync('.seo-reports/keyword-coverage.json', JSON.stringify(report, null, 2) + '\n');
console.log(`Audited ${rows.length} tools. ${report.review.length} pages need editorial review. Report: .seo-reports/keyword-coverage.json`);
