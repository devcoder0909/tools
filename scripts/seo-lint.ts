import fs from 'node:fs';
import path from 'node:path';
import * as cheerio from 'cheerio';
import { getAllTools, getAllFormats } from '../src/registry';
import { siteConfig } from '../src/config/site';

const DIST_DIR = path.resolve(process.cwd(), 'dist');

interface PageAudit {
  filePath: string;
  urlPath: string;
  isIndexable: boolean;
  title: string;
  description: string;
  h1Count: number;
  h1Text: string;
  canonical: string;
  wordCount: number;
  outboundInternalLinks: string[];
  jsonLdValid: boolean;
  errors: string[];
  textContent: string;
}

// Compute 4-gram shingles for similarity comparison
function getShingles(text: string, k: number = 4): Set<string> {
  const words = text.toLowerCase().replace(/[^a-z0-9\s]/g, '').split(/\s+/).filter(Boolean);
  const shingles = new Set<string>();
  for (let i = 0; i <= words.length - k; i++) {
    shingles.add(words.slice(i, i + k).join(' '));
  }
  return shingles;
}

function calculateJaccardSimilarity(setA: Set<string>, setB: Set<string>): number {
  if (setA.size === 0 || setB.size === 0) return 0;
  let intersection = 0;
  for (const item of setA) {
    if (setB.has(item)) intersection++;
  }
  const union = setA.size + setB.size - intersection;
  return union === 0 ? 0 : intersection / union;
}

function getAllHtmlFiles(dir: string, baseDir: string = dir): string[] {
  let results: string[] = [];
  if (!fs.existsSync(dir)) return results;
  const list = fs.readdirSync(dir);
  for (const file of list) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      results = results.concat(getAllHtmlFiles(fullPath, baseDir));
    } else if (file.endsWith('.html')) {
      // Skip search engine verification files (e.g. googlefc307c410c314053.html)
      if (/^google[a-f0-9]+\.html$/i.test(file)) {
        continue;
      }
      results.push(fullPath);
    }
  }
  return results;
}

