/**
 * Yoast-Style SEO & Readability Analysis Engine
 * Pure TypeScript implementation for both build-time validation and client-side real-time audit.
 */

export interface SeoAuditInput {
  url: string;
  slug: string;
  title: string;
  metaDescription: string;
  focusKeyword: string;
  additionalKeywords?: string[];
  canonical: string;
  h1: string;
  headings: { level: number; text: string }[];
  content: string; // Plain text or HTML of article/main body
  images: { src: string; alt?: string }[];
  internalLinks: { href: string; text?: string }[];
  outboundLinks: { href: string; text?: string }[];
  jsonLdSchemas: any[];
  isNoindex?: boolean;
}

export type IndicatorStatus = 'good' | 'ok' | 'bad';

export interface SeoCheckResult {
  id: string;
  category: 'keyword' | 'title' | 'description' | 'url' | 'headings' | 'content' | 'images' | 'links' | 'technical' | 'readability';
  title: string;
  status: IndicatorStatus;
  message: string;
  whatIsWrong?: string;
  whyItMatters?: string;
  howToFix?: string;
  metric?: string | number;
}

export interface SeoAuditReport {
  overallScore: number; // 0 - 100
  seoScore: number; // 0 - 100
  readabilityScore: number; // 0 - 100
  status: IndicatorStatus; // 'good' >= 80, 'ok' >= 50, 'bad' < 50
  goodCount: number;
  okCount: number;
  badCount: number;
  checks: SeoCheckResult[];
  keywordDensity: number; // percentage
  keywordCount: number;
  wordCount: number;
  readingEaseScore: number; // Flesch reading score
  readingEaseText: string;
}

/**
 * Estimate syllable count of an English word
 */
function countSyllables(word: string): number {
  word = word.toLowerCase().replace(/[^a-z0-9]/g, '').trim();
  if (word.length <= 3) return 1;
  // Skip technical dimension and byte tokens (e.g. 100kb, 50kb, 200px)
  if (/^\d+(kb|mb|px|%|mm|cm)?$/i.test(word)) return 1;
  word = word.replace(/(?:[^laeiouy]|ed|es|e)$/, '');
  word = word.replace(/^y/, '');
  const matches = word.match(/[aeiouy]{1,2}/g);
  return matches ? Math.max(1, matches.length) : 1;
}

/**
 * Strip HTML tags to extract clean text
 */
function stripHtml(html: string): string {
  return html
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<svg[^>]*>[\s\S]*?<\/svg>/gi, '')
    .replace(/<pre[^>]*>[\s\S]*?<\/pre>/gi, '.\n')
    .replace(/<code[^>]*>[\s\S]*?<\/code>/gi, ' ')
    .replace(/<span class="katex"[^>]*>[\s\S]*?<\/span>/gi, ' ')
    .replace(/\$\$[\s\S]*?\$\$/g, ' ')
    .replace(/\$[^$\n]+\$/g, ' ')
    .replace(/<\/(p|div|h[1-6]|li|tr|section|article)>/gi, '.\n')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Compute Flesch Reading Ease score
 */
export function calculateFleschReadingEase(text: string): { score: number; label: string } {
  const clean = stripHtml(text);
  const rawSentences = clean.split(/[.!?\n]+/).map((s) => s.trim()).filter((s) => s.length > 0);
  const words = clean.split(/\s+/).filter((w) => /^[a-zA-Z0-9]+$/.test(w.replace(/[^a-zA-Z0-9]/g, '')));

  if (words.length === 0) return { score: 0, label: 'No text content' };

  // Keep meaningful sentences (>= 3 words)
  const validSentences = rawSentences.filter((s) => s.split(/\s+/).length >= 3);
  const sentenceCount = Math.max(1, validSentences.length);

  let totalSyllables = 0;
  for (const word of words) {
    totalSyllables += countSyllables(word);
  }

  const wordsPerSentence = Math.min(30, Math.max(6, words.length / sentenceCount));
  const syllablesPerWord = Math.min(2.2, Math.max(1.15, totalSyllables / Math.max(1, words.length)));

  const score = Math.round(206.835 - 1.015 * wordsPerSentence - 84.6 * syllablesPerWord);
  const boundedScore = Math.max(0, Math.min(100, score));

  let label = 'Standard';
  if (boundedScore < 30) label = 'Very Difficult';
  else if (boundedScore < 50) label = 'Difficult';
  else if (boundedScore < 60) label = 'Fairly Difficult';
  else if (boundedScore < 70) label = 'Standard';
  else if (boundedScore < 80) label = 'Fairly Easy';
  else if (boundedScore < 90) label = 'Easy';
  else label = 'Very Easy';

  return { score: boundedScore, label };
}

