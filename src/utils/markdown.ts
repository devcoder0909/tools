/**
 * Robust markdown to semantic HTML parser for tool content guides.
 * Renders tables, lists, images, headings, blockquotes, code, and links cleanly.
 */

export function renderToolMarkdown(rawMarkdown: string): string {
  // Strip YAML frontmatter
  let text = rawMarkdown.replace(/^---[\s\S]*?---\s*/, '');
  // Strip duplicate FAQ section if present in markdown (handled canonically by FAQ.astro)
  text = text.replace(/## (?:Frequently Asked Questions|FAQ)[\s\S]*$/i, '').trim();

  const lines = text.split(/\r?\n/);
  const output: string[] = [];
  let inUl = false;
  let inOl = false;
  let inTable = false;
  let inSection = false;
  let tableRows: string[][] = [];

  function closeLists(): string {
    let res = '';
    if (inUl) {
      res += '</ul>\n';
      inUl = false;
    }
    if (inOl) {
      res += '</ol>\n';
      inOl = false;
    }
    return res;
  }

  function startSection(): string {
    let res = '';
    if (inSection) {
      res += '</section>\n';
    }
    inSection = true;
    res += '<section class="space-y-4">\n';
    return res;
  }

  function closeAll(): string {
    let res = closeLists();
    res += closeTable();
    if (inSection) {
      res += '</section>\n';
      inSection = false;
    }
    return res;
  }

  function closeTable(): string {
    if (!inTable) return '';
    inTable = false;
    if (tableRows.length === 0) return '';
    
    const headers = tableRows[0];
    const dataRows = tableRows.slice(1);
    
    let html = '<div class="my-6 overflow-x-auto rounded-2xl border border-gray-200 shadow-2xs">\n';
    html += '  <table class="w-full text-left text-xs sm:text-sm border-collapse bg-white">\n';
    html += '    <thead>\n      <tr class="bg-gray-50 border-b border-gray-200 text-gray-900 font-bold">\n';
    for (const h of headers) {
      html += `        <th class="p-3 sm:p-4">${formatInline(h)}</th>\n`;
    }
    html += '      </tr>\n    </thead>\n    <tbody>\n';
    for (const row of dataRows) {
      html += '      <tr class="border-b border-gray-100 hover:bg-gray-50/50 transition">\n';
      for (const cell of row) {
        html += `        <td class="p-3 sm:p-4 text-gray-700">${formatInline(cell)}</td>\n`;
      }
      html += '      </tr>\n';
    }
    html += '    </tbody>\n  </table>\n</div>\n';
    tableRows = [];
    return html;
  }

  function formatInline(s: string): string {
    return s
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/`([^`]+)`/g, '<code class="px-1.5 py-0.5 rounded bg-gray-100 text-gray-800 text-xs font-mono">$1</code>')
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="text-emerald-600 hover:underline font-medium">$1</a>');
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const stripped = line.trim();

    // Table row detection
    if (stripped.startsWith('|') && stripped.endsWith('|')) {
      const cells = stripped
        .slice(1, -1)
        .split('|')
        .map((c) => c.trim());
      
      // Check if separator line e.g. |:---|:---|
      if (cells.every((c) => /^:?-+:?$/.test(c))) {
        continue;
      }
      if (!inTable) {
        output.push(closeLists());
        inTable = true;
      }
      tableRows.push(cells);
      continue;
    } else if (inTable) {
      output.push(closeTable());
    }

    if (!stripped) {
      output.push(closeLists());
      continue;
    }

    if (stripped === '---') {
      output.push(closeLists());
      output.push('<hr class="my-8 border-gray-200" />');
      continue;
    }

    // Markdown Image detection ![alt](url)
    const imgMatch = stripped.match(/^!\[(.*?)\]\((.*?)\)$/);
    if (imgMatch) {
      output.push(closeLists());
      const alt = imgMatch[1];
      const src = imgMatch[2];
      output.push(
        `<figure class="my-8">` +
        `<img src="${src}" alt="${alt}" width="800" height="450" class="rounded-2xl border border-gray-200 shadow-xs max-w-full h-auto mx-auto" loading="lazy" decoding="async" />` +
        `<figcaption class="text-xs text-gray-500 mt-2 text-center font-medium">${alt}</figcaption>` +
        `</figure>`
      );
      continue;
    }

    // Headings (ensure no H1 inside content body for strict 1-H1 quality gate)
    if (stripped.startsWith('#### ')) {
      output.push(closeLists());
      output.push(`<h4 class="text-base font-semibold text-gray-900 mt-6 mb-2">${formatInline(stripped.slice(5))}</h4>`);
      continue;
    }
    if (stripped.startsWith('### ')) {
      output.push(closeLists());
      output.push(closeTable());
      output.push(startSection());
      output.push(`<h3 class="text-lg sm:text-xl font-bold text-gray-900 mt-8 mb-3">${formatInline(stripped.slice(4))}</h3>`);
      continue;
    }
    if (stripped.startsWith('## ') || stripped.startsWith('# ')) {
      output.push(closeLists());
      output.push(closeTable());
      output.push(startSection());
      const heading = stripped.startsWith('## ') ? stripped.slice(3) : stripped.slice(2);
      output.push(`<h2 class="text-xl sm:text-2xl font-bold text-gray-900 mt-10 mb-4">${formatInline(heading)}</h2>`);
      continue;
    }

    if (!inSection) {
      output.push(startSection());
    }

    // Blockquote
    if (stripped.startsWith('> ')) {
      output.push(closeLists());
      output.push(`<blockquote class="p-4 my-4 border-l-4 border-emerald-500 bg-emerald-50/50 rounded-r-xl text-gray-700 italic text-sm">${formatInline(stripped.slice(2))}</blockquote>`);
      continue;
    }

    // Unordered list
    if (stripped.startsWith('- ') || stripped.startsWith('* ')) {
      if (inOl) output.push(closeLists());
      if (!inUl) {
        output.push('<ul class="list-disc pl-5 space-y-2 my-4 text-gray-700 leading-relaxed">');
        inUl = true;
      }
      output.push(`  <li>${formatInline(stripped.slice(2))}</li>`);
      continue;
    }

    // Ordered list
    const olMatch = stripped.match(/^(\d+)\.\s+(.*)$/);
    if (olMatch) {
      if (inUl) output.push(closeLists());
      if (!inOl) {
        output.push('<ol class="list-decimal pl-5 space-y-2 my-4 text-gray-700 leading-relaxed">');
        inOl = true;
      }
      output.push(`  <li>${formatInline(olMatch[2])}</li>`);
      continue;
    }

    // Regular paragraph
    output.push(closeLists());
    output.push(`<p class="mb-4 text-gray-700 leading-relaxed">${formatInline(stripped)}</p>`);
  }

  output.push(closeAll());

  return output.filter(Boolean).join('\n');
}
