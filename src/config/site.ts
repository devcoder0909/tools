export const siteConfig = {
  brand: 'Best Converter',
  domain: 'app.gudmud.in',
  company: 'Gudmud',
  contactEmail: 'support@gudmud.in',
  url: 'https://app.gudmud.in',
  tagline: 'Free, Private In-Browser Converters & Calculators',
  description: 'Fast, private, client-side tools and converters. Your files never leave your device.',
  analytics: {
    enabled: false,
    cloudflareToken: '', // Cloudflare Web Analytics token
  },
  searchConsoleMeta: '', // e.g., google-site-verification content
  bingMeta: '',
};

export type SiteConfig = typeof siteConfig;
