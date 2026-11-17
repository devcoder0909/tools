import { siteConfig } from '../config/site';

export interface PageSeoInput {
  title: string;
  description: string;
  canonical?: string;
  focusKeyword?: string;
  additionalKeywords?: string[];
  noindex?: boolean;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  twitterCard?: 'summary' | 'summary_large_image';
  type?: 'website' | 'article';
  schemaType?: string;
  breadcrumbs?: { name: string; href: string }[];
  jsonLd?: Record<string, any> | Record<string, any>[];
}

export interface ResolvedSeoMetadata {
  title: string;
  metaTitle: string;
  description: string;
  canonical: string;
  noindex: boolean;
  robotsContent: string;
  ogType: string;
  ogTitle: string;
  ogDescription: string;
  ogImage: string;
  ogUrl: string;
  twitterCard: string;
  twitterTitle: string;
  twitterDescription: string;
  twitterImage: string;
  jsonLdScripts: Record<string, any>[];
}

/**
 * Format and normalize page title to strictly satisfy 30-60 character SEO limits
 * while maintaining brand consistency.
 */
export function formatSeoTitle(rawTitle: string, brand: string = siteConfig.brand): string {
  let title = (rawTitle || '').trim();

  // If already includes brand, ensure it doesn't exceed 60 chars
  if (title.includes(brand)) {
    if (title.length > 60) {
      const pipeIndex = title.lastIndexOf(' | ');
      if (pipeIndex >= 30) {
        title = title.slice(0, pipeIndex).trim();
      }
      if (title.length > 60) {
        title = title.slice(0, 60).trim();
      }
    }
    return title;
  }

  // Brand is not yet included: try appending " | Brand"
  const candidate = `${title} | ${brand}`;
  if (candidate.length <= 60) {
    return candidate;
  }

  // If candidate is too long, see if title alone fits 30-60 chars
  if (title.length >= 30 && title.length <= 60) {
    return title;
  }

  // If title is longer than 60 chars, trim it
  if (title.length > 60) {
    return title.slice(0, 60).trim();
  }

  // If title is shorter than 30 chars, expand with a descriptive suffix
  if (title.length < 30) {
    const expanded = `${title} Online Free | ${brand}`;
    if (expanded.length <= 60) return expanded;
    return `${title} - ${brand}`;
  }

  return title;
}

/**
 * Format and normalize meta description to strictly satisfy 115-165 character range.
 */
export function formatSeoDescription(rawDesc: string, fallback: string = siteConfig.description): string {
  let desc = (rawDesc || fallback || '').trim().replace(/\s+/g, ' ');

  if (desc.length > 165) {
    // Truncate at word boundary
    const truncated = desc.slice(0, 160);
    const lastSpace = truncated.lastIndexOf(' ');
    desc = lastSpace > 120 ? truncated.slice(0, lastSpace) + '...' : truncated + '...';
  }

  // Ensure minimum length
  if (desc.length < 115) {
    const supplement = ' Fast, 100% private in-browser tool with zero server uploads.';
    if (desc.length + supplement.length <= 165) {
      desc = `${desc}${supplement}`;
    }
  }

  return desc;
}

/**
 * Resolve full centralized SEO metadata with automatic sensible defaults
 */
export function resolvePageSeo(input: PageSeoInput, currentUrl?: URL | string): ResolvedSeoMetadata {
  const canonicalUrl = input.canonical
    ? input.canonical
    : currentUrl
      ? typeof currentUrl === 'string'
        ? currentUrl
        : currentUrl.href
      : siteConfig.url;

  const title = formatSeoTitle(input.title);
  const description = formatSeoDescription(input.description);
  const noindex = !!input.noindex;

  const robotsContent = noindex
    ? 'noindex, follow'
    : 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1';

  const ogTitle = input.ogTitle ? formatSeoTitle(input.ogTitle) : title;
  const ogDescription = input.ogDescription ? formatSeoDescription(input.ogDescription) : description;
  const ogImage = input.ogImage || `${siteConfig.url}/og-image.png`;
  const twitterCard = input.twitterCard || 'summary_large_image';

  // Structured data aggregation
  const jsonLdScripts: Record<string, any>[] = [];

  if (input.breadcrumbs && input.breadcrumbs.length > 0) {
    jsonLdScripts.push(buildBreadcrumbListSchema(input.breadcrumbs));
  }

  if (input.jsonLd) {
    if (Array.isArray(input.jsonLd)) {
      jsonLdScripts.push(...input.jsonLd);
    } else {
      jsonLdScripts.push(input.jsonLd);
    }
  }

  return {
    title,
    metaTitle: title,
    description,
    canonical: canonicalUrl,
    noindex,
    robotsContent,
    ogType: input.type || 'website',
    ogTitle,
    ogDescription,
    ogImage,
    ogUrl: canonicalUrl,
    twitterCard,
    twitterTitle: ogTitle,
    twitterDescription: ogDescription,
    twitterImage: ogImage,
    jsonLdScripts,
  };
}

/**
 * Generate BreadcrumbList JSON-LD Schema
 */
export function buildBreadcrumbListSchema(items: { name: string; href: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => {
      const fullUrl = item.href.startsWith('http')
        ? item.href
        : `${siteConfig.url}${item.href.startsWith('/') ? item.href : '/' + item.href}`;
      return {
        '@type': 'ListItem',
        position: index + 1,
        name: item.name,
        item: fullUrl,
      };
    }),
  };
}

/**
 * Generate WebApplication JSON-LD Schema
 */
export function buildWebApplicationSchema(tool: {
  title: string;
  slug: string;
  description: string;
  category?: string;
  keywords?: string[];
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: tool.title,
    url: `${siteConfig.url}/${tool.slug}/`,
    applicationCategory: tool.category || 'UtilitiesApplication',
    operatingSystem: 'All',
    browserRequirements: 'Requires JavaScript and HTML5 Canvas support',
    keywords: (tool.keywords || []).join(', '),
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
    },
    featureList: [
      '100% Client-Side Processing',
      'Zero Cloud Uploads',
      'Private in-browser computation',
      'Instant memory execution',
    ],
    description: tool.description,
  };
}

/**
 * Generate FAQPage JSON-LD Schema
 */
export function buildFaqSchema(faqs: { q: string; a: string }[]) {
  if (!faqs || faqs.length === 0) return null;
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.q,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.a,
      },
    })),
  };
}
