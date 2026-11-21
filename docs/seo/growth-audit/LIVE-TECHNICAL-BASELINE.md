# Live technical SEO baseline ? 19 November 2026

This is a read-only audit of the deployed site, not an assessment of the latest unshipped working tree. The sitemap crawl was captured around 18:13 IST. Follow-up routing probes were captured at `2026-11-19T16:32:41.501Z` (UTC). DNS and HTTPS worked from the local execution host even though the web-search tool could not open the domain. This distinction matters: a tool-access failure is not evidence of a site outage.

## Scope and evidence

- DNS returned Cloudflare addresses 104.21.22.95 / 172.67.203.203 and IPv6 records.
- Crawled every unique advertised sitemap page plus internal diagnostics and a deliberately nonexistent URL: 57 requests, three workers, one-second delay per worker, 20-second timeout.
- All 55 advertised indexable pages and internal diagnostics returned 200. The nonexistent route returned 503.
- The deployed tools sitemap contains **40** tool URLs; pages sitemap 10; format sitemap 5; image sitemap 12 image-page entries (duplicates of tool-page URLs, as expected).
- All advertised page canonicals matched their requested HTTPS URLs, all had one H1, and every inspected JSON-LD block parsed as JSON. This is syntax verification, not Google rich-result eligibility certification.
- Largest fetched HTML was 105,714 bytes. Request durations in JSON include body download and execution-host network conditions; they are not TTFB, LCP, INP, or field performance measurements.

## Prioritized findings

| Priority | Deployed observation | Implication | Resolution / verification |
|---|---|---|---|
| High | Live sitemap still has 40 tools; `/uuid-generator/` and `/currency-converter/` return `noindex, follow` | The expanded local indexing eligibility has not reached production | Deploy the verified final artifact, then fetch robots metadata and sitemap again. Do not claim newly enabled tools are already indexed. |
| High | `http://zixtool.online/` returns 200 with no Location header | HTTP remains a duplicate accessible origin despite HTTPS canonical hints | Configure the actual hosting/Cloudflare HTTPS redirect. Verify a single 301/308 hop to the HTTPS URL. Root is addressing repository routing separately. |
| High | `https://www.zixtool.online/` returns Cloudflare 522 | The www hostname does not reach a working redirect | Correct Cloudflare hostname/domain routing and verify www redirects to apex. A local Pages `_redirects` edit alone cannot repair a hostname that never reaches the site. |
| Medium | A deliberately missing URL repeatedly returned HTTP 503 `Resource temporarily unavailable` | Unknown-route behavior does not currently provide a clean not-found response in these probes | Verify origin/Worker fallback routes after deployment. Return a real 404 for nonexistent pages; do not treat this probe as proof every unknown route behaves identically. |
| Medium | Live robots.txt contains bot-specific Allow groups after wildcard internal disallows | Specific bot groups do not inherit wildcard exclusions; the public crawler policy is inconsistent | Deploy the consolidated robots configuration from the earlier SEO work; internal noindex pages must be fetchable for the directive to be read. |
| Medium | Historical public/_headers marked wildcard JS immutable, including a fixed-name service worker; historical sw.js used cache-first HTML behavior | Returning clients may display stale content after deploys | Root has changed cache headers. Confirm live `/sw.js` revalidation behavior after deploy. Distinguish client SW freshness from Google indexing. |
| Medium | Live tool pages contain generic HowTo schemas and SVG OG images with global 1200?630 declarations | Schema can describe an inaccurate workflow; social image metadata may not match the actual asset | Earlier local SEO changes removed generic HowTo. Validate final source dimensions/type before claiming rich previews; OG is not a ranking guarantee. |

## What cannot be concluded

The user has no Search Console or GA4 access. Index coverage, Google-selected canonical URLs, query impressions, clicks, CTR, average position, search-volume estimates, and organic conversion rates are unavailable. A 200 page with an index directive is eligible for discovery; it is not evidence that Google indexed or ranked it. No CrUX dataset, Lighthouse report, mobile rendering run, or real-user CWV sample was captured in this read-only audit. No CWV pass, health score, or traffic estimate is asserted. Browser screenshots were deferred so the requested production routing and crawl evidence could be delivered promptly.

## Reproducible verification

Use `curl.exe -I https://zixtool.online/`, `curl.exe -I http://zixtool.online/`, and `curl.exe -I https://www.zixtool.online/` for routing. Fetch page bodies to inspect meta robots and canonical links; HEAD alone does not establish indexability. `scratch/live-technical-audit.mjs` and `scratch/live-routing-probes.mjs` contain the exact crawl/probe logic used. Scripts only perform GET requests and write audit artifacts.

