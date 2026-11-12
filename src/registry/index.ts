import fs from 'node:fs';
import path from 'node:path';
import yaml from 'js-yaml';

export interface ToolFaq {
  q: string;
  a: string;
}

export interface ToolDefinition {
  id: string;
  kind: 'converter' | 'calculator' | 'text';
  slug: string;
  name: string;
  title: string;
  description: string;
  from?: string;
  to?: string;
  engine: string;
  options?: any[];
  presets?: string[];
  content: string;
  faq?: ToolFaq[];
  related?: string[];
  indexable: boolean;
  reviewed: boolean;
  last_reviewed: string;
  lang: string;
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
  title: string;
  description: string;
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
