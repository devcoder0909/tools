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

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
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

// Rich Media & Video Definition Registry for Google Video and Image Sitemaps
interface ToolMediaDef {
  slug: string;
  name: string;
  title: string;
  description: string;
  durationSecs: number;
  thumbnailUrl: string;
  diagramUrl: string;
  diagramTitle: string;
  diagramCaption: string;
  tags: string[];
}

const TOOL_MEDIA_REGISTRY: ToolMediaDef[] = [
  {
    slug: 'png-to-jpg',
    name: 'PNG to JPG Converter',
    title: 'How to Convert PNG to JPG Online (Step-by-Step Tutorial)',
    description: 'Complete step-by-step video demonstration of converting PNG to JPG directly in your browser with zero server uploads and instant processing.',
    durationSecs: 75,
    thumbnailUrl: '/images/tools/png-to-jpg-video-thumb.svg',
    diagramUrl: '/images/tools/png-to-jpg-workflow.svg',
    diagramTitle: 'PNG to JPG Client-Side Architecture Diagram',
    diagramCaption: 'In-browser HTML5 Canvas rasterization pipeline with zero cloud uploads.',
    tags: ['png to jpg', 'image converter', 'client-side conversion', 'transparency handling'],
  },
  {
    slug: 'jpg-to-png',
    name: 'JPG to PNG Converter',
    title: 'How to Convert JPG to PNG Online (Step-by-Step Tutorial)',
    description: 'Complete step-by-step video demonstration of converting JPG to lossless PNG format in your local browser RAM.',
    durationSecs: 70,
    thumbnailUrl: '/images/tools/jpg-to-png-video-thumb.svg',
    diagramUrl: '/images/tools/jpg-to-png-workflow.svg',
    diagramTitle: 'JPG to PNG Client-Side Workflow Diagram',
    diagramCaption: 'Decoding DCT compressed JPEG into lossless 24-bit RGB pixel canvas.',
    tags: ['jpg to png', 'jpeg converter', 'lossless png', 'rasterization'],
  },
  {
    slug: 'webp-to-jpg',
    name: 'WebP to JPG Converter',
    title: 'How to Convert WebP to JPG Online (Step-by-Step Tutorial)',
    description: 'Learn how to convert modern Google WebP graphics into universal JPG images with instant browser transcoding.',
    durationSecs: 68,
    thumbnailUrl: '/images/tools/webp-to-jpg-video-thumb.svg',
    diagramUrl: '/images/tools/webp-to-jpg-workflow.svg',
    diagramTitle: 'WebP to JPG In-Browser Transcoding Pipeline',
    diagramCaption: 'Hardware-accelerated WebP unpack and JPEG quantizer with white alpha background.',
    tags: ['webp to jpg', 'webp converter', 'google webp', 'jpeg encoding'],
  },
  {
    slug: 'heic-to-jpg',
    name: 'HEIC to JPG Converter',
    title: 'How to Convert iPhone HEIC to JPG Online (Step-by-Step Tutorial)',
    description: 'Step-by-step tutorial converting Apple iPhone HEIC and HEIF photos to high quality JPGs using client-side libheif WASM.',
    durationSecs: 80,
    thumbnailUrl: '/images/tools/heic-to-jpg-video-thumb.svg',
    diagramUrl: '/images/tools/heic-to-jpg-workflow.svg',
    diagramTitle: 'HEIC to JPG WASM Decoding Architecture',
    diagramCaption: 'Local WebAssembly HEVC extraction with original 48MP color accuracy preserved.',
    tags: ['heic to jpg', 'iphone photos', 'apple heic', 'heif to jpeg'],
  },
  {
    slug: 'merge-pdf',
    name: 'Merge PDF Online',
    title: 'How to Merge PDF Documents Online (Step-by-Step Tutorial)',
    description: 'Complete walkthrough showing how to combine and merge multiple PDF files into one unified document with pdf-lib in browser RAM.',
    durationSecs: 78,
    thumbnailUrl: '/images/tools/merge-pdf-video-thumb.svg',
    diagramUrl: '/images/tools/merge-pdf-workflow.svg',
    diagramTitle: 'Client-Side PDF Document Assembly Matrix',
    diagramCaption: 'Stitching page trees, fonts, vectors, and hyperlinks in client memory with zero server uploads.',
    tags: ['merge pdf', 'combine pdf', 'pdf joiner', 'pdf-lib'],
  },
  {
    slug: 'compress-pdf',
    name: 'Compress PDF Online',
    title: 'How to Compress PDF Files Online (Step-by-Step Tutorial)',
    description: 'Video demonstration shrinking heavy PDF documents below 200KB or 1MB for portal submission while preserving typography.',
    durationSecs: 85,
    thumbnailUrl: '/images/tools/compress-pdf-video-thumb.svg',
    diagramUrl: '/images/tools/compress-pdf-workflow.svg',
    diagramTitle: 'In-Memory PDF Stream and Image Optimization Flow',
    diagramCaption: 'Purging redundant metadata streams and resampling embedded raster images in client RAM.',
    tags: ['compress pdf', 'reduce pdf size', 'shrink pdf', 'pdf optimizer'],
  },
  {
    slug: 'split-pdf',
    name: 'Split PDF Online',
    title: 'How to Split PDF Pages Online (Step-by-Step Tutorial)',
    description: 'Tutorial showing how to separate, split, and extract specific page ranges from multi-page PDF documents.',
    durationSecs: 72,
    thumbnailUrl: '/images/tools/split-pdf-video-thumb.svg',
    diagramUrl: '/images/tools/split-pdf-workflow.svg',
    diagramTitle: 'PDF Page Tree Disassembly & Extraction Pipeline',
    diagramCaption: 'Extracting discrete page subsets into clean independent PDF files with original vectors intact.',
    tags: ['split pdf', 'extract pdf pages', 'separate pdf', 'pdf splitter'],
  },
  {
    slug: 'rotate-pdf',
    name: 'Rotate PDF Online',
    title: 'How to Permanently Rotate PDF Pages Online (Step-by-Step Tutorial)',
    description: 'Walkthrough fixing sideways or upside-down PDF scans with permanent 90, 180, and 270 degree clockwise orientation adjustments.',
    durationSecs: 65,
    thumbnailUrl: '/images/tools/rotate-pdf-video-thumb.svg',
    diagramUrl: '/images/tools/rotate-pdf-workflow.svg',
    diagramTitle: 'PDF Coordinate Matrix Rotation Architecture',
    diagramCaption: 'Modifying the /Rotate dictionary key permanently without degrading vector sharpness.',
    tags: ['rotate pdf', 'fix sideways pdf', 'turn pdf pages', 'pdf orientation'],
  },
  {
    slug: 'emi-calculator',
    name: 'EMI Calculator',
    title: 'How to Calculate Loan EMI & Reducing Balance Interest (Step-by-Step Tutorial)',
    description: 'Complete video tutorial demonstrating loan amortization, reducing balance calculations, and monthly payment schedules.',
    durationSecs: 84,
    thumbnailUrl: '/images/tools/emi-calculator-video-thumb.svg',
    diagramUrl: '/images/tools/emi-calculator-infographic.svg',
    diagramTitle: 'Loan Amortization Matrix and Reducing Balance Infographic',
    diagramCaption: 'Visualizing principal vs interest split across repayment cycles.',
    tags: ['emi calculator', 'loan calculator', 'mortgage calculator', 'amortization schedule'],
  },
  {
    slug: 'compound-interest-calculator',
    name: 'Compound Interest Calculator',
    title: 'How to Calculate Compound Interest & Future Value (Step-by-Step Tutorial)',
    description: 'Learn how exponential compounding frequency accelerates long-term investment wealth accumulation.',
    durationSecs: 90,
    thumbnailUrl: '/images/tools/compound-interest-video-thumb.svg',
    diagramUrl: '/images/tools/compound-interest-growth.svg',
    diagramTitle: 'Compound Interest Growth & Hockey-Stick Wealth Curve',
    diagramCaption: 'Exponential future value accumulation across daily, monthly, and annual compounding frequencies.',
    tags: ['compound interest calculator', 'future value', 'compounding frequency', 'wealth multiplier'],
  },
  {
    slug: 'sip-calculator',
    name: 'SIP Calculator',
    title: 'How SIP Compounding Builds Long-Term Wealth (Step-by-Step Tutorial)',
    description: 'Video demonstration of Systematic Investment Plan (SIP) returns, rupee cost averaging, and corpus growth milestones.',
    durationSecs: 75,
    thumbnailUrl: '/images/tools/sip-calculator-video-thumb.svg',
    diagramUrl: '/images/tools/sip-compounding-wealth.svg',
    diagramTitle: 'Systematic Investment Plan (SIP) Compounding Wealth Multiplier',
    diagramCaption: 'Monthly SIP investment accumulation milestones across 10, 15, and 20 year horizons.',
    tags: ['sip calculator', 'mutual fund returns', 'rupee cost averaging', 'wealth compounding'],
  },
  {
    slug: 'percentage-calculator',
    name: 'Percentage Calculator',
    title: 'How to Calculate Percentages & % Change Fast (Step-by-Step Tutorial)',
    description: 'Instant mathematical tutorial explaining percentage of numbers, percentage change, and proportions with formulas.',
    durationSecs: 65,
    thumbnailUrl: '/images/tools/percentage-calculator-video-thumb.svg',
    diagramUrl: '/images/tools/percentage-calculator-formulas.svg',
    diagramTitle: 'Comprehensive Percentage Mathematics & Formula Matrix',
    diagramCaption: 'Visual reference guide covering what is X% of Y, X is what % of Y, and percentage change.',
    tags: ['percentage calculator', 'percent change', 'math calculator', 'discount formula'],
  },
  {
    slug: 'json-formatter',
    name: 'JSON Formatter & Validator',
    title: 'How to Format, Validate, & Beautify JSON Payloads (Step-by-Step Tutorial)',
    description: 'Video demonstration validating RFC 8259 JSON syntax, fixing formatting errors, and minifying payloads locally.',
    durationSecs: 72,
    thumbnailUrl: '/images/tools/json-formatter-video-thumb.svg',
    diagramUrl: '/images/tools/json-formatter-structure.svg',
    diagramTitle: 'RFC 8259 JSON Syntax Tree & Node Hierarchy Diagram',
    diagramCaption: 'Client-side AST parser validation with error detection and 2-space indentation.',
    tags: ['json formatter', 'beautify json', 'json validator', 'json parser'],
  },
  {
    slug: 'base64-encoder',
    name: 'Base64 Encoder & Decoder',
    title: 'How to Encode & Decode Base64 Data Streams (Step-by-Step Tutorial)',
    description: 'Step-by-step tutorial explaining 6-bit Radix-64 encoding, ASCII 8-bit octet splitting, and padding characters.',
    durationSecs: 68,
    thumbnailUrl: '/images/tools/base64-encoder-video-thumb.svg',
    diagramUrl: '/images/tools/base64-encoding-matrix.svg',
    diagramTitle: 'RFC 4648 Base64 6-Bit Encoding Architecture Matrix',
    diagramCaption: 'Translating 8-bit ASCII bytes into 6-bit Radix-64 index chunks with zero server transfers.',
    tags: ['base64 encoder', 'base64 decoder', 'radix 64', 'base64 translation'],
  },
  {
    slug: 'qr-code-generator',
    name: 'QR Code Generator',
    title: 'How to Generate High-Resolution QR Codes with Error Correction (Step-by-Step Tutorial)',
    description: 'Video demonstration generating custom QR codes with Reed-Solomon error correction for URLs, Wi-Fi, and text.',
    durationSecs: 70,
    thumbnailUrl: '/images/tools/qr-code-generator-video-thumb.svg',
    diagramUrl: '/images/tools/qr-code-anatomy-infographic.svg',
    diagramTitle: 'ISO/IEC 18004 QR Code Matrix Anatomy Infographic',
    diagramCaption: 'Finder patterns, timing tracks, alignment markers, and Reed-Solomon data blocks.',
    tags: ['qr code generator', 'reed solomon', 'qr code matrix', 'permanent qr code'],
  },
  {
    slug: 'password-generator',
    name: 'Password Generator',
    title: 'How to Generate Cryptographically Secure Passwords (Step-by-Step Tutorial)',
    description: 'Video tutorial generating cryptographically strong passwords using crypto.getRandomValues and Shannon entropy analysis.',
    durationSecs: 64,
    thumbnailUrl: '/images/tools/password-generator-video-thumb.svg',
    diagramUrl: '/images/tools/password-entropy-infographic.svg',
    diagramTitle: 'Cryptographic Entropy & Brute-Force Crack Time Matrix',
    diagramCaption: 'Logarithmic entropy calculation and NIST SP 800-63B password complexity standards.',
    tags: ['password generator', 'password entropy', 'cryptographic security', 'shannon entropy'],
  },
  {
    slug: 'photo-compressor',
    name: 'Photo Compressor',
    title: 'How to Compress & Reduce Photo Size Online (Step-by-Step Tutorial)',
    description: 'Video tutorial demonstrating client-side photo compression to exact target sizes like 20KB, 50KB, or 100KB with zero quality drop.',
    durationSecs: 70,
    thumbnailUrl: '/images/tools/photo-compressor-workflow.svg',
    diagramUrl: '/images/tools/photo-compressor-workflow.svg',
    diagramTitle: 'Client-Side In-Browser Photo Compression Pipeline',
    diagramCaption: 'Dynamic binary search quantization enforcing strict byte budget limits in browser RAM.',
    tags: ['photo compressor', 'reduce photo size', 'compress photo to 50kb', 'photo size reducer'],
  },
  {
    slug: 'jpg-compressor',
    name: 'JPG Compressor',
    title: 'How to Compress JPG Images Without Losing Quality (Step-by-Step Tutorial)',
    description: 'Learn how DCT frequency quantization compresses JPG files up to 85% directly on your device with zero server uploads.',
    durationSecs: 74,
    thumbnailUrl: '/images/tools/jpg-compressor-workflow.svg',
    diagramUrl: '/images/tools/jpg-compressor-workflow.svg',
    diagramTitle: 'JPG DCT Matrix Quantization and Compression Architecture',
    diagramCaption: 'YCbCr 4:2:0 chroma subsampling and Huffman entropy coding executed locally in browser RAM.',
    tags: ['jpg compressor', 'compress jpg', 'reduce jpg file size', 'jpeg optimizer'],
  },
  {
    slug: 'passport-photo-resizer',
    name: 'Passport Photo Resizer',
    title: 'How to Resize & Compress Passport Photos for Official Portals (Step-by-Step Tutorial)',
    description: 'Demonstration of resizing portrait photos to 3.5cm x 4.5cm and clamping file size below 20KB/50KB for TNPSC, SSC, UPSC, and passport applications.',
    durationSecs: 82,
    thumbnailUrl: '/images/tools/passport-photo-workflow.svg',
    diagramUrl: '/images/tools/passport-photo-workflow.svg',
    diagramTitle: 'Government & Exam Portal Passport Photo Resizing Matrix',
    diagramCaption: 'Millimeter-accurate cropping and target KB clamping with zero portal upload rejections.',
    tags: ['passport photo resizer', 'passport size photo compressor', 'tnpsc photo compressor', 'signature compressor'],
  },
  {
    slug: 'jpeg-to-jpg',
    name: 'JPEG to JPG Converter',
    title: 'How to Convert JPEG to JPG Instantly Online (Step-by-Step Tutorial)',
    description: 'Learn why JPEG and JPG are functionally identical and how to standardize extensions instantly without generational quality loss.',
    durationSecs: 60,
    thumbnailUrl: '/images/tools/jpeg-to-jpg-workflow.svg',
    diagramUrl: '/images/tools/jpeg-to-jpg-workflow.svg',
    diagramTitle: 'ISO 10918-1 JPEG to JPG Normalization Architecture',
    diagramCaption: 'Lossless binary marker validation and extension standardization in client browser RAM.',
    tags: ['jpeg to jpg', 'jpeg to jpg converter', 'convert jpeg to jpg', 'jfif normalizer'],
  },
  {
    slug: 'pdf-to-jpg',
    name: 'PDF to JPG Converter',
    title: 'How to Convert PDF to High Quality JPG Images (Step-by-Step Tutorial)',
    description: 'Walkthrough converting multi-page PDF documents to crystal-clear JPG images in browser memory with zero server uploads.',
    durationSecs: 76,
    thumbnailUrl: '/images/tools/pdf-to-jpg-workflow.svg',
    diagramUrl: '/images/tools/pdf-to-jpg-workflow.svg',
    diagramTitle: 'PDF.js High-DPI Canvas Page Rasterization Pipeline',
    diagramCaption: 'Traversing PDF page trees and rendering vectors and typography to high-resolution JPEG images locally.',
    tags: ['pdf to jpg', 'pdf to jpg converter', 'extract images from pdf', 'client-side pdf to jpg'],
  },
];

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

  // 4. Dedicated Google Image Sitemap (genuine architectural diagrams & workflow infographics)
  const imageEntriesXml = TOOL_MEDIA_REGISTRY
    .filter((m) => indexableTools.some((t) => t.slug === m.slug))
    .map((m) => {
    const pageUrl = `${siteConfig.url}/${m.slug}/`;
    const diagramUrl = `${siteConfig.url}${m.diagramUrl}`;

    return `  <url>
    <loc>${pageUrl}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>
    <image:image>
      <image:loc>${diagramUrl}</image:loc>
      <image:title>${escapeXml(m.diagramTitle)}</image:title>
      <image:caption>${escapeXml(m.diagramCaption)}</image:caption>
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
    <lastmod>${today}</lastmod>
  </sitemap>
  <sitemap>
    <loc>${siteConfig.url}/sitemap-image.xml</loc>
    <lastmod>${today}</lastmod>
  </sitemap>
  <sitemap>
    <loc>${siteConfig.url}/sitemap-pages.xml</loc>
    <lastmod>${today}</lastmod>
  </sitemap>
  <sitemap>
    <loc>${siteConfig.url}/sitemap-formats.xml</loc>
    <lastmod>${today}</lastmod>
  </sitemap>
</sitemapindex>`;
  fs.writeFileSync(path.join(DIST_DIR, 'sitemap-index.xml'), sitemapIndex, 'utf-8');
  // Also write sitemap.xml as direct alias for crawlers requesting /sitemap.xml
  fs.writeFileSync(path.join(DIST_DIR, 'sitemap.xml'), sitemapIndex, 'utf-8');

  console.log(`[Sitemap] Generated sitemap-index.xml, sitemap.xml, sitemap-image.xml (${TOOL_MEDIA_REGISTRY.length} images), and standard shards (${indexableTools.length} indexable tools listed).`);
}

// Execute when called directly
buildSitemaps();