## Artifacts

- `live-audit.json`: per-page statuses, titles, descriptions, canonicals, robots, schema types, link list, image metadata, byte sizes and request durations.
- `live-robots.txt`: the deployed robots body at crawl time.
- `live-sitemap-index.xml`: the deployed sitemap index body at crawl time.
- `live-routing-probes-2026-11-19.json`: timestamped repeat routing and indexability probes from the successful baseline. `live-routing-probes.json` contains the latest attempt.

## Official interpretation references

- Google canonicalization and redirects: https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls
- Google robots.txt interpretation: https://developers.google.com/search/docs/crawling-indexing/robots/robots_txt
- Google noindex requirements: https://developers.google.com/search/docs/crawling-indexing/block-indexing
- Google HTTP status handling: https://developers.google.com/search/docs/crawling-indexing/http-network-errors
- Cloudflare Pages redirect limits and syntax: https://developers.cloudflare.com/pages/configuration/redirects/

These references explain the observations; they are not evidence that the working-tree fixes have deployed.

## Production Verification — 20 November 2026

A comprehensive production crawl and routing probe was executed on 20 November 2026 at `2026-11-20T07:43:05Z` using `scripts/verify-live-seo.ts` and automated HTTP fetch probes:

### 1. Verified Live Deployments
- **Sitemap & Tool Expansion:** `https://zixtool.online/sitemap-tools.xml` contains all **83 eligible tools** (successfully deployed from previous 40). `sitemap-pages.xml` contains 14 pages including `/guides/` and all 3 diagnostic guides. `sitemap-image.xml` contains 83 images.
- **Indexability & Directives:** Every single one of the 102 sitemap-listed pages returned HTTP 200, exactly 1 H1, valid title and meta description, and self-referential canonical URL matching `https://zixtool.online/...`.
- **Targeted Tool State:**
  - `https://zixtool.online/uuid-generator/` returns 200 with `robots: index, follow`.
  - `https://zixtool.online/currency-converter/` returns 200 with `robots: index, follow`.
  - `https://zixtool.online/heic-to-pdf/` and `https://zixtool.online/pdf-to-jpg/` return 200 with `robots: noindex, follow` (correctly excluded from search due to incomplete client PDF conversion).
- **Service Worker & 404 Routing:**
  - `https://zixtool.online/sw.js` returns `Cache-Control: no-cache, max-age=0, must-revalidate` (resolved).
  - Deliberately nonexistent paths (e.g. `/nonexistent-route-probe-404-check`) cleanly return **HTTP 404 Not Found** (resolved from 503).
- **Public Link Graph:** Home page, navigation, and footer contain zero public links to `/internal/indexing-tester/`.

### 2. Actions Requiring Cloudflare Account Access (Cannot Be Fixed in Local Code)
Local repository files cannot alter edge network routing for requests that Cloudflare intercepts before reaching the Pages static origin. The domain owner/operator must complete these two settings in the Cloudflare Dashboard:

1. **HTTP to HTTPS Redirection (Plain HTTP returns 200 OK):**
   - **Path in Dashboard:** Cloudflare Dashboard -> select `zixtool.online` zone -> **SSL/TLS** -> **Edge Certificates** -> scroll to **Always Use HTTPS** and toggle to **On**.
   - **Verification:** `curl.exe -I http://zixtool.online/` must return `HTTP/1.1 301 Moved Permanently` (or 308) with `Location: https://zixtool.online/`.
2. **`www` Subdomain 522 Connection Timeout:**
   - **Path in Dashboard:**
     - Step A (DNS): **DNS** -> **Records** -> verify CNAME record: Name `www`, Target `zixtool.online` (or the Cloudflare Pages custom domain), Proxy Status: **Proxied** (Orange Cloud).
     - Step B (Redirect Rule): **Rules** -> **Redirect Rules** -> **Create Rule**:
       - Rule Name: `Redirect www to apex`
       - When incoming requests match: Custom filter expression: `(http.host eq "www.zixtool.online")`
       - Then: Type `Dynamic`, Expression: `concat("https://zixtool.online", http.request.uri.path)`, Status code: `301`, Preserve query string: Checked.
   - **Verification:** `curl.exe -I https://www.zixtool.online/` must return `HTTP/2 301` with `Location: https://zixtool.online/`.
