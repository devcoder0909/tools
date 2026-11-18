import fs from 'node:fs';
import path from 'node:path';
import * as cheerio from 'cheerio';
import { getAllTools } from '../src/registry';
import { siteConfig } from '../src/config/site';
import { runYoastAudit, type SeoAuditInput, type SeoAuditReport } from '../src/utils/seo-engine';

const DIST_DIR = path.resolve(process.cwd(), 'dist');

function getAllHtmlFiles(dir: string): string[] {
  let results: string[] = [];
  if (!fs.existsSync(dir)) return results;
  const list = fs.readdirSync(dir);
  for (const file of list) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      results = results.concat(getAllHtmlFiles(fullPath));
    } else if (file.endsWith('.html')) {
      if (/^google[a-f0-9]+\.html$/i.test(file)) continue;
      results.push(fullPath);
    }
  }
  return results;
}

export function runFullYoastAudit() {
  console.log('\n======================================================');
  console.log('   🔍 RUNNING YOAST-STYLE COMPREHENSIVE SEO AUDIT   ');
  console.log('======================================================\n');

  const files = getAllHtmlFiles(DIST_DIR);
  if (files.length === 0) {
    console.error(`[ERROR] No HTML files found in ${DIST_DIR}. Please build first using "pnpm run build".`);
    process.exit(1);
  }

  const tools = getAllTools();
  const toolMap = new Map<string, any>();
  for (const t of tools) {
    toolMap.set(t.slug, t);
  }

  const reports: { urlPath: string; report: SeoAuditReport; isIndexable: boolean }[] = [];

  for (const filePath of files) {
    const rel = path.relative(DIST_DIR, filePath).replace(/\\/g, '/');
    const urlPath = '/' + (rel === 'index.html' ? '' : rel.replace(/index\.html$/, ''));
    const slug = urlPath.replace(/^\//, '').replace(/\/$/, '');

    const html = fs.readFileSync(filePath, 'utf-8');
    const $ = cheerio.load(html);

    const robotsMeta = $('meta[name="robots"]').attr('content') || '';
    const isNoindex = robotsMeta.includes('noindex');
    const isIndexable = !isNoindex;

    const title = $('title').text().trim();
    const metaDescription = $('meta[name="description"]').attr('content')?.trim() || '';
    const canonical = $('link[rel="canonical"]').attr('href') || '';
    const h1 = $('h1').first().text().trim();

    const headings: { level: number; text: string }[] = [];
    $('article h1, article h2, article h3, article h4, article h5, article h6').each((_, el) => {
      const tag = el.tagName.toLowerCase();
      const level = parseInt(tag.replace('h', ''), 10);
      headings.push({ level, text: $(el).text().trim() });
    });
    if (headings.length === 0) {
      $('main h1, main h2, main h3, main h4, main h5, main h6').each((_, el) => {
        const tag = el.tagName.toLowerCase();
        const level = parseInt(tag.replace('h', ''), 10);
        headings.push({ level, text: $(el).text().trim() });
      });
    }

    const contentEl = $('article').length > 0 ? $('article').clone() : $('main').length > 0 ? $('main').clone() : $('body').clone();
    contentEl.find('header, nav, footer, script, style, svg').remove();
    const contentText = contentEl.html() || contentEl.text();

    const images: { src: string; alt?: string }[] = [];
    $('img').each((_, el) => {
      images.push({
        src: $(el).attr('src') || '',
        alt: $(el).attr('alt'),
      });
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
        const parsed = JSON.parse($(el).html() || '{}');
        if (Array.isArray(parsed)) jsonLdSchemas.push(...parsed);
        else jsonLdSchemas.push(parsed);
      } catch {}
    });

    // Derive focus keyword
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

    const auditInput: SeoAuditInput = {
      url: `${siteConfig.url}${urlPath}`,
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
      isNoindex,
    };

    const auditReport = runYoastAudit(auditInput);
    reports.push({ urlPath, report: auditReport, isIndexable });
  }

  // Summary statistics
  const indexableReports = reports.filter((r) => r.isIndexable);
  const totalIndexable = indexableReports.length;
  let totalScoreSum = 0;
  let totalReadabilitySum = 0;
  let greenPages = 0;
  let yellowPages = 0;
  let redPages = 0;

  for (const { report } of indexableReports) {
    totalScoreSum += report.overallScore;
    totalReadabilitySum += report.readabilityScore;
    if (report.status === 'good') greenPages++;
    else if (report.status === 'ok') yellowPages++;
    else redPages++;
  }

  const avgScore = totalIndexable > 0 ? Math.round(totalScoreSum / totalIndexable) : 0;
  const avgReadability = totalIndexable > 0 ? Math.round(totalReadabilitySum / totalIndexable) : 0;

  console.log('------------------------------------------------------');
  console.log(`TOTAL AUDITED PAGES : ${reports.length} (${totalIndexable} Indexable, ${reports.length - totalIndexable} Noindex)`);
  console.log(`AVERAGE SEO SCORE   : ${avgScore} / 100`);
  console.log(`AVERAGE READABILITY : ${avgReadability} / 100 (Flesch Ease)`);
  console.log(`🟢 GREEN (Optimized): ${greenPages} pages (${Math.round((greenPages / totalIndexable) * 100)}%)`);
  console.log(`🟡 ORANGE (Good)    : ${yellowPages} pages (${Math.round((yellowPages / totalIndexable) * 100)}%)`);
  console.log(`🔴 RED (Needs Work) : ${redPages} pages (${Math.round((redPages / totalIndexable) * 100)}%)`);
  console.log('------------------------------------------------------\n');

  // Display any pages with Red issues
  const pagesWithErrors = indexableReports.filter((r) => r.report.badCount > 0);
  if (pagesWithErrors.length > 0) {
    console.log(`⚠️  ${pagesWithErrors.length} Page(s) have action items:\n`);
    for (const { urlPath, report } of pagesWithErrors.slice(0, 10)) {
      console.log(`[PAGE] ${urlPath} (Score: ${report.overallScore})`);
      for (const check of report.checks.filter((c) => c.status === 'bad')) {
        console.log(`  🔴 ${check.title}: ${check.message}`);
        if (check.howToFix) console.log(`     👉 How to fix: ${check.howToFix}`);
      }
      console.log('');
    }
  } else {
    console.log('🎉 100% of indexable pages passed all critical SEO quality checks with zero red errors!\n');
  }

  console.log('Auditing complete.\n');
}

if (process.argv[1] && process.argv[1].endsWith('yoast-seo-audit.ts')) {
  runFullYoastAudit();
}
