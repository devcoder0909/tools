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

## Recheck on 20 November 2026

A fresh probe at 2026-11-20T07:25:54.766Z failed from the execution environment (HTTP timeout and HTTPS fetch failures). It does not establish a production outage or confirm whether the baseline issues have been fixed. Retain the successful 19 November evidence separately and recheck from a working network after release.
