# Internal Linking & Crawl Mesh Architecture

**Architecture Date:** 13 Nov 2026 [source: internal linking topology design]  
**Confidence:** measured  

---

## 1. Hub-and-Spoke Topology

Best Converter organizes content using a strict hierarchical hub-and-spoke model to direct crawl equity efficiently without relying on spammy 70+ link footprint meshes:

```
                      [ Home Page (/) ]
                              |
       +----------------------+----------------------+
       |                      |                      |
[ /tools/ Index ]      [ /formats/ Hub ]     [ /calculators/ Index ]
       |                      |                      |
       v                      v                      v
[ Tool Pages ]        [ Format Guides ]      [ Calculator Pages ]
(heic-to-jpg, etc.)    (/formats/heic/, etc.) (percentage-calc, etc.)
```

---

## 2. On-Page Curated Linking Rules

1. **Reverse Conversion Links:** Every pair tool links to its reverse complement (e.g. `heic-to-jpg` links to `jpg-to-png` and `heic-to-png`).
2. **Sibling Conversions:** Pair pages link to 2-3 sibling tools sharing the identical input format or identical output target.
3. **Format Hub Connection:** Every pair page links to the authoritative format hub for its source format (e.g., `heic-to-jpg` links to `/formats/heic/`). Tools with generic `from: image` never output broken links such as `/formats/image/`.
4. **Target Size Cluster Linking:** Target size compressor pages cross-link adjacent byte thresholds (e.g., 50KB links to 100KB and 200KB; 200KB links to 100KB, 500KB, and 1MB).
5. **Sitewide Footer Policy:**
   - Popular Converters (5 curated links)
   - Calculators (5 curated links)
   - Formats Hub (5 reviewed indexable hubs + index)
   - Trust & Legal (Privacy Explained, Privacy Policy, Cookies, Terms, About, Contact)
   - **Hard Rule:** Draft or non-indexable tools are strictly forbidden from sitewide header or footer menus.
6. **Inbound Link Floor:** Every indexable page on the site must receive a minimum of 3 inbound internal links to prevent orphan pages.

