import { describe, it, expect } from 'vitest';
import { getAllTools, getToolBySlug, getAllFormats, getIndexableTools } from '../../src/registry';

describe('Registry Loader', () => {
  it('loads all tools from tools.yaml', () => {
    const tools = getAllTools();
    expect(tools.length).toBeGreaterThan(0);
    expect(tools.some((t) => t.slug === 'heic-to-jpg')).toBe(true);
  });

  it('correctly filters indexable reviewed tools', () => {
    const indexable = getIndexableTools();
    expect(indexable.length).toBeGreaterThanOrEqual(1);
    const heic = indexable.find((t) => t.slug === 'heic-to-jpg');
    expect(heic).toBeDefined();
    expect(heic?.reviewed).toBe(true);
    expect(heic?.last_reviewed).toBeDefined();
  });

  it('loads all format guides and hubs', () => {
    const formats = getAllFormats();
    expect(formats.length).toBeGreaterThanOrEqual(9);
    const jpg = formats.find((f) => f.id === 'jpg');
    expect(jpg?.name).toBe('JPEG / JPG');
    expect(jpg?.hub).toBe(true);
  });

  it('finds tool by slug', () => {
    const tool = getToolBySlug('heic-to-jpg');
    expect(tool).toBeDefined();
    expect(tool?.kind).toBe('converter');
    expect(tool?.from).toBe('heic');
    expect(tool?.to).toBe('jpg');
  });
});
