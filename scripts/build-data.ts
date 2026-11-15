import fs from 'node:fs';
import path from 'node:path';
import {
  CollegeRecordSchema,
  ProgramDefinitionSchema,
  NirfCollegeItemSchema,
  CutoffRowSchema,
  type CollegeRecord,
  type ProgramDefinition,
  type NirfCollegeItem,
  type CutoffRow,
} from './schema';

const RAW_DIR = path.resolve(process.cwd(), 'data/raw');
const SRC_DATA_DIR = path.resolve(process.cwd(), 'src/data');
const PUBLIC_CUTOFFS_DIR = path.resolve(process.cwd(), 'public/data/cutoffs');

// Ensure output directories exist
fs.mkdirSync(SRC_DATA_DIR, { recursive: true });
fs.mkdirSync(PUBLIC_CUTOFFS_DIR, { recursive: true });

interface BuildMeta {
  built_at: string;
  institute_count: number;
  nirf_count: number;
  cutoff_row_count: number;
  program_count: number;
  chunk_files: string[];
}

export function buildData(): boolean {
  console.log('\n=== [BUILD-DATA] Validating & Compiling College Data Layer ===');

  let hasErrors = false;
  const now = new Date('2026-11-15T00:00:00.000Z');
  const twelveMonthsAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);

  // 1. Load Raw Files
  const institutesRawPath = path.join(RAW_DIR, 'josaa-institutes.json');
  const programsRawPath = path.join(RAW_DIR, 'programs.json');
  const nirfRawPath = path.join(RAW_DIR, 'nirf-rankings.json');
  const cutoffsRawPath = path.join(RAW_DIR, 'josaa-cutoffs-2024.json');

  if (!fs.existsSync(institutesRawPath) || !fs.existsSync(programsRawPath) || !fs.existsSync(nirfRawPath) || !fs.existsSync(cutoffsRawPath)) {
    console.error('[FAIL] Missing raw data files in data/raw/');
    return false;
  }

  const rawInstitutes = JSON.parse(fs.readFileSync(institutesRawPath, 'utf-8'));
  const rawPrograms = JSON.parse(fs.readFileSync(programsRawPath, 'utf-8'));
  const rawNirf = JSON.parse(fs.readFileSync(nirfRawPath, 'utf-8'));
  const rawCutoffs = JSON.parse(fs.readFileSync(cutoffsRawPath, 'utf-8'));

  // 2. Validate Programs
  console.log(`[VALIDATING] ${rawPrograms.length} Academic Programs...`);
  const validatedPrograms: ProgramDefinition[] = [];
  const validProgramCodes = new Set<string>();

  for (const prog of rawPrograms) {
    const parseRes = ProgramDefinitionSchema.safeParse(prog);
    if (!parseRes.success) {
      console.error(`[FAIL] Program schema error for ${prog.code || 'unknown'}:`, parseRes.error.format());
      hasErrors = true;
    } else {
      validatedPrograms.push(parseRes.data);
      validProgramCodes.add(parseRes.data.code);
    }
  }

  // 3. Validate Institutes
  console.log(`[VALIDATING] ${rawInstitutes.length} Institutes with Provenance...`);
  const validatedInstitutes: CollegeRecord[] = [];
  const instituteSlugs = new Set<string>();
  const instituteTypeMap = new Map<string, string>();

  for (const inst of rawInstitutes) {
    const parseRes = CollegeRecordSchema.safeParse(inst);
    if (!parseRes.success) {
      console.error(`[FAIL] College record schema error for ${inst.slug || 'unknown'}:`, parseRes.error.format());
      hasErrors = true;
      continue;
    }

    const data = parseRes.data;

    // Check duplicate slug
    if (instituteSlugs.has(data.slug)) {
      console.error(`[FAIL] Duplicate institute slug found: ${data.slug}`);
      hasErrors = true;
    }
    instituteSlugs.add(data.slug);
    instituteTypeMap.set(data.slug, data.type);

    // Validate provenance timestamp within 12 months
    for (const src of data.sources) {
      const vDate = new Date(src.verified_at);
      if (isNaN(vDate.getTime()) || vDate < twelveMonthsAgo || vDate > now) {
        console.error(`[FAIL] Provenance verified_at out of 12-month window for ${data.slug}: ${src.verified_at}`);
        hasErrors = true;
      }
    }

    // Validate NIRF ranks are positive integers
    for (const entry of data.nirf) {
      if (!Number.isInteger(entry.rank) || entry.rank < 1) {
        console.error(`[FAIL] Invalid non-integer NIRF rank for ${data.slug}: ${entry.rank}`);
        hasErrors = true;
      }
    }

    validatedInstitutes.push(data);
  }

  // 4. Validate NIRF Rankings
  console.log(`[VALIDATING] ${rawNirf.length} NIRF Ranking Items...`);
  const validatedNirf: NirfCollegeItem[] = [];

  for (const item of rawNirf) {
    const parseRes = NirfCollegeItemSchema.safeParse(item);
    if (!parseRes.success) {
      console.error(`[FAIL] NIRF item schema error for ${item.name || 'unknown'}:`, parseRes.error.format());
      hasErrors = true;
    } else {
      // Check rank is integer
      if (!Number.isInteger(parseRes.data.rank) || parseRes.data.rank < 1) {
        console.error(`[FAIL] Non-integer rank in NIRF data: ${parseRes.data.name} (#${parseRes.data.rank})`);
        hasErrors = true;
      }
      validatedNirf.push(parseRes.data);
    }
  }

  // 5. Validate Cutoff Rows
  console.log(`[VALIDATING] ${rawCutoffs.length} JoSAA Cutoff Rows...`);
  const validatedCutoffs: CutoffRow[] = [];

  for (let i = 0; i < rawCutoffs.length; i++) {
    const row = rawCutoffs[i];
    const parseRes = CutoffRowSchema.safeParse(row);
    if (!parseRes.success) {
      console.error(`[FAIL] Cutoff row #${i} schema error:`, parseRes.error.format());
      hasErrors = true;
      continue;
    }

    const [slug, progCode, , , , , openingRank, closingRank] = parseRes.data;

    // Check slug exists
    if (!instituteSlugs.has(slug)) {
      console.error(`[FAIL] Cutoff row #${i} references unknown institute slug: "${slug}"`);
      hasErrors = true;
    }

    // Check program exists
    if (!validProgramCodes.has(progCode)) {
      console.error(`[FAIL] Cutoff row #${i} references unknown program code: "${progCode}"`);
      hasErrors = true;
    }

    // Check ranks are positive integers and opening <= closing
    if (!Number.isInteger(openingRank) || !Number.isInteger(closingRank) || closingRank < 1 || openingRank < 1) {
      console.error(`[FAIL] Cutoff row #${i} invalid ranks: opening=${openingRank}, closing=${closingRank}`);
      hasErrors = true;
    }

    if (openingRank > closingRank) {
      console.error(`[FAIL] Cutoff row #${i} opening rank (${openingRank}) exceeds closing rank (${closingRank})`);
      hasErrors = true;
    }

    validatedCutoffs.push(parseRes.data);
  }

  // 6. Check Drift against previous build metadata
  const metaPath = path.join(SRC_DATA_DIR, 'meta.json');
  if (fs.existsSync(metaPath)) {
    try {
      const prevMeta: BuildMeta = JSON.parse(fs.readFileSync(metaPath, 'utf-8'));
      console.log('[CHECK] Comparing row counts against previous build meta...');

      const checkDrift = (name: string, current: number, prev: number) => {
        if (prev > 0) {
          const delta = Math.abs(current - prev) / prev;
          if (delta > 0.20) {
            console.warn(`[WARN-DRIFT] ${name} changed by ${(delta * 100).toFixed(1)}% (prev: ${prev}, current: ${current})`);
          }
        }
      };

      checkDrift('Institute Count', validatedInstitutes.length, prevMeta.institute_count);
      checkDrift('NIRF Count', validatedNirf.length, prevMeta.nirf_count);
      checkDrift('Cutoff Row Count', validatedCutoffs.length, prevMeta.cutoff_row_count);
    } catch (e) {
      console.warn('[WARN] Could not parse previous meta.json for drift check');
    }
  }

  if (hasErrors) {
    console.error('\n[BUILD-DATA FAILED] One or more data integrity checks failed. Build halted.');
    return false;
  }

  // 7. Write Compiled JSON Files (both src/data and public/data for client loading)
  fs.writeFileSync(path.join(SRC_DATA_DIR, 'colleges.json'), JSON.stringify(validatedInstitutes, null, 2), 'utf-8');
  fs.writeFileSync(path.join(SRC_DATA_DIR, 'nirf.json'), JSON.stringify(validatedNirf, null, 2), 'utf-8');
  fs.writeFileSync(path.join(SRC_DATA_DIR, 'programs.json'), JSON.stringify(validatedPrograms, null, 2), 'utf-8');

  const publicDataDir = path.resolve(process.cwd(), 'public/data');
  if (!fs.existsSync(publicDataDir)) fs.mkdirSync(publicDataDir, { recursive: true });
  fs.writeFileSync(path.join(publicDataDir, 'colleges.json'), JSON.stringify(validatedInstitutes), 'utf-8');
  fs.writeFileSync(path.join(publicDataDir, 'programs.json'), JSON.stringify(validatedPrograms), 'utf-8');

  // 8. Chunk Cutoff Data by Year & Institute Type for on-demand client loading
  const chunkFiles: string[] = [];

  // Group by type: IIT, NIT, IIIT, GFTI, University
  const types = ['IIT', 'NIT', 'IIIT', 'GFTI', 'University'];
  for (const t of types) {
    const chunkRows = validatedCutoffs.filter(([slug]) => instituteTypeMap.get(slug) === t);
    const chunkFileName = `2024-${t.toLowerCase()}.json`;
    fs.writeFileSync(
      path.join(PUBLIC_CUTOFFS_DIR, chunkFileName),
      JSON.stringify(chunkRows),
      'utf-8'
    );
    chunkFiles.push(chunkFileName);
    console.log(`[CHUNK] Wrote ${chunkRows.length} rows to public/data/cutoffs/${chunkFileName}`);
  }

  // Write full 2024 dataset for comprehensive lookup
  fs.writeFileSync(
    path.join(PUBLIC_CUTOFFS_DIR, '2024-all.json'),
    JSON.stringify(validatedCutoffs),
    'utf-8'
  );
  chunkFiles.push('2024-all.json');

  // Write chunk index
  const chunkIndex = {
    year: 2024,
    round: 5,
    total_rows: validatedCutoffs.length,
    institutes_covered: instituteSlugs.size,
    chunks: types.map((t) => ({
      type: t,
      file: `2024-${t.toLowerCase()}.json`,
      rows: validatedCutoffs.filter(([slug]) => instituteTypeMap.get(slug) === t).length,
    })),
  };
  fs.writeFileSync(
    path.join(PUBLIC_CUTOFFS_DIR, 'index.json'),
    JSON.stringify(chunkIndex, null, 2),
    'utf-8'
  );

  // 9. Write Meta File
  const meta: BuildMeta = {
    built_at: new Date().toISOString(),
    institute_count: validatedInstitutes.length,
    nirf_count: validatedNirf.length,
    cutoff_row_count: validatedCutoffs.length,
    program_count: validatedPrograms.length,
    chunk_files: chunkFiles,
  };
  fs.writeFileSync(metaPath, JSON.stringify(meta, null, 2), 'utf-8');

  console.log(`\n[BUILD-DATA SUCCESS] Compiled ${validatedInstitutes.length} colleges, ${validatedNirf.length} NIRF ranks, ${validatedCutoffs.length} cutoff rows into src/data/ and public/data/cutoffs/`);
  return true;
}

if (import.meta.url.endsWith(process.argv[1]) || process.argv[1]?.endsWith('build-data.ts')) {
  const success = buildData();
  if (!success) {
    process.exit(1);
  }
}
