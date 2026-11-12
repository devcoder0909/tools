import fs from 'node:fs';
import path from 'node:path';
import { getToolBySlug } from '../src/registry';

const slug = process.argv[2];

if (!slug) {
  console.error('Usage: tsx scripts/content-scaffold.ts <tool-slug>');
  process.exit(1);
}

const tool = getToolBySlug(slug);
if (!tool) {
  console.error(`Error: Tool "${slug}" not found in tools.yaml registry.`);
  process.exit(1);
}

const targetPath = path.resolve(process.cwd(), tool.content);

if (fs.existsSync(targetPath)) {
  console.warn(`File ${targetPath} already exists. Skipping scaffolding to prevent accidental overwrite.`);
  process.exit(0);
}

const template = `---
title: "${tool.title}"
description: "${tool.description}"
last_reviewed: "${new Date().toISOString().split('T')[0]}"
reviewed: false
---

## How to Use ${tool.name} Online

1. **Select or Drop Files:** Click the file selection area or drag your files directly into the browser.
2. **Configure Settings:** Choose your preferred quality, scale, or conversion parameters.
3. **Run In-Browser Processing:** The tool converts your files locally inside browser memory.
4. **Download Instantly:** Save your converted file individually or as a complete ZIP bundle.

### Mobile & Device Instructions
- **On iOS / Safari:** Tap Choose Files and pick directly from your Photo Library or Files app.
- **On Android / Chrome:** Open the browser, select the file from your local storage, and tap download.

---

## Technical Details & Format Trade-offs

<!-- SCAFFOLD_SECTION_START: Provide at least 300 words of unique factual content regarding ${tool.from || 'input'} and ${tool.to || 'output'} formats -->
[CONTENT_PLACEHOLDER: Add 300+ words of unique, non-templated text covering compression algorithms, color depth, software compatibility, and trade-offs.]
<!-- SCAFFOLD_SECTION_END -->

---

## Zero-Upload Privacy Guarantee

${tool.name} runs entirely on your local machine using modern web standards (HTML5 Canvas, Web Workers, and WebAssembly). Your files are never transferred across the network or stored on remote cloud servers. You can independently confirm this by observing the browser Network tab.
`;

fs.mkdirSync(path.dirname(targetPath), { recursive: true });
fs.writeFileSync(targetPath, template, 'utf-8');
console.log(`[Scaffold] Created content skeleton at: ${targetPath}`);
