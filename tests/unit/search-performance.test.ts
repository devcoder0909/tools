import { describe, expect, it } from 'vitest';
import { analyzeSearchPerformance, parseCsv, readSearchExport } from '../../scripts/search-performance';

describe('Search Console export analysis', () => {
  it('parses BOM, quoted commas, escaped quotes and embedded line breaks', () => {
    expect(parseCsv('\uFEFFQuery,Clicks\r\n"hello, ""world""\nagain",2\r\n')).toEqual([['Query', 'Clicks'], ['hello, "world"\nagain', '2']]);
  });
  it('calculates CTR from counts rather than trusting rounded display values', () => {
    const result = readSearchExport('Top pages,Clicks,Impressions,CTR,Position\nhttps://example.org/,3,"1,500",0.2%,8.2');
    expect(result.dimension).toBe('page');
    expect(result.rows[0].ctr).toBe(0.002);
  });
  it('rejects broken exports instead of generating misleading metrics', () => {
    expect(() => parseCsv('"unclosed')).toThrow();
    expect(() => readSearchExport('Top pages,Clicks,Impressions,Position\na,5,2,1')).toThrow();
    expect(() => readSearchExport('Top pages,Clicks,Impressions,Position\na,1,2,1\na,1,2,1')).toThrow();
  });
  it('flags measured declines but keeps missing rows unknown', () => {
    const current = [{ key: 'a', clicks: 5, impressions: 1000, ctr: 0.005, position: 12 }];
    const previous = [{ key: 'a', clicks: 20, impressions: 1000, ctr: 0.02, position: 8 }, { key: 'missing', clicks: 20, impressions: 500, ctr: 0.04, position: 4 }];
    const report = analyzeSearchPerformance(current, previous);
    expect(report.lowCtrCandidates).toHaveLength(1);
    expect(report.decliningCandidates).toHaveLength(1);
    expect(report.rankingDeclines).toHaveLength(1);
    expect(report.changes.find(row => row.key === 'missing')?.clickChange).toBeNull();
  });
});