export function runSeoLint() {
  console.log('\n--- [SEO-LINT] Running Build-Time SEO & Quality Gates ---');
  let hasFailed = false;

  // 1. Content Scaffolding Check
  const contentDir = path.resolve(process.cwd(), 'src/content');
  if (fs.existsSync(contentDir)) {
    const checkPlaceholders = (dir: string) => {
      const files = fs.readdirSync(dir);
      for (const file of files) {
        const full = path.join(dir, file);
        if (fs.statSync(full).isDirectory()) checkPlaceholders(full);
        else if (file.endsWith('.md') || file.endsWith('.mdx')) {
          const content = fs.readFileSync(full, 'utf-8');
          if (content.includes('CONTENT_PLACEHOLDER') || content.includes('[CONTENT_PLACEHOLDER')) {
            console.error(`[FAIL] Placeholder content found in ${full}`);
            hasFailed = true;
          }
        }
      }
    };
    checkPlaceholders(contentDir);
  }

  // 2. Parse HTML files
  const htmlFiles = getAllHtmlFiles(DIST_DIR);
  if (htmlFiles.length === 0) {
    console.error(`[FAIL] No HTML files found in ${DIST_DIR}. Did the build run?`);
    process.exit(1);
  }

  const audits: PageAudit[] = [];
  const titles = new Map<string, string>();
  const descriptions = new Map<string, string>();
  const h1Map = new Map<string, string>();
  const inboundLinkCount = new Map<string, number>();

  for (const filePath of htmlFiles) {
    const relativePath = path.relative(DIST_DIR, filePath).replace(/\\/g, '/');
    const urlPath = '/' + (relativePath === 'index.html' ? '' : relativePath.replace(/index\.html$/, ''));
    const html = fs.readFileSync(filePath, 'utf-8');
    const $ = cheerio.load(html);
    const errors: string[] = [];

    // Robots meta check
    const robotsMeta = $('meta[name="robots"]').attr('content') || '';
    const isNoindex = robotsMeta.includes('noindex');
    const isIndexable = !isNoindex;

    // Check for forbidden internal draft text across all pages
    const bodyVisibleText = $('body').text();
    if (bodyVisibleText.includes('Draft content pending human review')) {
      errors.push('Forbidden visible internal text found: "Draft content pending human review"');
    }
    if (bodyVisibleText.includes('Status: Draft') || bodyVisibleText.includes('Status: Reviewed')) {
      errors.push('Forbidden visible internal status text found in body HTML');
    }

    const title = $('title').text().trim();
    const description = $('meta[name="description"]').attr('content')?.trim() || '';
    const h1Elements = $('h1');
    const h1Count = h1Elements.length;
    const h1Text = h1Elements.first().text().trim();
    const canonical = $('link[rel="canonical"]').attr('href') || '';

    // Article/Main Word Count
    const articleText = $('article, main').text().replace(/\s+/g, ' ').trim();
    const words = articleText ? articleText.split(' ').filter(Boolean) : [];
    const wordCount = words.length;

    // Outbound internal links
    const outboundLinks: string[] = [];
    $('a[href]').each((_, el) => {
      const href = $(el).attr('href') || '';
      if (href.startsWith('/') || href.startsWith(siteConfig.url)) {
        const cleanHref = href.replace(siteConfig.url, '').split('#')[0].split('?')[0];
        if (cleanHref && !cleanHref.startsWith('/embed/') && !cleanHref.startsWith('/_')) {
          outboundLinks.push(cleanHref.endsWith('/') ? cleanHref : cleanHref + '/');
        }
      }
    });

    // Check JSON-LD validity
    let jsonLdValid = true;
    $('script[type="application/ld+json"]').each((_, el) => {
      try {
        const jsonText = $(el).html() || '{}';
        JSON.parse(jsonText);
      } catch (e) {
        jsonLdValid = false;
        errors.push('Invalid JSON-LD syntax');
      }
    });

    // Images alt check
    $('img').each((_, el) => {
      const alt = $(el).attr('alt');
      if (alt === undefined || alt === null) {
        errors.push(`Image missing alt attribute: ${$(el).attr('src')}`);
      }
    });

    // Disallowed scripts check
    $('script[src]').each((_, el) => {
      const src = $(el).attr('src') || '';
      const isAllowed =
        src.startsWith('/') ||
        src.includes('pagead2.googlesyndication.com') ||
        src.includes('google.com') ||
        src.includes('cloudflareinsights.com');
      if (!isAllowed) {
        errors.push(`Disallowed third-party script: ${src}`);
      }
    });

    // Size check: HTML <= 95KB (or 110KB for 100+ item master directories / root hub)
    const isMasterCatalog = urlPath === '/tools/' || urlPath === '/';
    const maxBudget = isMasterCatalog ? 110 * 1024 : 95 * 1024;
    const stats = fs.statSync(filePath);
    if (stats.size > maxBudget) {
      errors.push(`HTML size (${(stats.size / 1024).toFixed(1)}KB) exceeds budget of ${(maxBudget / 1024).toFixed(0)}KB`);
    }

    // Indexable rules
    if (isIndexable) {
      if (title.length < 30 || title.length > 60) {
        errors.push(`Title length (${title.length}) outside 30-60 target: "${title}"`);
      }
      if (description.length < 115 || description.length > 165) {
        errors.push(`Meta description length (${description.length}) outside 120-160: "${description}"`);
      }
      if (h1Count !== 1) {
        errors.push(`Expected exactly 1 H1 tag, found ${h1Count}`);
      }
      if (!canonical || !canonical.startsWith(siteConfig.url)) {
        errors.push(`Missing or invalid canonical URL: "${canonical}"`);
      }
      if (outboundLinks.length < 5) {
        errors.push(`Fewer than 5 outbound internal links (found ${outboundLinks.length})`);
      }
      // Tool and hub pages require at least 250 words
      if (urlPath !== '/' && !urlPath.startsWith('/privacy') && !urlPath.startsWith('/cookies') && !urlPath.startsWith('/terms') && !urlPath.startsWith('/contact') && wordCount < 250) {
        errors.push(`Word count (${wordCount}) is below the SEO minimum`);
      }

      // Check duplicates
      if (titles.has(title)) {
        errors.push(`Duplicate title matches ${titles.get(title)}: "${title}"`);
      } else {
        titles.set(title, urlPath);
      }

      if (descriptions.has(description)) {
        errors.push(`Duplicate meta description matches ${descriptions.get(description)}`);
      } else {
        descriptions.set(description, urlPath);
      }

      if (h1Map.has(h1Text)) {
        errors.push(`Duplicate H1 matches ${h1Map.get(h1Text)}: "${h1Text}"`);
      } else {
        h1Map.set(h1Text, urlPath);
      }
    }

    audits.push({
      filePath,
      urlPath,
      isIndexable,
      title,
      description,
      h1Count,
      h1Text,
      canonical,
      wordCount,
      outboundInternalLinks: outboundLinks,
      jsonLdValid,
      errors,
      textContent: articleText,
    });

    // Record outbound links for inbound graph
    for (const targetUrl of outboundLinks) {
      inboundLinkCount.set(targetUrl, (inboundLinkCount.get(targetUrl) || 0) + 1);
    }
  }

  // 3. Inbound internal links check & Broken Link Detection
  const validBuiltPaths = new Set<string>(audits.map((a) => a.urlPath));
  // Add valid redirects from _redirects
  const redirectsPath = path.resolve(process.cwd(), 'public/_redirects');
  if (fs.existsSync(redirectsPath)) {
    const lines = fs.readFileSync(redirectsPath, 'utf-8').split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const parts = trimmed.split(/\s+/);
      if (parts[0] && parts[0].startsWith('/')) {
        validBuiltPaths.add(parts[0].endsWith('/') ? parts[0] : parts[0] + '/');
      }
    }
  }

  // Broken internal link validation
  for (const page of audits) {
    for (const targetUrl of page.outboundInternalLinks) {
      if (!validBuiltPaths.has(targetUrl)) {
        page.errors.push(`Broken internal link target: "${targetUrl}"`);
      }
    }
  }

  for (const page of audits.filter((a) => a.isIndexable && a.urlPath !== '/')) {
    const inbound = inboundLinkCount.get(page.urlPath) || 0;
    if (inbound < 3) {
      page.errors.push(`Fewer than 3 inbound internal links (found ${inbound}). Potential orphan.`);
    }
  }

  // 4. Shingle similarity check among editorial & converter pages
  const indexablePages = audits.filter(
    (a) =>
      a.isIndexable &&
      a.wordCount > 150
  );
  for (let i = 0; i < indexablePages.length; i++) {
    for (let j = i + 1; j < indexablePages.length; j++) {
      const p1 = indexablePages[i];
      const p2 = indexablePages[j];
      const shingle1 = getShingles(p1.textContent);
      const shingle2 = getShingles(p2.textContent);
      const similarity = calculateJaccardSimilarity(shingle1, shingle2);
      if (similarity >= 0.55) {
        const pct = (similarity * 100).toFixed(1);
        p1.errors.push(`Content similarity with ${p2.urlPath} is ${pct}% (ceiling: 55%)`);
      }
    }
  }

  // 5. Sitemap & Registry Cross-Check
  const sitemapToolsPath = path.join(DIST_DIR, 'sitemap-tools.xml');
  if (fs.existsSync(sitemapToolsPath)) {
    const sitemapContent = fs.readFileSync(sitemapToolsPath, 'utf-8');
    const tools = getAllTools();
    for (const tool of tools) {
      const url = `${siteConfig.url}/${tool.slug}/`;
      const inSitemap = sitemapContent.includes(url);
      if (inSitemap && (!tool.reviewed || !tool.last_reviewed || !tool.indexable)) {
        console.error(`[FAIL] Unreviewed or non-indexable tool in sitemap: ${tool.slug}`);
        hasFailed = true;
      }
      if (!inSitemap && tool.reviewed && tool.last_reviewed && tool.indexable) {
        console.error(`[FAIL] Reviewed indexable tool missing from sitemap: ${tool.slug}`);
        hasFailed = true;
      }
    }
  }

  const sitemapFormatsPath = path.join(DIST_DIR, 'sitemap-formats.xml');
  if (fs.existsSync(sitemapFormatsPath)) {
    const sitemapContent = fs.readFileSync(sitemapFormatsPath, 'utf-8');
    const formats = getAllFormats();
    for (const fmt of formats) {
      const url = `${siteConfig.url}/formats/${fmt.id}/`;
      const inSitemap = sitemapContent.includes(url);
      if (inSitemap && (!fmt.indexable || !fmt.hub)) {
        console.error(`[FAIL] Unreviewed or non-indexable format in sitemap: ${fmt.id}`);
        hasFailed = true;
      }
      if (!inSitemap && fmt.indexable && fmt.hub) {
        console.error(`[FAIL] Reviewed indexable format missing from sitemap: ${fmt.id}`);
        hasFailed = true;
      }
    }
  }

  // 6. Aggregate results
  let totalErrors = 0;
  for (const page of audits) {
    if (page.errors.length > 0) {
      console.error(`\n[PAGE ISSUE] ${page.urlPath} (${page.isIndexable ? 'Indexable' : 'Noindex'}):`);
      for (const err of page.errors) {
        console.error(`  - ${err}`);
      }
      totalErrors += page.errors.length;
    }
  }

  console.log(`\nAudited ${audits.length} pages (${audits.filter((a) => a.isIndexable).length} indexable).`);

  if (totalErrors > 0 || hasFailed) {
    console.error(`\n[SEO-LINT FAILED] Found ${totalErrors} issue(s) violating hard gates.\n`);
    process.exit(1);
  } else {
    console.log(`[SEO-LINT PASSED] All indexable pages passed SEO, canonical, link graph, and content gates.\n`);
  }
}

runSeoLint();
