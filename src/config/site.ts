export const siteConfig = {
  brand: 'ZixTool',
  domain: 'zixtool.online',
  company: 'ZixTool',
  contactEmail: 'support@zixtool.online',
  url: 'https://zixtool.online',
  tagline: 'Free, Private In-Browser Converters & Calculators',
  description: 'Fast, private, client-side tools and converters. Your files never leave your device.',
  analytics: {
    enabled: false,
    cloudflareToken: '', // Cloudflare Web Analytics token
  },
  searchConsoleMeta: 'YKQYg_apmaUFFYmr3P6uuQER61QPzEG7l8pMycSAW8o', // e.g., google-site-verification content
  bingMeta: '',
};

export type SiteConfig = typeof siteConfig;
