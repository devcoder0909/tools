import { z } from 'zod';

export const ProvenanceSchema = z.object({
  source_name: z.string().min(1),
  source_url: z.string().url(),
  source_year: z.number().int().min(2020),
  retrieved_at: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  verified_by: z.string().min(1),
  verified_at: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

export type Provenance = z.infer<typeof ProvenanceSchema>;

export const NirfRankEntrySchema = z.object({
  year: z.number().int().min(2020),
  category: z.string().min(1),
  rank: z.number().int().min(1),
  score: z.number().optional(),
});

export type NirfRankEntry = z.infer<typeof NirfRankEntrySchema>;

export const CollegeRecordSchema = z.object({
  slug: z.string().min(1).regex(/^[a-z0-9-]+$/),
  name: z.string().min(1),
  short_name: z.string().optional(),
  city: z.string().min(1),
  state: z.string().min(1),
  type: z.enum(['IIT', 'NIT', 'IIIT', 'GFTI', 'University', 'Other']),
  official_url: z.string().url(),
  nirf: z.array(NirfRankEntrySchema),
  josaa_code: z.string().optional(),
  established: z.number().int().optional(),
  sources: z.array(ProvenanceSchema).min(1),
});

export type CollegeRecord = z.infer<typeof CollegeRecordSchema>;

// Compact Cutoff Row Format:
// [institute_slug, program_code, quota, seat_type, gender, round, opening_rank, closing_rank]
export const CutoffRowSchema = z.tuple([
  z.string().min(1), // 0: institute_slug
  z.string().min(1), // 1: program_code
  z.string().min(1), // 2: quota (AI, OS, HS, etc.)
  z.string().min(1), // 3: seat_type (OPEN, EWS, OBC-NCL, SC, ST)
  z.string().min(1), // 4: gender (Gender-Neutral, Female-only)
  z.number().int().min(1).max(6), // 5: round
  z.number().int().min(1), // 6: opening_rank
  z.number().int().min(1), // 7: closing_rank
]);

export type CutoffRow = z.infer<typeof CutoffRowSchema>;

export const ProgramDefinitionSchema = z.object({
  code: z.string().min(1),
  name: z.string().min(1),
  discipline: z.string().min(1),
  duration_years: z.number().int().default(4),
  degree: z.string().default('B.Tech'),
});

export type ProgramDefinition = z.infer<typeof ProgramDefinitionSchema>;

export const NirfCollegeItemSchema = z.object({
  rank: z.number().int().min(1),
  name: z.string().min(1),
  slug: z.string().min(1).regex(/^[a-z0-9-]+$/),
  city: z.string().min(1),
  state: z.string().min(1),
  score: z.number(),
  category: z.string().min(1),
  year: z.number().int().min(2020),
  official_url: z.string().url(),
  sources: z.array(ProvenanceSchema).min(1),
});

export type NirfCollegeItem = z.infer<typeof NirfCollegeItemSchema>;
