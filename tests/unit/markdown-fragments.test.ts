import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { renderToolMarkdown, type ArticleHeading } from '../../src/utils/markdown';

describe('tool article fragments', () => {
  it('assigns repeatable unique IDs and reports only visible top-level questions', () => {
    const questions: ArticleHeading[] = [];
    const markdown = '## **Cost**?\n### Cost?\n## Cost 2\n## !!!\n## ¿Cuánto?\n## FAQ\n## Invisible?';
    const html = renderToolMarkdown(markdown, 'Calculator', entry => questions.push(entry));
    const ids = [...html.matchAll(/ id="([^"]+)"/g)].map(match => match[1]);
    expect(ids).toEqual(['article-cost', 'article-cost-2', 'article-cost-2-2', 'article-section', 'article-cuánto']);
    expect(questions).toEqual([{ id: 'article-cost', text: 'Cost?' }, { id: 'article-cuánto', text: '¿Cuánto?' }]);
    expect(renderToolMarkdown(markdown, 'Calculator')).toBe(html);
    expect(renderToolMarkdown(markdown)).not.toContain(' id=');
  });

  it('resolves every calculator directory article link to a single rendered heading', () => {
    const directory = readFileSync('src/pages/calculators/index.astro', 'utf8');
    const links = [...directory.matchAll(/href="\/([^/]+)\/#(article-[^"]+)"/g)];
    expect(links.length).toBeGreaterThanOrEqual(3);
    for (const [, tool, fragment] of links) {
      const source = readFileSync(`src/content/tools/${tool}.mdx`, 'utf8');
      expect(renderToolMarkdown(source, tool).split(` id="${fragment}"`)).toHaveLength(2);
    }
  });
});
