# Structured Data & JSON-LD Architecture

**Schema Specification:** 13 Nov 2026 [source: Schema.org standard v27.0]  
**Confidence:** measured  

---

## 1. Schema Types & Application Rules

Best Converter implements semantic JSON-LD structured data strictly in compliance with Google's Search Central guidelines:

### 1. WebApplication Schema (Deployed on all Tool, Compressor & Calculator pages)
```json
{
  "@context": "https://schema.org",
  "@type": "WebApplication",
  "name": "HEIC to JPG Converter",
  "url": "https://convert.gudmud.site/heic-to-jpg/",
  "applicationCategory": "UtilitiesApplication",
  "operatingSystem": "All",
  "browserRequirements": "Requires JavaScript and HTML5 Canvas support",
  "offers": {
    "@type": "Offer",
    "price": "0",
    "priceCurrency": "USD"
  },
  "description": "Convert HEIC to JPG free in your browser. Photos never leave your device..."
}
```

### 2. BreadcrumbList Schema (Deployed sitewide on all interior pages)
```json
{
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": [
    {
      "@type": "ListItem",
      "position": 1,
      "name": "Home",
      "item": "https://convert.gudmud.site/"
    },
    {
      "@type": "ListItem",
      "position": 2,
      "name": "Tools",
      "item": "https://convert.gudmud.site/tools/"
    },
    {
      "@type": "ListItem",
      "position": 3,
      "name": "HEIC to JPG",
      "item": "https://convert.gudmud.site/heic-to-jpg/"
    }
  ]
}
```

### 3. Organization & WebSite Schemas (Deployed on Home Page)
```json
[
  {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "Best Converter",
    "url": "https://convert.gudmud.site/",
    "description": "Fast, private in-browser file converters and calculators."
  },
  {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "Best Converter",
    "url": "https://convert.gudmud.site/",
    "logo": "https://convert.gudmud.site/og-image.png",
    "contactPoint": {
      "@type": "ContactPoint",
      "email": "support@gudmud.site",
      "contactType": "customer support"
    }
  }
]
```

---

## 2. Strict Schema Compliance Guardrails

- **Zero Fake Ratings:** Never deploy `AggregateRating` or fake review star markups without genuine, verified third-party customer reviews. Violating this triggers manual Google spam penalties.
- **No HowTo Snippets on Tools:** Google deprecated `HowTo` rich results for general web search in 2023. Focus on `WebApplication` utility metadata instead.
- **Validation:** Every page's JSON-LD script tag is verified during build time in `scripts/seo-lint.ts` by parsing with `JSON.parse`.

