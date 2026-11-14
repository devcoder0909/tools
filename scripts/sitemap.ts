import fs from 'node:fs';
import path from 'node:path';
import { getAllTools, getAllFormats } from '../src/registry';
import { siteConfig } from '../src/config/site';

const DIST_DIR = path.resolve(process.cwd(), 'dist');

function ensureDist() {
  if (!fs.existsSync(DIST_DIR)) {
    fs.mkdirSync(DIST_DIR, { recursive: true });
  }
}

function formatIsoDate(dateVal: any): string {
  try {
    const d = new Date(dateVal);
    if (!isNaN(d.getTime())) {
      return d.toISOString().split('T')[0];
    }
  } catch {}
  return new Date().toISOString().split('T')[0];
}

function generateUrlXml(loc: string, lastmod: any, changefreq: string = 'weekly', priority: string = '0.8') {
  const formattedDate = formatIsoDate(lastmod);
  return `  <url>
    <loc>${loc}</loc>
    <lastmod>${formattedDate}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>`;
}

export function buildSitemaps() {
  ensureDist();
  const today = new Date().toISOString().split('T')[0];

  // 1. Static Pages Sitemap
  const staticPages = [
    { url: `${siteConfig.url}/`, priority: '1.0' },
    { url: `${siteConfig.url}/tools/`, priority: '0.9' },
    { url: `${siteConfig.url}/calculators/`, priority: '0.9' },
    { url: `${siteConfig.url}/formats/`, priority: '0.8' },
    { url: `${siteConfig.url}/privacy-explained/`, priority: '0.7' },
    { url: `${siteConfig.url}/about/`, priority: '0.5' },
    { url: `${siteConfig.url}/privacy/`, priority: '0.3' },
    { url: `${siteConfig.url}/cookies/`, priority: '0.3' },
    { url: `${siteConfig.url}/terms/`, priority: '0.3' },
    { url: `${siteConfig.url}/contact/`, priority: '0.5' },
  ];

  const pagesXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${staticPages.map((p) => generateUrlXml(p.url, today, 'weekly', p.priority)).join('\n')}
</urlset>`;
  fs.writeFileSync(path.join(DIST_DIR, 'sitemap-pages.xml'), pagesXml, 'utf-8');

  // 2. Formats Sitemap - ONLY reviewed & indexable hubs!
  const formats = getAllFormats().filter((f) => f.hub && f.indexable);
  const formatsXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${formats.map((f) => generateUrlXml(`${siteConfig.url}/formats/${f.id}/`, f.last_reviewed || today, 'monthly', '0.7')).join('\n')}
</urlset>`;
  fs.writeFileSync(path.join(DIST_DIR, 'sitemap-formats.xml'), formatsXml, 'utf-8');

  // 3. Tools Sitemap - ONLY reviewed & indexable tools!
  const tools = getAllTools();
  const indexableTools = tools.filter((t) => t.indexable && t.reviewed && t.last_reviewed);
  const toolsXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${indexableTools.map((t) => generateUrlXml(`${siteConfig.url}/${t.slug}/`, t.last_reviewed, 'weekly', '0.9')).join('\n')}
</urlset>`;
  fs.writeFileSync(path.join(DIST_DIR, 'sitemap-tools.xml'), toolsXml, 'utf-8');

  // 4. Sitemap Index
  const sitemapIndex = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <sitemap>
    <loc>${siteConfig.url}/sitemap-pages.xml</loc>
    <lastmod>${today}</lastmod>
  </sitemap>
  <sitemap>
    <loc>${siteConfig.url}/sitemap-formats.xml</loc>
    <lastmod>${today}</lastmod>
  </sitemap>
  <sitemap>
    <loc>${siteConfig.url}/sitemap-tools.xml</loc>
    <lastmod>${today}</lastmod>
  </sitemap>
</sitemapindex>`;
  fs.writeFileSync(path.join(DIST_DIR, 'sitemap-index.xml'), sitemapIndex, 'utf-8');

  console.log(`[Sitemap] Generated sitemap index and 3 shards (${indexableTools.length} indexable tools listed).`);
}

// Execute when called directly
buildSitemaps();
