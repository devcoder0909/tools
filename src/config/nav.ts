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

export const footerNav: { title: string; items: NavItem[] }[] = [
  {
    title: 'PDF Tools',
    items: [
      { label: 'Merge PDF', href: '/merge-pdf/' },
      { label: 'Split PDF', href: '/split-pdf/' },
      { label: 'Compress PDF', href: '/compress-pdf/' },
      { label: 'JPG to PDF', href: '/jpg-to-pdf/' },
      { label: 'PNG to PDF', href: '/png-to-pdf/' },
    ],
  },
  {
    title: 'Image Tools',
    items: [
      { label: 'HEIC to JPG', href: '/heic-to-jpg/' },
      { label: 'WebP to JPG', href: '/webp-to-jpg/' },
      { label: 'PNG to WebP', href: '/png-to-webp/' },
      { label: 'Resize Image', href: '/resize-image/' },
      { label: 'Compress to 200KB', href: '/compress-image-to-200kb/' },
    ],
  },
  {
    title: 'Calculators & Finance',
    items: [
      { label: 'EMI Calculator', href: '/emi-calculator/' },
      { label: 'SIP Calculator', href: '/sip-calculator/' },
      { label: 'Currency Converter', href: '/currency-converter/' },
      { label: 'Percentage Calculator', href: '/percentage-calculator/' },
      { label: 'Scientific Calculator', href: '/scientific-calculator/' },
      { label: 'BMI Calculator', href: '/bmi-calculator/' },
    ],
  },
  {
    title: 'Generators & Media',
    items: [
      { label: 'QR Code Generator', href: '/qr-code-generator/' },
      { label: 'Password Generator', href: '/password-generator/' },
      { label: 'Text to Speech', href: '/text-to-speech/' },
      { label: 'Screen Recorder', href: '/screen-recorder/' },
      { label: 'JWT Decoder', href: '/jwt-decoder/' },
      { label: 'Online Timer', href: '/online-timer/' },
    ],
  },
  {
    title: 'Formats & Colleges',
    items: [
      { label: 'HEIC Format Guide', href: '/formats/heic/' },
      { label: 'WebP Format Guide', href: '/formats/webp/' },
      { label: 'Gudmud Colleges', href: '/colleges/' },
      { label: 'JoSAA Cutoff Explorer', href: '/cutoff/' },
      { label: 'JEE College Predictor', href: '/jee-main-rank-college-predictor/' },
      { label: 'Privacy Policy', href: '/privacy/' },
      { label: 'Terms of Service', href: '/terms/' },
    ],
  },
];