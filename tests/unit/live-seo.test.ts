import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { pageIssues, verifyRelease } from '../../scripts/verify-live-seo';

const canonical = 'https://zixtool.online/tools/example/';
const html = `<title>Example tool</title><meta name="description" content="A useful tool"><link rel="canonical" href="${canonical}"><h1>Example</h1>`;

describe('deployed SEO verification', () => {
  it('detects header and Googlebot indexing blocks, including none', () => {
    expect(pageIssues(html, canonical, new Headers())).toEqual([]);
    expect(pageIssues(html, canonical, new Headers({ 'x-robots-tag': 'googlebot: noindex' }))).toContain('Indexing blocked by robots directive');
    expect(pageIssues(html + '<meta name="googlebot" content="none">', canonical, new Headers())).toContain('Indexing blocked by robots directive');
  });

  it('rejects duplicate or wrong canonicals and missing page metadata', () => {
    expect(pageIssues(html + `<link rel="canonical" href="${canonical}">`, canonical, new Headers())).toContain('Canonical differs from expected URL');
    expect(pageIssues('<h1>Error</h1>', canonical, new Headers())).toEqual(expect.arrayContaining(['Missing title', 'Missing description', 'Canonical differs from expected URL']));
  });

  it('checks build pages even when the live sitemap omits them and separates network failures', async () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'zixtool-seo-'));
    try {
      fs.writeFileSync(path.join(dir, 'sitemap.xml'), `<urlset><url><loc>${canonical}</loc></url><url><loc>https://zixtool.online/offline/</loc></url></urlset>`);
      const request = (async (input: string | URL | Request) => {
        const url = String(input);
        if (url.endsWith('sitemap.xml')) return new Response('<urlset/>');
        if (url.endsWith('/offline/')) throw new Error('timeout');
        return new Response('', { status: 302, headers: { location: '/' } });
      }) as typeof fetch;
      const report = await verifyRelease(dir, 'https://zixtool.online', request);
      expect(report.checked).toBe(2);
      expect(report.issues).toEqual(expect.arrayContaining([
        expect.objectContaining({ message: 'Published sitemap locations differ from the build', kind: 'response' }),
        expect.objectContaining({ message: 'Expected HTTP 200, received 302', kind: 'response' }),
        expect.objectContaining({ message: 'Could not verify: timeout', kind: 'network' }),
      ]));
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });
});
