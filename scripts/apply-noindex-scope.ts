import fs from 'node:fs';
import path from 'node:path';

const CATEGORY_A_IDS = new Set([
  'heic-to-jpg',
  'heic-to-png',
  'heic-to-pdf',
  'webp-to-jpg',
  'webp-to-png',
  'png-to-webp',
  'jpg-to-webp',
  'avif-to-jpg',
  'avif-to-png',
  'png-to-jpg',
  'jpg-to-png',
  'jfif-to-jpg',
  'svg-to-png',
  'bmp-to-jpg',
  'tiff-to-jpg',
  'gif-to-png',
  'jpg-to-pdf',
  'png-to-pdf',
  'compress-image-to-20kb',
  'compress-image-to-50kb',
  'compress-image-to-100kb',
  'compress-image-to-200kb',
  'compress-image-to-500kb',
  'compress-image-to-1mb',
  'image-compressor',
  'resize-image',
  'percentage-calculator',
  'age-calculator',
  'date-difference-calculator',
  'discount-calculator',
  'tip-calculator',
  'word-counter',
  'case-converter',
  'json-formatter',
  'pdf-to-jpg',
  'jpeg-to-jpg',
  'photo-compressor',
  'jpg-compressor',
  'passport-photo-resizer',
]);

const yamlPath = path.resolve(process.cwd(), 'src/registry/tools.yaml');
const rawYaml = fs.readFileSync(yamlPath, 'utf-8');

// Split by tool blocks starting with "- id: "
const sections = rawYaml.split(/(?=\n- id: )/);

let keptCount = 0;
let noindexedCount = 0;

const updatedSections = sections.map((sec) => {
  // If first section doesn't start with - id:, check if it has one
  const idMatch = sec.match(/- id:\s*([a-z0-9-]+)/);
  if (!idMatch) return sec;

  const toolId = idMatch[1];
  const isCategoryA = CATEGORY_A_IDS.has(toolId);

  if (isCategoryA) {
    keptCount++;
    return sec.replace(/\n\s*indexable:\s*(true|false)/, '\n  indexable: true');
  } else {
    noindexedCount++;
    return sec.replace(/\n\s*indexable:\s*(true|false)/, '\n  indexable: false');
  }
});

fs.writeFileSync(yamlPath, updatedSections.join(''), 'utf-8');

console.log(`[Scope Updated in tools.yaml]`);
console.log(`  ✓ Category A (indexable: true): ${keptCount} tools`);
console.log(`  ✓ Category B (indexable: false): ${noindexedCount} tools`);
