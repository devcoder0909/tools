import { describe, expect, it, vi } from 'vitest';
import worker from '../../src/worker';
import { getAllTools, getRelatedTools, getToolsForFormat } from '../../src/registry';
import { searchGuides } from '../../src/content/guides';
import wrangler from '../../wrangler.json';

describe('search architecture', () => {
  it('recommends only reviewed and indexable tools from format guides', () => {
    const pdfTools = getToolsForFormat('pdf');
    expect(pdfTools.some(tool => tool.slug === 'pdf-to-jpg')).toBe(false);
    expect(pdfTools.some(tool => tool.slug === 'heic-to-pdf')).toBe(false);
    expect(pdfTools.every(tool => tool.indexable && tool.reviewed && tool.last_reviewed)).toBe(true);
  });
  it('links related pages by real attributes, excludes current and noindex pages', () => {
    for (const tool of getAllTools()) {
      const related = getRelatedTools(tool);
      expect(new Set(related.map(item => item.slug)).size).toBe(related.length);
      for (const item of related) {
        expect(item.slug).not.toBe(tool.slug);
        expect(item.indexable && item.reviewed).toBe(true);
        if (!tool.related?.includes(item.slug)) expect(
          (tool.from && item.from === tool.from) || (tool.to && item.to === tool.to) || item.kind === tool.kind || item.engine === tool.engine
        ).toBeTruthy();
      }
    }
  });
  it('has unique guide URLs, sections and valid tool associations', () => {
    const tools = new Set(getAllTools().map(tool => tool.slug));
    expect(new Set(searchGuides.map(guide => guide.slug)).size).toBe(searchGuides.length);
    for (const guide of searchGuides) {
      expect(new Set(guide.sections.map(section => section.id)).size).toBe(guide.sections.length);
      for (const tool of guide.tools) expect(tools.has(tool)).toBe(true);
      expect(guide.sections.map(section => section.body).join(' ').split(/\s+/).length).toBeGreaterThan(500);
    }
  });
  it('redirects noncanonical worker hosts and HTTP while preserving path and query', async () => {
    expect(wrangler.assets.run_worker_first).toBe(true);
    const fetch = vi.fn();
    for (const origin of ['http://zixtool.online', 'https://www.zixtool.online', 'https://tools.example.workers.dev']) {
      const response = await worker.fetch(new Request(`${origin}/merge-pdf/?source=test`), { ASSETS: { fetch } });
      expect(response.status).toBe(301);
      expect(response.headers.get('location')).toBe('https://zixtool.online/merge-pdf/?source=test');
    }
    expect(fetch).not.toHaveBeenCalled();
  });
  it('serves canonical HTTPS assets without a redirect loop', async () => {
    const request = new Request('https://zixtool.online/merge-pdf/?source=test');
    const assetResponse = new Response('Tool page');
    const fetch = vi.fn().mockResolvedValue(assetResponse);
    expect(await worker.fetch(request, { ASSETS: { fetch } })).toBe(assetResponse);
    expect(fetch).toHaveBeenCalledWith(request);
  });
});
