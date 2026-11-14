# Claude SEO Intelligence & Automation Rules for Best Converter

These rules guide the AI agent when handling any SEO, site audit, technical optimization, content strategy, or search ranking request in this repository.

## Skill Routing & Trigger Guidelines

Activate and reference the corresponding SEO skill under `skills/` whenever the user requests:

| Requested Task | Target Skill | Key Checklist / Runbook |
| :--- | :--- | :--- |
| Full Website Audit | `seo-audit` | Parallel audit across technical, content, schema, performance, and internal linking |
| Technical SEO & Crawlability | `seo-technical` | Robots.txt, canonicals, 9 technical categories, redirect loops, crawl budget, IndexNow |
| Single-Page SEO Analysis | `seo-page` | On-page headings (H1-H6), keyword frequency, meta tags, word counts, content structure |
| Schema & Structured Data | `seo-schema` | JSON-LD schema detection, validation against Google Rich Results, WebApplication/Breadcrumbs |
| XML Sitemaps | `seo-sitemap` | Sharded sitemaps, sitemap-index validation, `<lastmod>` ISO 8601 formatting |
| Keyword Research & Clustering | `seo-cluster` | SERP-based semantic topic clusters, search intent grouping, pillar/cluster architecture |
| Content Quality & E-E-A-T | `seo-content` | Experience, Expertise, Authoritativeness, Trustworthiness scoring and heuristic evaluation |
| SEO Content Brief | `seo-content-brief` | Target primary/secondary keywords, SERP angle, competitor gap, section outlines, internal links |
| Core Web Vitals & Speed | `seo-technical` | LCP (<=2.5s), INP (<=200ms), CLS (<=0.10) metrics analysis and render-blocking scripts |
| Generative Engine Optimization (GEO) | `seo-geo` | AI Overviews, ChatGPT Search, Perplexity optimization, entity extraction, citation readiness |
| Image SEO | `seo-images` | Alt attributes, responsive srcset, modern formats (WebP/AVIF), dimension tags |
| Backlink Analysis | `seo-backlinks` | Backlink profile evaluation, anchor text distributions, domain authority heuristics |
| International & Hreflang | `seo-hreflang` | ISO language/region validation, bidirectional return tags, canonical vs alternate |
| Local SEO & Maps | `seo-local` & `seo-maps` | Google Business Profile optimization, local schema, NAP consistency, local intent |
| Strategic SEO Planning | `seo-plan` | Step-by-step roadmap, quick wins, prioritized technical backlog, keyword roadmap |
| Programmatic SEO | `seo-programmatic` | Dynamic template scaling, dataset integration, anti-thin content guardrails |

## Execution Protocol

1. **Use Genuine Verification Tools**: Do not invent or hallucinate SEO scores or audit metrics. Use the bundled analysis scripts and inspection tools located in `C:/Users/MSI/.gemini/config/plugins/claude-seo/scripts/` or project-level SEO linters.
2. **Runtime Invocation**:
   Execute bundled python tools through the isolated runtime:
   `python C:/Users/MSI/.gemini/config/plugins/claude-seo/scripts/runtime.py run <script.py> [args]`
   or directly via the virtual environment interpreter:
   `C:/Users/MSI/.gemini/config/plugins/claude-seo/.venv/Scripts/python.exe C:/Users/MSI/.gemini/config/plugins/claude-seo/scripts/<script.py> [args]`
3. **Hard Quality Gates**:
   - Title tag $\le 60$ characters.
   - Meta description between 120-158 characters.
   - Exactly 1 `<h1>` tag matching primary search intent.
   - Self-referential or authoritative canonical URL.
   - Valid JSON-LD structured data.
   - Zero broken or circular internal links.

