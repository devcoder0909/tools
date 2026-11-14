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
  const tools = getAllTools();
  if (tool.related && tool.related.length > 0) {
    return tools.filter((t) => tool.related?.includes(t.slug));
  }
  return tools
    .filter((t) => t.slug !== tool.slug && (t.from === tool.from || t.to === tool.to || t.kind === tool.kind))
    .slice(0, 4);
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export function formatDisplayDate(dateStr?: string): string {
  if (!dateStr) return '13 Nov 2026';
  try {
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      const year = parts[0];
      const monthIdx = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      if (monthIdx >= 0 && monthIdx < 12 && !isNaN(day)) {
        return `${day} ${MONTHS[monthIdx]} ${year}`;
      }
    }
    const d = new Date(dateStr);
    if (!isNaN(d.getTime())) {
      return `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
    }
  } catch {}
  return dateStr;
}