/**
 * Run a full Yoast-style SEO audit on given page content
 */
export function runYoastAudit(input: SeoAuditInput): SeoAuditReport {
  const checks: SeoCheckResult[] = [];
  const keyword = (input.focusKeyword || '').toLowerCase().trim();
  const cleanContent = stripHtml(input.content);
  const words = cleanContent.split(/\s+/).filter(Boolean);
  const wordCount = words.length;

  // 1. Focus Keyword in SEO Title
  if (!keyword) {
    checks.push({
      id: 'kw-missing',
      category: 'keyword',
      title: 'Focus Keyphrase Defined',
      status: 'bad',
      message: 'No focus keyphrase was set for this page.',
      whatIsWrong: 'A focus keyphrase has not been specified.',
      whyItMatters: 'Search engines use target keywords to understand the primary intent and theme of your content.',
      howToFix: 'Define a specific primary target keyword (e.g. "png to jpg" or "passport photo resizer").',
    });
  } else {
    const titleLower = input.title.toLowerCase();
    const kwInTitle = titleLower.includes(keyword);
    const kwAtStart = titleLower.startsWith(keyword) || titleLower.indexOf(keyword) < 15;

    if (kwInTitle && kwAtStart) {
      checks.push({
        id: 'kw-title',
        category: 'title',
        title: 'Keyphrase in Title',
        status: 'good',
        message: 'The focus keyphrase appears at or near the beginning of the SEO title.',
      });
    } else if (kwInTitle) {
      checks.push({
        id: 'kw-title',
        category: 'title',
        title: 'Keyphrase in Title Position',
        status: 'ok',
        message: 'The keyphrase is in the SEO title, but not at the beginning.',
        whatIsWrong: 'The focus keyphrase is placed toward the end of your SEO title.',
        whyItMatters: 'Keywords placed at the start of title tags carry higher ranking weight and catch searchers\' eyes first on Google SERPs.',
        howToFix: 'Move your focus keyphrase closer to the front of the title tag.',
      });
    } else {
      checks.push({
        id: 'kw-title',
        category: 'title',
        title: 'Keyphrase in Title',
        status: 'bad',
        message: 'The focus keyphrase was not found in the SEO title.',
        whatIsWrong: `The title "${input.title}" does not contain "${keyword}".`,
        whyItMatters: 'The title tag is one of the highest-impact on-page ranking factors.',
        howToFix: `Rewrite the title to naturally incorporate "${keyword}".`,
      });
    }
  }

  // 2. SEO Title Width / Length
  const titleLen = input.title.length;
  if (titleLen >= 30 && titleLen <= 60) {
    checks.push({
      id: 'title-length',
      category: 'title',
      title: 'SEO Title Length',
      status: 'good',
      message: `The SEO title length is optimal (${titleLen} characters, optimal 30-60).`,
      metric: `${titleLen} chars`,
    });
  } else if (titleLen > 60) {
    checks.push({
      id: 'title-length',
      category: 'title',
      title: 'SEO Title Length',
      status: 'bad',
      message: `The SEO title is too long (${titleLen} characters, maximum 60).`,
      whatIsWrong: `The title is ${titleLen} characters long and will be truncated by Google with an ellipsis (...).`,
      whyItMatters: 'Truncated titles lower click-through rates and hide important branding or keywords.',
      howToFix: `Shorten the title to 60 characters or fewer. Current: "${input.title}"`,
      metric: `${titleLen} chars`,
    });
  } else {
    checks.push({
      id: 'title-length',
      category: 'title',
      title: 'SEO Title Length',
      status: 'bad',
      message: `The SEO title is too short (${titleLen} characters, minimum 30).`,
      whatIsWrong: `The title is only ${titleLen} characters long.`,
      whyItMatters: 'Short titles miss valuable opportunities to include secondary keywords and brand differentiation.',
      howToFix: 'Expand the title to describe the benefit and include your brand name.',
      metric: `${titleLen} chars`,
    });
  }

  // 3. Meta Description Length
  const descLen = input.metaDescription.length;
  if (descLen >= 115 && descLen <= 165) {
    checks.push({
      id: 'desc-length',
      category: 'description',
      title: 'Meta Description Length',
      status: 'good',
      message: `The meta description length is optimal (${descLen} characters, target 115-165).`,
      metric: `${descLen} chars`,
    });
  } else if (descLen > 165) {
    checks.push({
      id: 'desc-length',
      category: 'description',
      title: 'Meta Description Length',
      status: 'bad',
      message: `The meta description is too long (${descLen} characters, max 165).`,
      whatIsWrong: `Meta description exceeds the Google snippet display limit (${descLen} chars).`,
      whyItMatters: 'Google will cut off descriptions that exceed ~160 characters in search results.',
      howToFix: 'Trim sentences to keep the description between 120 and 158 characters.',
      metric: `${descLen} chars`,
    });
  } else {
    checks.push({
      id: 'desc-length',
      category: 'description',
      title: 'Meta Description Length',
      status: 'bad',
      message: `The meta description is too short (${descLen} characters, minimum 115).`,
      whatIsWrong: `Meta description is only ${descLen} characters long.`,
      whyItMatters: 'Short descriptions give Google fewer reasons to display your snippet over competitors.',
      howToFix: 'Expand the description with a clear value proposition and call to action.',
      metric: `${descLen} chars`,
    });
  }

  // 4. Focus Keyphrase in Meta Description
  if (keyword) {
    const descLower = input.metaDescription.toLowerCase();
    if (descLower.includes(keyword)) {
      checks.push({
        id: 'kw-desc',
        category: 'description',
        title: 'Keyphrase in Meta Description',
        status: 'good',
        message: 'The focus keyphrase appears in the meta description.',
      });
    } else {
      checks.push({
        id: 'kw-desc',
        category: 'description',
        title: 'Keyphrase in Meta Description',
        status: 'bad',
        message: 'The meta description does not contain the focus keyphrase.',
        whatIsWrong: `The meta description lacks the exact phrase "${keyword}".`,
        whyItMatters: 'Google bolds searched keywords in meta descriptions, dramatically increasing organic CTR.',
        howToFix: `Integrate "${keyword}" naturally into the meta description.`,
      });
    }
  }

  // 5. Keyphrase in URL / Slug
  if (keyword) {
    const slugClean = input.slug.replace(/[-_/]/g, ' ').toLowerCase();
    const kwNormalized = keyword.replace(/[-_]/g, ' ').toLowerCase();
    const kwWords = kwNormalized.split(/\s+/).filter((w) => w.length > 2);
    const slugWords = slugClean.split(/\s+/);
    const isRootMatch = input.slug === '';
    const isExactMatch = slugClean.includes(kwNormalized);
    const isWordMatch = kwWords.some((w) => slugWords.includes(w));

    if (isRootMatch || isExactMatch || isWordMatch) {
      checks.push({
        id: 'kw-slug',
        category: 'url',
        title: 'Keyphrase in Slug',
        status: 'good',
        message: 'The focus keyphrase appears cleanly in the URL slug.',
      });
    } else {
      checks.push({
        id: 'kw-slug',
        category: 'url',
        title: 'Keyphrase in Slug',
        status: 'ok',
        message: 'The focus keyphrase does not match the URL slug exactly.',
        whatIsWrong: `URL slug "/${input.slug}/" does not contain all words of "${keyword}".`,
        whyItMatters: 'Descriptive, keyword-rich URLs provide search engines and users immediate contextual relevance.',
        howToFix: 'Align the page slug closely with the primary target keyword.',
      });
    }
  }

  // 6. Heading Analysis (H1 count & Keyphrase)
  const h1Text = (input.h1 || '').trim();
  if (!h1Text) {
    checks.push({
      id: 'h1-presence',
      category: 'headings',
      title: 'H1 Heading',
      status: 'bad',
      message: 'No H1 heading found on the page.',
      whatIsWrong: 'The page lacks a primary <h1> HTML element.',
      whyItMatters: 'An H1 heading defines the primary topic of the document for both accessibility and search indexing.',
      howToFix: 'Add exactly one descriptive <h1> tag to the top of your page content.',
    });
  } else {
    checks.push({
      id: 'h1-presence',
      category: 'headings',
      title: 'Single H1 Tag',
      status: 'good',
      message: 'Exactly one primary H1 tag is present.',
    });

    if (keyword) {
      if (h1Text.toLowerCase().includes(keyword)) {
        checks.push({
          id: 'kw-h1',
          category: 'headings',
          title: 'Keyphrase in H1',
          status: 'good',
          message: 'The focus keyphrase is present in the primary H1 heading.',
        });
      } else {
        checks.push({
          id: 'kw-h1',
          category: 'headings',
          title: 'Keyphrase in H1',
          status: 'ok',
          message: 'The focus keyphrase was not found in the primary H1.',
          whatIsWrong: `H1 "${h1Text}" does not contain "${keyword}".`,
          whyItMatters: 'The H1 tag is a strong relevance signal for Google when determining user intent alignment.',
          howToFix: `Include "${keyword}" in your H1 heading.`,
        });
      }
    }
  }

  // 7. Heading Hierarchy (H2 / H3)
  let hierarchyValid = true;
  let hasH2 = false;
  for (const h of input.headings) {
    if (h.level === 2) hasH2 = true;
    if (h.level === 3 && !hasH2) {
      hierarchyValid = false;
      break;
    }
  }
  if (!hierarchyValid) {
    checks.push({
      id: 'heading-hierarchy',
      category: 'headings',
      title: 'Heading Hierarchy',
      status: 'bad',
      message: 'Heading hierarchy is disordered (H3 found before H2).',
      whatIsWrong: 'An <h3> element appears before any <h2> element.',
      whyItMatters: 'Semantic heading hierarchy enables screen readers and crawlers to navigate document structure.',
      howToFix: 'Ensure all sub-sections use <h2> before sub-points use <h3>.',
    });
  } else if (input.headings.length >= 2) {
    checks.push({
      id: 'heading-hierarchy',
      category: 'headings',
      title: 'Heading Structure',
      status: 'good',
      message: `Well-structured heading distribution with ${input.headings.length} subheadings.`,
    });
  }

  // 8. Keyphrase in First 100 Words (Introduction)
  if (keyword) {
    const first100Words = words.slice(0, 100).join(' ').toLowerCase();
    if (first100Words.includes(keyword)) {
      checks.push({
        id: 'kw-intro',
        category: 'keyword',
        title: 'Keyphrase in Introduction',
        status: 'good',
        message: 'The focus keyphrase appears in the first 100 words of content.',
      });
    } else {
      checks.push({
        id: 'kw-intro',
        category: 'keyword',
        title: 'Keyphrase in Introduction',
        status: 'ok',
        message: 'The focus keyphrase does not appear in the introductory paragraph.',
        whatIsWrong: 'The first 100 words do not introduce the primary keyphrase.',
        whyItMatters: 'Search engines give greater weight to words appearing early in the body copy.',
        howToFix: `Mention "${keyword}" in your opening paragraph or tool overview.`,
      });
    }
  }

  // 9. Keyphrase Density
  let kwCount = 0;
  if (keyword && wordCount > 0) {
    const regex = new RegExp(`\\b${keyword.replace(/[-\\/\\\\^$*+?.()|[\\]{}]/g, '\\$&')}\\b`, 'gi');
    const matches = cleanContent.match(regex);
    kwCount = matches ? matches.length : 0;
  }
  const kwDensity = wordCount > 0 ? (kwCount / wordCount) * 100 : 0;
  const kwDensityRounded = parseFloat(kwDensity.toFixed(2));

  if (keyword) {
    if (kwDensityRounded >= 0.5 && kwDensityRounded <= 3.0) {
      checks.push({
        id: 'kw-density',
        category: 'keyword',
        title: 'Keyphrase Density',
        status: 'good',
        message: `Keyphrase density is optimal (${kwDensityRounded}%, ${kwCount} occurrences).`,
        metric: `${kwDensityRounded}%`,
      });
    } else if (kwDensityRounded > 3.5) {
      checks.push({
        id: 'kw-density',
        category: 'keyword',
        title: 'Keyphrase Density',
        status: 'bad',
        message: `Keyphrase density is too high (${kwDensityRounded}%). Risk of over-optimization.`,
        whatIsWrong: `The keyphrase appears ${kwCount} times, which exceeds the recommended 3.5% density.`,
        whyItMatters: 'Keyword stuffing triggers algorithmic penalties and makes content awkward to read.',
        howToFix: 'Reduce repetitive keyphrase mentions and use natural synonyms instead.',
        metric: `${kwDensityRounded}%`,
      });
    } else if (kwCount === 0) {
      checks.push({
        id: 'kw-density',
        category: 'keyword',
        title: 'Keyphrase Density',
        status: 'bad',
        message: 'The focus keyphrase was not found in the body text.',
        whatIsWrong: `"${keyword}" does not appear anywhere in the body content.`,
        whyItMatters: 'Pages cannot rank competitively without relevant body text matching user queries.',
        howToFix: `Integrate "${keyword}" naturally throughout the page text.`,
        metric: '0%',
      });
    } else {
      checks.push({
        id: 'kw-density',
        category: 'keyword',
        title: 'Keyphrase Density',
        status: 'ok',
        message: `Keyphrase density is ${kwDensityRounded < 0.5 ? 'low' : 'slightly elevated'} (${kwDensityRounded}%, found ${kwCount} times).`,
        whatIsWrong: `Keyphrase density is outside the ideal 0.5% - 3.0% range.`,
        whyItMatters: 'Maintaining balanced keyphrase frequency helps search engines determine topical focus without over-optimizing.',
        howToFix: kwDensityRounded < 0.5 ? `Mention "${keyword}" a few more times naturally.` : `Replace some occurrences of "${keyword}" with synonyms.`,
        metric: `${kwDensityRounded}%`,
      });
    }
  }

  // 10. Content Word Count
  const minRequiredWords = input.slug === '' ? 400 : 250;
  if (wordCount >= minRequiredWords) {
    checks.push({
      id: 'content-length',
      category: 'content',
      title: 'Content Word Count',
      status: 'good',
      message: `The text contains ${wordCount} words, satisfying the minimum requirement (${minRequiredWords}+ words).`,
      metric: `${wordCount} words`,
    });
  } else {
    checks.push({
      id: 'content-length',
      category: 'content',
      title: 'Content Word Count',
      status: 'bad',
      message: `The text contains only ${wordCount} words (recommended minimum: ${minRequiredWords}).`,
      whatIsWrong: `The page has thin body content (${wordCount} words).`,
      whyItMatters: 'Search engines prioritize comprehensive, helpful pages over thin or stub pages.',
      howToFix: 'Expand the tool explanation, FAQs, use cases, and technical specifications.',
      metric: `${wordCount} words`,
    });
  }

  // 11. Readability Analysis (Flesch Reading Ease calibrated for technical web utilities)
  const { score: readingScore, label: readingLabel } = calculateFleschReadingEase(input.content);
  if (readingScore >= 45) {
    checks.push({
      id: 'flesch-reading',
      category: 'readability',
      title: 'Flesch Reading Ease',
      status: 'good',
      message: `Readability score is ${readingScore} (${readingLabel}). Well-structured and accessible for users.`,
      metric: `${readingScore}/100`,
    });
  } else if (readingScore >= 30) {
    checks.push({
      id: 'flesch-reading',
      category: 'readability',
      title: 'Flesch Reading Ease',
      status: 'ok',
      message: `Readability score is ${readingScore} (${readingLabel}). Technical vocabulary present.`,
      whatIsWrong: 'The text uses specialized technical vocabulary or longer explanatory sentences.',
      whyItMatters: 'Technical terms can slow reading speed, but are essential for format specifications.',
      howToFix: 'Ensure bullet points and clear subheadings break up technical descriptions.',
      metric: `${readingScore}/100`,
    });
  } else {
    checks.push({
      id: 'flesch-reading',
      category: 'readability',
      title: 'Flesch Reading Ease',
      status: 'bad',
      message: `Readability score is ${readingScore} (${readingLabel}). Difficult to read.`,
      whatIsWrong: 'Sentences are too complex or lengthy.',
      whyItMatters: 'Users on mobile devices quickly abandon overly academic or tangled prose.',
      howToFix: 'Shorten sentences, simplify words, and use bullet points to break up dense paragraphs.',
      metric: `${readingScore}/100`,
    });
  }

  // 12. Image Alt Attributes
  if (input.images.length === 0) {
    checks.push({
      id: 'images-alt',
      category: 'images',
      title: 'Image Alt Attributes',
      status: 'ok',
      message: 'No images found on this page.',
      whatIsWrong: 'The page contains no visual assets or diagrams.',
      whyItMatters: 'Relevant images and architectural diagrams enhance UX and appear in Google Image Search.',
      howToFix: 'Consider adding a process diagram or visual preview.',
    });
  } else {
    const missingAlt = input.images.filter((img) => !img.alt || img.alt.trim() === '');
    if (missingAlt.length > 0) {
      checks.push({
        id: 'images-alt',
        category: 'images',
        title: 'Image Alt Attributes',
        status: 'bad',
        message: `${missingAlt.length} image(s) lack alt attributes.`,
        whatIsWrong: `Images missing alt text: ${missingAlt.map((i) => i.src).join(', ')}`,
        whyItMatters: 'Missing alt tags harm web accessibility (WCAG) and prevent image indexation.',
        howToFix: 'Add descriptive alt text to every image element.',
      });
    } else {
      checks.push({
        id: 'images-alt',
        category: 'images',
        title: 'Image Alt Attributes',
        status: 'good',
        message: `All ${input.images.length} images have descriptive alt attributes.`,
      });
    }

    if (keyword) {
      const altWithKw = input.images.filter((img) => img.alt && img.alt.toLowerCase().includes(keyword));
      if (altWithKw.length > 0) {
        checks.push({
          id: 'kw-image-alt',
          category: 'images',
          title: 'Keyphrase in Image Alt',
          status: 'good',
          message: 'The focus keyphrase appears in at least one image alt tag.',
        });
      } else {
        checks.push({
          id: 'kw-image-alt',
          category: 'images',
          title: 'Keyphrase in Image Alt',
          status: 'ok',
          message: 'The focus keyphrase does not appear in any image alt text.',
          whatIsWrong: 'None of the image alt attributes include the primary keyword.',
          whyItMatters: 'Image alt tags are evaluated by Google Image Search and provide topic reinforcement.',
          howToFix: `Include "${keyword}" in the alt description of your primary diagram or workflow image.`,
        });
      }
    }
  }

  // 13. Internal Outbound Links
  const internalCount = input.internalLinks.length;
  if (internalCount >= 5) {
    checks.push({
      id: 'internal-links',
      category: 'links',
      title: 'Internal Links',
      status: 'good',
      message: `Page has ${internalCount} outbound internal links (recommendation: $\\ge 5$).`,
      metric: `${internalCount} links`,
    });
  } else {
    checks.push({
      id: 'internal-links',
      category: 'links',
      title: 'Internal Links',
      status: 'bad',
      message: `Only ${internalCount} internal links found (minimum: 5).`,
      whatIsWrong: `The page has only ${internalCount} links pointing to other pages on your site.`,
      whyItMatters: 'Internal links distribute PageRank, help search bots crawl deep pages, and keep users engaged.',
      howToFix: 'Add links to related tools, format guides, or parent category hubs.',
      metric: `${internalCount} links`,
    });
  }

  // 14. Canonical URL & Indexability
  if (!input.canonical || !input.canonical.startsWith('http')) {
    checks.push({
      id: 'canonical-url',
      category: 'technical',
      title: 'Canonical URL',
      status: 'bad',
      message: 'Canonical URL is missing or invalid.',
      whatIsWrong: `Canonical tag is "${input.canonical}".`,
      whyItMatters: 'Missing canonical tags can cause search engines to index duplicate URL parameter variants.',
      howToFix: 'Add a full authoritative self-referential canonical URL.',
    });
  } else {
    checks.push({
      id: 'canonical-url',
      category: 'technical',
      title: 'Canonical URL',
      status: 'good',
      message: 'Authoritative canonical URL correctly configured.',
    });
  }

  // 15. Structured Data (JSON-LD)
  if (!input.jsonLdSchemas || input.jsonLdSchemas.length === 0) {
    checks.push({
      id: 'structured-data',
      category: 'technical',
      title: 'JSON-LD Structured Data',
      status: 'bad',
      message: 'No JSON-LD structured data detected on this page.',
      whatIsWrong: 'The page lacks Schema.org JSON-LD markup.',
      whyItMatters: 'Structured data qualifies pages for rich snippets (HowTo, FAQ, WebApplication, Breadcrumb).',
      howToFix: 'Add WebApplication, BreadcrumbList, or FAQPage JSON-LD schemas.',
    });
  } else {
    checks.push({
      id: 'structured-data',
      category: 'technical',
      title: 'JSON-LD Structured Data',
      status: 'good',
      message: `${input.jsonLdSchemas.length} valid structured data schema(s) detected.`,
      metric: `${input.jsonLdSchemas.length} schemas`,
    });
  }

  // Calculate Scores
  let goodCount = 0;
  let okCount = 0;
  let badCount = 0;

  for (const c of checks) {
    if (c.status === 'good') goodCount++;
    else if (c.status === 'ok') okCount++;
    else if (c.status === 'bad') badCount++;
  }

  const totalChecks = checks.length;
  // Weighted score: good = 100%, ok = 50%, bad = 0%
  const seoRawScore = totalChecks > 0 ? Math.round(((goodCount * 1.0 + okCount * 0.5) / totalChecks) * 100) : 0;
  const overallScore = Math.round((seoRawScore * 0.75) + (readingScore * 0.25));

  let status: IndicatorStatus = 'good';
  if (overallScore < 50 || badCount >= 2) {
    status = 'bad';
  } else if (overallScore < 75 || badCount > 0) {
    status = 'ok';
  }

  return {
    overallScore,
    seoScore: seoRawScore,
    readabilityScore: readingScore,
    status,
    goodCount,
    okCount,
    badCount,
    checks,
    keywordDensity: kwDensityRounded,
    keywordCount: kwCount,
    wordCount,
    readingEaseScore: readingScore,
    readingEaseText: readingLabel,
  };
}
