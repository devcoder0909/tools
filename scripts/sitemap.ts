import fs from 'node:fs';
import path from 'node:path';
import * as cheerio from 'cheerio';
import { getAllTools, getAllFormats } from '../src/registry';
import { siteConfig } from '../src/config/site';
import { TOOL_MEDIA_REGISTRY } from '../src/config/tool-media';

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
  return '';
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function isPublishedIndexable(loc: string): boolean {
  const url = new URL(loc);
  const file = path.join(DIST_DIR, url.pathname, 'index.html');
  if (!fs.existsSync(file)) throw new Error(`Missing built sitemap page: ${url.pathname}`);
  const $ = cheerio.load(fs.readFileSync(file, 'utf-8'));
  return !/noindex/i.test($('meta[name="robots"]').attr('content') || '')
    && $('link[rel="canonical"]').attr('href') === loc;
}

function generateUrlXml(loc: string, lastmod?: unknown, _changefreq?: string, _priority?: string) {
  if (!isPublishedIndexable(loc)) return '';
  const formattedDate = lastmod ? formatIsoDate(lastmod) : '';
  return `  <url>
    <loc>${escapeXml(loc)}</loc>${formattedDate ? `\n    <lastmod>${formattedDate}</lastmod>` : ''}
  </url>`;
}

// buildSitemaps exports
export function buildSitemaps() {
  ensureDist();

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
${staticPages.map((p) => generateUrlXml(p.url, undefined, 'weekly', p.priority)).join('\n')}
</urlset>`;
  fs.writeFileSync(path.join(DIST_DIR, 'sitemap-pages.xml'), pagesXml, 'utf-8');

  // 2. Formats Sitemap - ONLY reviewed & indexable hubs!
  const formats = getAllFormats().filter((f) => f.hub && f.indexable);
  const formatsXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${formats.map((f) => generateUrlXml(`${siteConfig.url}/formats/${f.id}/`, f.last_reviewed, 'monthly', '0.7')).join('\n')}
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

  // 4. Dedicated Google Image Sitemap (genuine architectural diagrams & workflow infographics)
  const imageEntriesXml = TOOL_MEDIA_REGISTRY
    .filter((m) => indexableTools.some((t) => t.slug === m.slug) && isPublishedIndexable(`${siteConfig.url}/${m.slug}/`) && fs.existsSync(path.join(DIST_DIR, m.diagramUrl)))
    .map((m) => {
    const pageUrl = `${siteConfig.url}/${m.slug}/`;
    const diagramUrl = `${siteConfig.url}${m.diagramUrl}`;

    return `  <url>
    <loc>${pageUrl}</loc>

    <image:image>
      <image:loc>${diagramUrl}</image:loc>
    </image:image>
  </url>`;
  }).join('\n');

  const imageSitemapXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${imageEntriesXml}
</urlset>`;
  fs.writeFileSync(path.join(DIST_DIR, 'sitemap-image.xml'), imageSitemapXml, 'utf-8');

  // 5. Sitemap Index (tools + formats + pages + image)
  const sitemapIndex = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <sitemap>
    <loc>${siteConfig.url}/sitemap-tools.xml</loc>

  </sitemap>
  <sitemap>
    <loc>${siteConfig.url}/sitemap-image.xml</loc>

  </sitemap>
  <sitemap>
    <loc>${siteConfig.url}/sitemap-pages.xml</loc>

  </sitemap>
  <sitemap>
    <loc>${siteConfig.url}/sitemap-formats.xml</loc>

  </sitemap>
</sitemapindex>`;
  fs.writeFileSync(path.join(DIST_DIR, 'sitemap-index.xml'), sitemapIndex, 'utf-8');
  // Also write sitemap.xml as direct alias for crawlers requesting /sitemap.xml
  fs.writeFileSync(path.join(DIST_DIR, 'sitemap.xml'), sitemapIndex, 'utf-8');

  console.log(`[Sitemap] Generated sitemap-index.xml, sitemap.xml, sitemap-image.xml (${TOOL_MEDIA_REGISTRY.length} images), and standard shards (${indexableTools.length} indexable tools listed).`);
}

// Execute when called directly
buildSitemaps();
