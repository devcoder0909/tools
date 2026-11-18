import fs from 'node:fs';
import path from 'node:path';
import * as cheerio from 'cheerio';
import { getAllTools } from '../src/registry';
import { siteConfig } from '../src/config/site';
import { runYoastAudit } from '../src/utils/seo-engine';

const DIST_DIR = path.resolve('dist');
const tools = getAllTools();
const toolMap = new Map();
for (const t of tools) toolMap.set(t.slug, t);

function getHtmlFiles(dir: string): string[] {
  let res: string[] = [];
  for (const f of fs.readdirSync(dir)) {
    const full = path.join(dir, f);
    if (fs.statSync(full).isDirectory()) res = res.concat(getHtmlFiles(full));
    else if (f.endsWith('.html') && !f.startsWith('google')) res.push(full);
  }
  return res;
}

const files = getHtmlFiles(DIST_DIR);
interface PageIssue {
  urlPath: string;
  score: number;
  wordCount: number;
  checks: { status: string; title: string; message: string }[];
}
const issuesByPage: PageIssue[] = [];

for (const filePath of files) {
  const rel = path.relative(DIST_DIR, filePath).replace(/\\/g, '/');
  const urlPath = '/' + (rel === 'index.html' ? '' : rel.replace(/index\.html$/, ''));
  const slug = urlPath.replace(/^\//, '').replace(/\/$/, '');
  const html = fs.readFileSync(filePath, 'utf-8');
  const $ = cheerio.load(html);

  const robotsMeta = $('meta[name="robots"]').attr('content') || '';
  if (robotsMeta.includes('noindex')) continue;

  const title = $('title').text().trim();
  const metaDescription = $('meta[name="description"]').attr('content')?.trim() || '';
  const canonical = $('link[rel="canonical"]').attr('href') || '';
  const h1 = $('h1').first().text().trim();

  const headings: { level: number; text: string }[] = [];
  $('article h1, article h2, article h3, article h4, main h1, main h2, main h3').each((_, el) => {
    const tag = el.tagName.toLowerCase();
    headings.push({ level: parseInt(tag.replace('h', ''), 10), text: $(el).text().trim() });
  });

  const contentEl = $('article').length ? $('article').clone() : $('main').length ? $('main').clone() : $('body').clone();
  contentEl.find('header, nav, footer, script, style, svg').remove();
  const contentText = contentEl.html() || contentEl.text();

  const images: { src: string; alt?: string }[] = [];
  $('img').each((_, el) => {
    images.push({ src: $(el).attr('src') || '', alt: $(el).attr('alt') });
  });
  const internalLinks: { href: string; text?: string }[] = [];
  $('a[href]').each((_, el) => {
    const href = $(el).attr('href') || '';
    if (href.startsWith('/') || href.startsWith(siteConfig.url)) {
      internalLinks.push({ href, text: $(el).text().trim() });
    }
  });

  const jsonLdSchemas: any[] = [];
  $('script[type="application/ld+json"]').each((_, el) => {
    try {
      const p = JSON.parse($(el).html() || '{}');
      if (Array.isArray(p)) jsonLdSchemas.push(...p);
      else jsonLdSchemas.push(p);
    } catch {}
  });

  const toolDef = toolMap.get(slug);
  let focusKeyword = toolDef?.seo?.primary_kw || toolDef?.name?.toLowerCase();

  if (!focusKeyword) {
    if (slug.startsWith('formats/')) {
      const fmtId = slug.replace('formats/', '');
      focusKeyword = `${fmtId} file`;
    } else if (slug === 'formats') {
      focusKeyword = 'file formats';
    } else if (slug === '') {
      focusKeyword = 'free online file converters';
    } else if (slug === 'tools') {
      focusKeyword = 'online tools';
    } else if (slug === 'calculators') {
      focusKeyword = 'free online calculators';
    } else if (slug === 'privacy-explained') {
      focusKeyword = 'privacy explained';
    } else if (slug === 'contact') {
      focusKeyword = 'contact';
    } else if (slug === 'about') {
      focusKeyword = 'about';
    } else if (slug === 'terms') {
      focusKeyword = 'terms of service';
    } else if (slug === 'cookies') {
      focusKeyword = 'cookie policy';
    } else if (slug === 'privacy') {
      focusKeyword = 'privacy policy';
    } else {
      focusKeyword = slug.replace(/-/g, ' ');
    }
  }

  const report = runYoastAudit({
    url: siteConfig.url + urlPath,
    slug,
    title,
    metaDescription,
    focusKeyword,
    canonical,
    h1,
    headings,
    content: contentText,
    images,
    internalLinks,
    outboundLinks: [],
    jsonLdSchemas,
    isNoindex: false
  });

  const nonGoodChecks = report.checks.filter(c => c.status !== 'good');
  if (nonGoodChecks.length > 0) {
    issuesByPage.push({ urlPath, score: report.overallScore, wordCount: report.wordCount, checks: nonGoodChecks });
  }
}

console.log('TOTAL INDEXABLE WITH ISSUES: ' + issuesByPage.length);
const issueCounts = new Map<string, number>();
for (const p of issuesByPage) {
  for (const c of p.checks) {
    const key = `[${c.status.toUpperCase()}] ${c.title}`;
    issueCounts.set(key, (issueCounts.get(key) || 0) + 1);
  }
}

console.log('\n--- SUMMARY OF ALL ISSUES ACROSS PAGES ---');
for (const [k, count] of issueCounts.entries()) {
  console.log(`${k}: ${count} page(s)`);
}

console.log('\n--- DETAILED PAGES LIST ---');
for (const p of issuesByPage) {
  console.log(`\nURL: ${p.urlPath} (Score: ${p.score}, Words: ${p.wordCount})`);
  for (const c of p.checks) {
    console.log(`  ${c.status === 'bad' ? '🔴' : '🟡'} [${c.title}]: ${c.message}`);
  }
}
