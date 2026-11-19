import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

export interface SearchRow { key: string; clicks: number; impressions: number; ctr: number; position: number }

// Search Console's English CSV exports support quoted commas, quotes and newlines.
export function parseCsv(input: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [], cell = '', quoted = false;
  const text = input.replace(/^\uFEFF/, '');
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (char === '"') {
      if (quoted && text[i + 1] === '"') { cell += '"'; i++; }
      else quoted = !quoted;
    } else if (char === ',' && !quoted) { row.push(cell); cell = ''; }
    else if ((char === '\n' || char === '\r') && !quoted) {
      if (char === '\r' && text[i + 1] === '\n') i++;
      row.push(cell);
      if (row.some(value => value.trim())) rows.push(row);
      row = []; cell = '';
    } else cell += char;
  }
  if (quoted) throw new Error('CSV contains an unterminated quoted field.');
  row.push(cell);
  if (row.some(value => value.trim())) rows.push(row);
  return rows;
}

export function readSearchExport(csv: string): { dimension: 'page' | 'query'; rows: SearchRow[] } {
  const [header, ...records] = parseCsv(csv);
  if (!header) throw new Error('Empty Search Console export.');
  const columns = header.map(value => value.trim().toLowerCase());
  const dimensionIndex = columns.findIndex(value => ['top pages', 'page', 'top queries', 'query'].includes(value));
  if (dimensionIndex < 0) throw new Error('Export the Pages or Queries tab in English from Search Console.');
  const dimension = /quer/.test(columns[dimensionIndex]) ? 'query' : 'page';
  const clickIndex = columns.indexOf('clicks'), impressionIndex = columns.indexOf('impressions'), positionIndex = columns.indexOf('position');
  if ([clickIndex, impressionIndex, positionIndex].includes(-1)) throw new Error('Expected Clicks, Impressions and Position columns.');
  const seen = new Set<string>();
  const rows = records.map((values, index) => {
    const key = values[dimensionIndex]?.trim();
    if (!key || seen.has(key)) throw new Error(`Empty or duplicate key on CSV row ${index + 2}. Export one dimension without totals.`);
    seen.add(key);
    const number = (column: number) => {
      const raw = values[column]?.trim();
      if (!raw) throw new Error(`Missing metric on CSV row ${index + 2}.`);
      const value = Number(raw.replace(/,/g, ''));
      if (!Number.isFinite(value) || value < 0) throw new Error(`Invalid metric on CSV row ${index + 2}.`);
      return value;
    };
    const clicks = number(clickIndex), impressions = number(impressionIndex), position = number(positionIndex);
    if (!Number.isInteger(clicks) || !Number.isInteger(impressions) || clicks > impressions) throw new Error(`Invalid counts on CSV row ${index + 2}.`);
    return { key, clicks, impressions, ctr: impressions ? clicks / impressions : 0, position };
  });
  return { dimension, rows };
}

export function analyzeSearchPerformance(current: SearchRow[], previous: SearchRow[] = [], minImpressions = 100) {
  const before = new Map(previous.map(row => [row.key, row]));
  const now = new Map(current.map(row => [row.key, row]));
  const changes = [...new Set([...before.keys(), ...now.keys()])].map(key => {
    const a = now.get(key), b = before.get(key);
    return {
      key, current: a || null, previous: b || null,
      clickChange: a && b ? a.clicks - b.clicks : null,
      // Missing rows can be export truncation or anonymization, not zero traffic.
      positionChange: a && b ? a.position - b.position : null,
      status: a && b ? 'comparable' : a ? 'not_in_previous_export' : 'not_in_current_export',
    };
  });
  return {
    currentRows: current.length, previousRows: previous.length,
    exportedClicks: current.reduce((sum, row) => sum + row.clicks, 0),
    lowCtrCandidates: current.filter(row => row.impressions >= minImpressions && row.position > 0 && row.position <= 20 && row.ctr < 0.02).sort((a, b) => b.impressions - a.impressions),
    decliningCandidates: changes.filter(row => row.current && row.previous && row.previous.clicks >= 10 && row.current.clicks < row.previous.clicks * 0.8).sort((a, b) => (a.clickChange || 0) - (b.clickChange || 0)),
    rankingDeclines: changes.filter(row => row.current && row.previous && row.current.impressions >= minImpressions && row.previous.impressions >= minImpressions && (row.positionChange || 0) >= 3),
    changes,
    interpretation: [
      'Compare equal date windows with identical country, device, search type and other filters.',
      'Thresholds identify review candidates, not SEO scores, causes, forecasts or guaranteed opportunities.',
      'CTR depends on query intent, position, device and search features. Read the query and landing page before editing.',
      'Missing rows are unknown, not zero. Exports may be truncated and anonymized queries may be absent.',
      'Exported row totals are not necessarily property totals. Search Console average position is not a fixed rank.',
    ],
  };
}

function main() {
  const args = process.argv.slice(2);
  const option = (key: string) => { const index = args.indexOf(key); return index < 0 ? undefined : args[index + 1]; };
  const currentFile = option('--current');
  if (!currentFile || args.includes('--help')) {
    console.log('Usage: pnpm exec tsx scripts/search-performance.ts --current Pages.csv [--previous PreviousPages.csv] [--output .seo-reports/search-performance.json]');
    console.log('Use equal periods and identical filters. No account access or live metrics are fabricated.');
    if (!args.includes('--help')) process.exitCode = 1;
    return;
  }
  const current = readSearchExport(fs.readFileSync(currentFile, 'utf-8'));
  const previousFile = option('--previous');
  const previous = previousFile ? readSearchExport(fs.readFileSync(previousFile, 'utf-8')) : undefined;
  if (previous && previous.dimension !== current.dimension) throw new Error('Cannot compare a Pages export with a Queries export.');
  const output = path.resolve(option('--output') || '.seo-reports/search-performance.json');
  for (const publicDir of ['public', 'dist', 'src']) {
    const root = path.resolve(publicDir);
    if (output === root || output.startsWith(root + path.sep)) throw new Error('Keep account reports outside public assets and source routes.');
  }
  const report = { generatedAt: new Date().toISOString(), dimension: current.dimension, ...analyzeSearchPerformance(current.rows, previous?.rows) };
  fs.mkdirSync(path.dirname(output), { recursive: true });
  fs.writeFileSync(output, JSON.stringify(report, null, 2) + '\n');
  console.log(`Analyzed ${current.rows.length} ${current.dimension} rows. Saved ${report.lowCtrCandidates.length} low-CTR and ${report.decliningCandidates.length} declining-click review candidates to ${output}.`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  try { main(); } catch (error) { console.error(error instanceof Error ? error.message : error); process.exitCode = 1; }
}
