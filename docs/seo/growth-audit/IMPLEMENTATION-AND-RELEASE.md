# SEO implementation and release checks — 20 November 2026

This pass is limited to SEO, search content, indexability, internal links, crawl behavior and ranking measurement. No tool engine, dependency, advertising configuration or analytics tracker was changed. Parallel Google AI work is preserved. Changes found in the shared repository may have been committed by that parallel process; this pass did not deploy or change external accounts.

## Implemented

- Added `/guides/` and three distinct, server-rendered guides: image upload requirements, PDF size limits, and JSON-to-CSV data checks. Each includes practical examples, references, a contents list, Article/CollectionPage metadata, and relevant tool links. These pages require no client JavaScript for their content or navigation.
- Connected the guides to related tool pages and the footer. Improved related-tool selection: missing `from`/`to` values no longer match unrelated tools, explicit recommendations retain their order, and noindex tools are excluded from these recommendations.
- Added guide sitemap entries with explicit editorial dates. Extended the build gate to check every indexable page against primary sitemaps, reject duplicates/noncanonical/noindex entries, require a single exact canonical, and count inbound links by distinct source page.
- Corrected PDF compression content, FAQs, diagram labels and media descriptions to describe the implemented object-stream rewrite. Removed unsupported claims about image resampling, font pruning, fixed compression ratios, strict portal acceptance, and compliance certification.
- Removed a homepage SearchAction that advertised a query URL the directory did not initialize, and removed generic privacy feature claims from tool application schema. Nonindexable tools no longer emit WebApplication or FAQ rich-result claims.
- Kept all existing tool URLs. Excluded `pdf-to-jpg` and `heic-to-pdf` from search while their outputs do not fulfill the conversion intent, with visible limitations. There are 83 eligible tools. The parallel live-rate/public-IP fixes remain intact and indexable.
- Corrected immutable caching to apply to hashed Astro assets, with revalidation for the service worker and crawl-discovery files. Removed invalid Cloudflare Pages host/scheme redirect syntax. Extended the existing Worker redirect branch and declared the ASSETS binding used by its fallback.
- Added `scripts/search-performance.ts` to analyze real Search Console Pages or Queries CSV exports. It detects low-CTR review candidates and measured declines, preserves missing rows as unknown, and refuses to write reports into public assets. It does not fabricate search data or infer a cause from a decline.

## External release blockers

The live baseline in `LIVE-TECHNICAL-BASELINE.md` recorded only 40 tools in the deployed sitemap, HTTP apex returning 200, www returning 522, and a missing path returning 503. These observations describe the live snapshot, not the revised local build. Do not say they are fixed in production until the following checks pass.

### Deploy through the existing release process

Use the verified build artifact and the existing Pages workflow. The separate `wrangler.json` configuration describes a Workers deployment, not the Pages workflow. Confirm which project serves the domain before treating a configuration change as live. The ASSETS binding fixes an inconsistency in the Workers configuration; the missing-route 503 cause is not proven without deploying and checking that path.

### Configure canonical hosts at Cloudflare

In the zone for `zixtool.online`, ensure both apex and www DNS/hostname routing reach the intended site. Configure a permanent redirect when the host is www or the request uses HTTP. Target `https://zixtool.online` plus the original path, preserving query parameters. Apply the rule before asset serving.

Cloudflare Pages `_redirects` accepts path sources, so a host-level rule does not belong there. Workers static assets are served before the Worker by default; the Worker redirect code only applies when the Worker runs. The repository does not enable Worker-first processing globally. Zone-level redirects cover static pages without changing that execution model.

Verify:

1. `http://zixtool.online/png-to-jpg/?source=test` redirects to the HTTPS apex with the path and query intact.
2. `https://www.zixtool.online/png-to-jpg/` redirects to the apex instead of returning 522.
3. A random nonexistent URL returns 404, not 200 or 503.
4. `/sw.js` does not carry a one-year immutable cache policy.
5. The published sitemap contains all eligible tools and guides, excludes the two unsupported conversion routes, and every listed page returns 200 with its matching canonical and index directive.

## Establish search measurement

The owner reports no Search Console access or GA4 ID. GA4 is not needed to establish Search Console or to rank, and no tracker was installed.

1. Create a Search Console Domain property for `zixtool.online` and verify using Google's DNS TXT value in the domain's DNS settings. Existing repository verification tokens do not prove the current user has access.
2. Submit `https://zixtool.online/sitemap-index.xml`. Use URL Inspection on representative tool and guide URLs; API notification acceptance is not indexing confirmation.
3. After data is available, export the Pages tab for equal recent and previous periods using identical search type, country and device filters. Repeat separately for Queries.
4. Run `pnpm exec tsx scripts/search-performance.ts --current Pages.csv --previous PreviousPages.csv`. Reports default to the ignored `.seo-reports/` directory. English CSV headers are required.
5. Review candidate pages against their actual queries before editing titles, descriptions or content. Compare after recrawl; do not make repeated changes faster than data can resolve their effect.

