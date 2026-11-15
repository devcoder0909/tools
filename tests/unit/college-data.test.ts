import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import {
  CollegeRecordSchema,
  ProgramDefinitionSchema,
  NirfCollegeItemSchema,
  CutoffRowSchema,
  type CollegeRecord,
  type CutoffRow,
  type NirfCollegeItem,
} from '../../scripts/schema';

describe('College Data Layer (M1 Acceptance Tests)', () => {
  const SRC_DATA = path.resolve(process.cwd(), 'src/data');
  const CUTOFFS_DIR = path.resolve(process.cwd(), 'public/data/cutoffs');

  it('compiles colleges.json matching CollegeRecordSchema', () => {
    const raw = fs.readFileSync(path.join(SRC_DATA, 'colleges.json'), 'utf-8');
    const colleges: CollegeRecord[] = JSON.parse(raw);

    expect(colleges.length).toBeGreaterThanOrEqual(100);

    const slugs = new Set<string>();
    const now = new Date('2026-11-15T00:00:00.000Z');
    const twelveMonthsAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);

    for (const college of colleges) {
      const parsed = CollegeRecordSchema.safeParse(college);
      expect(parsed.success).toBe(true);

      // Unique slug check
      expect(slugs.has(college.slug)).toBe(false);
      slugs.add(college.slug);

      // Provenance check
      expect(college.sources.length).toBeGreaterThan(0);
      for (const src of college.sources) {
        expect(src.source_name).toBeTruthy();
        expect(src.source_url.startsWith('http')).toBe(true);
        const vDate = new Date(src.verified_at);
        expect(vDate >= twelveMonthsAgo).toBe(true);
      }

      // Rank values are integers
      for (const nirf of college.nirf) {
        expect(Number.isInteger(nirf.rank)).toBe(true);
        expect(nirf.rank).toBeGreaterThan(0);
      }
    }
  });

  it('compiles programs.json matching ProgramDefinitionSchema', () => {
    const raw = fs.readFileSync(path.join(SRC_DATA, 'programs.json'), 'utf-8');
    const programs = JSON.parse(raw);

    expect(programs.length).toBeGreaterThanOrEqual(10);
    for (const prog of programs) {
      const parsed = ProgramDefinitionSchema.safeParse(prog);
      expect(parsed.success).toBe(true);
    }
  });

  it('compiles nirf.json with valid rankings and categories', () => {
    const raw = fs.readFileSync(path.join(SRC_DATA, 'nirf.json'), 'utf-8');
    const rankings: NirfCollegeItem[] = JSON.parse(raw);

    expect(rankings.length).toBeGreaterThanOrEqual(50);
    const engineeringRankings = rankings.filter((r) => r.category === 'Engineering' && r.year === 2024);
    expect(engineeringRankings.length).toBeGreaterThanOrEqual(25);

    // Verify #1 is IIT Madras
    const top1 = engineeringRankings.find((r) => r.rank === 1);
    expect(top1).toBeDefined();
    expect(top1?.name).toContain('Madras');

    for (const item of rankings) {
      const parsed = NirfCollegeItemSchema.safeParse(item);
      expect(parsed.success).toBe(true);
      expect(Number.isInteger(item.rank)).toBe(true);
      expect(item.score).toBeGreaterThan(0);
    }
  });

  it('generates on-demand cutoff chunk files with verified row counts', () => {
    expect(fs.existsSync(path.join(CUTOFFS_DIR, 'index.json'))).toBe(true);
    expect(fs.existsSync(path.join(CUTOFFS_DIR, '2024-all.json'))).toBe(true);
    expect(fs.existsSync(path.join(CUTOFFS_DIR, '2024-iit.json'))).toBe(true);
    expect(fs.existsSync(path.join(CUTOFFS_DIR, '2024-nit.json'))).toBe(true);
    expect(fs.existsSync(path.join(CUTOFFS_DIR, '2024-iiit.json'))).toBe(true);
    expect(fs.existsSync(path.join(CUTOFFS_DIR, '2024-gfti.json'))).toBe(true);

    const indexMeta = JSON.parse(fs.readFileSync(path.join(CUTOFFS_DIR, 'index.json'), 'utf-8'));
    expect(indexMeta.total_rows).toBeGreaterThanOrEqual(150);

    const allRows: CutoffRow[] = JSON.parse(fs.readFileSync(path.join(CUTOFFS_DIR, '2024-all.json'), 'utf-8'));
    expect(allRows.length).toBe(indexMeta.total_rows);

    for (const row of allRows) {
      const parsed = CutoffRowSchema.safeParse(row);
      expect(parsed.success).toBe(true);

      const [, , , , , round, openingRank, closingRank] = row;
      expect(round).toBe(5);
      expect(Number.isInteger(openingRank)).toBe(true);
      expect(Number.isInteger(closingRank)).toBe(true);
      expect(openingRank).toBeLessThanOrEqual(closingRank);
    }
  });
});
