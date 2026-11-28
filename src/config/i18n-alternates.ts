import { siteConfig } from './site';

export interface AlternateEntry {
  lang: string;
  href: string;
}

export const toolAlternates: Record<string, AlternateEntry[]> = {
  'tip-calculator': [
    { lang: 'x-default', href: `${siteConfig.url}/tip-calculator/` },
    { lang: 'en', href: `${siteConfig.url}/tip-calculator/` },
    { lang: 'de', href: `${siteConfig.url}/de/trinkgeld-rechner/` },
    { lang: 'es', href: `${siteConfig.url}/es/calculadora-de-propinas/` },
    { lang: 'fr', href: `${siteConfig.url}/fr/calculateur-de-pourboire/` },
    { lang: 'pl', href: `${siteConfig.url}/pl/kalkulator-napiwkow/` },
    { lang: 'it', href: `${siteConfig.url}/it/calcolo-mance/` },
  ],
  'heic-to-jpg': [
    { lang: 'x-default', href: `${siteConfig.url}/heic-to-jpg/` },
    { lang: 'en', href: `${siteConfig.url}/heic-to-jpg/` },
    { lang: 'de', href: `${siteConfig.url}/de/heic-in-jpg-umwandeln/` },
    { lang: 'es', href: `${siteConfig.url}/es/convertir-heic-a-jpg/` },
    { lang: 'fr', href: `${siteConfig.url}/fr/convertir-heic-en-jpg/` },
    { lang: 'pl', href: `${siteConfig.url}/pl/heic-na-jpg/` },
    { lang: 'it', href: `${siteConfig.url}/it/convertire-heic-in-jpg/` },
  ],
};

export function getAlternatesForTool(slug: string): AlternateEntry[] | undefined {
  return toolAlternates[slug];
}
