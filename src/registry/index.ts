import fs from 'node:fs';
import path from 'node:path';
import yaml from 'js-yaml';

export interface ToolFaq {
  q: string;
  a: string;
}

export interface ToolSeo {
  primary_kw: string;
  secondary_kws?: string[];
  intent?: 'tool' | 'calculator' | 'how-to' | 'comparison' | 'definition';
  tier?: number;
  sources?: string;
  last_reviewed?: string;
}

export interface ToolDefinition {
  id: string;
  kind: 'converter' | 'calculator' | 'text' | 'pdf' | 'generator' | 'finance' | 'media' | 'developer';
  slug: string;
  name: string;
  title: string;
  subtitle?: string;
  description: string;
  from?: string;
  to?: string;
  engine: string;
  options?: any[];
  presets?: string[];
  targetBytes?: number;
  content: string;
  faq?: ToolFaq[];
  related?: string[];
  indexable: boolean;
  reviewed: boolean;
  last_reviewed: string;
  reviewer?: string;
  lang: string;
  seo?: ToolSeo;
}

export interface FormatDefinition {
  id: string;
  name: string;
  extension: string;
  mime: string;
  category: 'raster' | 'vector' | 'document';
  lossy: boolean;
  transparency: boolean;
  animation: boolean;
  hub: boolean;
  indexable?: boolean;
  title: string;
  description: string;
  content?: string;
  faq?: ToolFaq[];
  last_reviewed?: string;
  reviewer?: string;
}

const REGISTRY_DIR = path.resolve(process.cwd(), 'src/registry');

let cachedTools: ToolDefinition[] | null = null;
let cachedFormats: FormatDefinition[] | null = null;

export function getAllTools(): ToolDefinition[] {
  if (cachedTools) return cachedTools;
  const filePath = path.join(REGISTRY_DIR, 'tools.yaml');
  const fileContent = fs.readFileSync(filePath, 'utf-8');
  cachedTools = yaml.load(fileContent) as ToolDefinition[];
  return cachedTools;
}

export function getToolBySlug(slug: string): ToolDefinition | undefined {
  const tools = getAllTools();
  return tools.find((t) => t.slug === slug);
}

export function getIndexableTools(): ToolDefinition[] {
  return getAllTools().filter((t) => t.indexable && t.reviewed && t.last_reviewed);
}

export function getAllFormats(): FormatDefinition[] {
  if (cachedFormats) return cachedFormats;
  const filePath = path.join(REGISTRY_DIR, 'formats.yaml');
  const fileContent = fs.readFileSync(filePath, 'utf-8');
  cachedFormats = yaml.load(fileContent) as FormatDefinition[];
  return cachedFormats;
}

export function getFormatById(id: string): FormatDefinition | undefined {
  return getAllFormats().find((f) => f.id === id);
}

export function getFormatHubs(): FormatDefinition[] {
  return getAllFormats().filter((f) => f.hub);
}

export function getToolsForFormat(formatId: string): ToolDefinition[] {
  return getAllTools().filter((t) => t.from === formatId || t.to === formatId);
}

export function getRelatedTools(tool: ToolDefinition): ToolDefinition[] {
  const candidates = getIndexableTools().filter(candidate => candidate.slug !== tool.slug);
  const explicit = (tool.related || []).map(slug => candidates.find(candidate => candidate.slug === slug)).filter((candidate): candidate is ToolDefinition => !!candidate);
  const score = (candidate: ToolDefinition) =>
    (tool.from && candidate.from === tool.from ? 4 : 0)
    + (tool.to && candidate.to === tool.to ? 3 : 0)
    + (candidate.kind === tool.kind ? 2 : 0)
    + (candidate.engine === tool.engine ? 1 : 0);
  const fallback = candidates
    .filter(candidate => !explicit.some(item => item.slug === candidate.slug) && score(candidate) > 0)
    .sort((a, b) => score(b) - score(a) || a.slug.localeCompare(b.slug));
  return [...explicit, ...fallback].slice(0, 6);
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export function formatDisplayDate(dateVal?: any): string {
  if (!dateVal) return '16 Nov 2026';
  try {
    const d = new Date(dateVal);
    if (!isNaN(d.getTime())) {
      return `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
    }
  } catch {}
  return String(dateVal);
}

export function formatIsoDate(dateVal?: any): string {
  if (!dateVal) return '2026-11-16';
  try {
    const d = new Date(dateVal);
    if (!isNaN(d.getTime())) {
      return d.toISOString().split('T')[0];
    }
  } catch {}
  return '2026-11-16';
}
