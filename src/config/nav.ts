export interface NavItem {
  label: string;
  href: string;
}

export const mainNav: NavItem[] = [
  { label: 'All Tools', href: '/tools/' },
  { label: 'Calculators', href: '/calculators/' },
  { label: 'Formats', href: '/formats/' },
  { label: 'About', href: '/about/' },
];

export const footerNav: { title: string; items: NavItem[] }[] = [
  {
    title: 'Popular Converters',
    items: [
      { label: 'HEIC to JPG', href: '/heic-to-jpg/' },
      { label: 'WebP to JPG', href: '/webp-to-jpg/' },
      { label: 'PNG to WebP', href: '/png-to-webp/' },
      { label: 'JPG to PDF', href: '/jpg-to-pdf/' },
      { label: 'Compress Image to 200KB', href: '/compress-image-to-200kb/' },
    ],
  },
  {
    title: 'Calculators',
    items: [
      { label: 'Percentage Calculator', href: '/percentage-calculator/' },
      { label: 'Age Calculator', href: '/age-calculator/' },
      { label: 'Date Difference', href: '/date-difference-calculator/' },
      { label: 'Discount Calculator', href: '/discount-calculator/' },
      { label: 'Word Counter', href: '/word-counter/' },
    ],
  },
  {
    title: 'Formats Hub',
    items: [
      { label: 'JPG Guide', href: '/formats/jpg/' },
      { label: 'PNG Guide', href: '/formats/png/' },
      { label: 'WebP Guide', href: '/formats/webp/' },
      { label: 'HEIC Guide', href: '/formats/heic/' },
      { label: 'JFIF Guide', href: '/formats/jfif/' },
      { label: 'PDF Guide', href: '/formats/pdf/' },
      { label: 'All Formats', href: '/formats/' },
    ],
  },
  {
    title: 'Trust & Legal',
    items: [
      { label: 'Privacy Policy', href: '/privacy/' },
      { label: 'Cookie Policy', href: '/cookies/' },
      { label: 'Terms of Service', href: '/terms/' },
      { label: 'About Us', href: '/about/' },
      { label: 'Contact', href: '/contact/' },
    ],
  },
];
