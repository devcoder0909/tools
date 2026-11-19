export interface NavItem {
  label: string;
  href: string;
}

export const mainNav: NavItem[] = [
  { label: 'All Tools', href: '/tools/' },
  { label: 'PDF Tools', href: '/tools/#pdf' },
  { label: 'Calculators', href: '/calculators/' },
  { label: 'Generators', href: '/tools/#generators' },
  { label: 'Formats', href: '/formats/' },
  { label: 'About', href: '/about/' },
];

export const footerLinks: NavItem[] = [
  { label: 'Practical Guides', href: '/guides/' },
  { label: 'All Tools', href: '/tools/' },
  { label: 'Image Converters', href: '/tools/#converters' },
  { label: 'Calculators', href: '/calculators/' },
  { label: 'About', href: '/about/' },
  { label: 'Contact', href: '/contact/' },
  { label: 'Privacy', href: '/privacy/' },
  { label: 'Terms', href: '/terms/' },
];
