import { describe, expect, it } from 'vitest';
import { resolvePageSeo } from '../../src/utils/seo';

const page = { title: 'PNG to JPG Converter', description: 'Convert PNG images to JPG.' };

describe('canonical URL resolution', () => {
  it('uses the production origin for preview URLs and removes tracking and fragments', () => {
    const result = resolvePageSeo(page, 'http://localhost:4321/png-to-jpg?utm_source=test#upload');
    expect(result.canonical).toBe('https://zixtool.online/png-to-jpg/');
    expect(result.ogUrl).toBe(result.canonical);
  });

  it('resolves relative canonicals and retains an intentional external canonical', () => {
    expect(resolvePageSeo({ ...page, canonical: '/merge-pdf' }).canonical).toBe('https://zixtool.online/merge-pdf/');
    expect(resolvePageSeo({ ...page, canonical: 'https://example.org/original/' }).canonical).toBe('https://example.org/original/');
  });

  it('keeps file URLs intact and preserves noindex', () => {
    const result = resolvePageSeo({ ...page, noindex: true }, 'https://preview.example/404.html');
    expect(result.canonical).toBe('https://zixtool.online/404.html');
    expect(result.robotsContent).toBe('noindex, follow');
  });
});