No search-volume, difficulty, traffic or ranking numbers were invented. `../growth-research/keyword-page-map.csv` maps all 85 tools and explicitly marks unmeasured fields unknown. Its priorities are editorial judgments from observed use cases and competitor pages, not keyword-difficulty measurements.

## Prioritized next decisions

- **Now:** deploy and verify the host redirects, missing-page response and expanded sitemap. The local work cannot affect Google until published.
- **First measurable cycle:** inspect discovery/indexation, query impressions and clicks for the exact-KB image pages, HEIC compatibility and the three guides. Check actual query-to-page overlap before consolidating any URLs.
- **After data exists:** improve titles for measured relevant impressions with poor CTR, strengthen content that misses intent, and investigate real declines using the exported comparison. Avoid arbitrary keyword-density targets.
- **Content maintenance:** audit remaining universal compatibility, privacy/compliance and guaranteed-savings statements against implementation and primary references. The existing numeric Yoast score is an internal heuristic, not Google's ranking score.
- **Authority development:** follow the research roadmap's resource-link opportunities and publish reproducible conversion examples. No outreach, purchased links, or external messages were sent.

## References

- Google useful content: https://developers.google.com/search/docs/fundamentals/creating-helpful-content
- Google crawlable links: https://developers.google.com/search/docs/crawling-indexing/links-crawlable
- Google Search Console: https://developers.google.com/search/docs/monitor-debug/search-console-start
- Cloudflare Pages redirects: https://developers.cloudflare.com/pages/configuration/redirects/
- Cloudflare asset binding and routing: https://developers.cloudflare.com/workers/static-assets/binding/

Verification results are recorded after the final local checks; these do not establish production indexing or rankings.

## Live verification follow-up — 20 November 2026

The new `pnpm run seo:verify-live` command successfully checked all 102 sitemap-listed pages on `https://zixtool.online` with zero issues. This supersedes the earlier reachability failure below for the checks covered by this command. It verifies HTTP 200 without redirects, one expected canonical, title, description, one H1, HTML/HTTP indexing directives, and published sitemap location parity with the build. It does not query Google's index, validate robots.txt rules, measure rankings, or measure Core Web Vitals.

The deploy workflow now runs this check after deployment and before IndexNow notifications, and saves its JSON report as an Actions artifact. Failure prevents indexing notifications; it does not roll back the deployed site. Network failures are identified separately from confirmed response defects. Run against an already-built local preview with `SEO_CHECK_ORIGIN` set to its origin; production canonicals remain expected. Reports are written to `.seo-reports/live-release.json`.

Validation: 17 unit tests passed, full build passed (113 pages, 102 indexable), and the verifier passed against both local preview and production. No deployment was performed during this follow-up.

Separate live routing probes still found two hosting issues: `http://zixtool.online/` returned 200 without an HTTPS redirect; `https://www.zixtool.online/` returned 522. Configure the Cloudflare zone's HTTPS redirect and www-to-apex redirect/DNS, then recheck both. These require hosting configuration and were not fixed by repository edits. A deliberately nonexistent URL correctly returned 404 in this recheck.


## Final local verification — 20 November 2026

- `pnpm test`: 17 unit tests passed across 5 test suites (search performance, SEO architecture, registry, unit SEO, and deployed SEO verification).
- `pnpm run build`: passed; Astro reported zero errors and zero warnings.
- Build output: 113 pages, with 102 indexable pages and 83 eligible tool URLs in the tools sitemap.
- SEO hard gate: passed exact canonical checks, distinct-source link checks, content gates, and complete primary sitemap coverage.
- Content trust and capability audit: updated `json-formatter.mdx`, `heic-to-jpg.mdx`, `passport-photo-resizer.mdx`, `compress-image-to-20kb.mdx`, `compress-image-to-50kb.mdx`, `compress-image-to-100kb.mdx`, `json-to-csv.mdx`, `csv-to-json.mdx`, `split-pdf.mdx`, and `png-to-jpg.mdx`. Removed unsupported promises regarding HIPAA/GDPR certifications, exact line highlights without parser backing, fixed codec pricing, and recursive flattening. Contextual internal links added connecting tools with `/guides/image-upload-requirements/`, `/guides/pdf-file-size-limits/`, and `/guides/json-to-csv-data-checklist/`.
- `pnpm exec playwright test tests/e2e/seo-guides.spec.ts tests/e2e/seo-discovery.spec.ts --reporter line --workers 3`: 26 tests passed across desktop Chromium and Mobile Chrome. Guide tests disable JavaScript. Third-party Google font requests are blocked in these tests so results measure first-party markup and navigation, not external font availability.
- `pnpm run seo:verify-live`: checked all 102 sitemap URLs on `https://zixtool.online`; 0 errors or metadata defects found.
- Public routing status: `http://zixtool.online/` returns 200 without redirect, and `https://www.zixtool.online/` returns 522; both documented with exact Cloudflare Dashboard resolution steps.
- No deployment, Search Console submission, analytics activation, or outreach was performed by this pass.
