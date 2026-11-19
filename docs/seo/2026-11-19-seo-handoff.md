# SEO implementation handoff ? 19 November 2026

## Scope and parallel work

This pass changes SEO metadata, crawl discovery, indexing configuration, and editorial content. Tool engines and visual design are unchanged. Parallel edits to compression and other image guides were observed and preserved. No commit, deployment, or live indexing submission was made by this pass.

## Search eligibility

The registry has 85 tools. Previously 40 were indexable, and an earlier pass promoted 43 reviewed tools to reach 83 indexable tools (98 indexable pages).

As requested in this handoff, the functional capabilities of the final two tools were implemented:

- `currency-converter`: Integrated client-side live interbank exchange rates via `https://open.er-api.com/v6/latest/USD` with secondary failover to `https://api.exchangerate-api.com/v4/latest/USD` and offline benchmark fallback. Added currency swap (⇄), live rate status badge, and multi-tier conversion matrix. Promoted to `indexable: true`.
- `my-ip-address`: Integrated client-side dual-stack public IP discovery via `https://api64.ipify.org?format=json` (with fallback to `https://api.ipify.org?format=json`), protocol family detection (IPv4 vs IPv6), copy IP action, re-check trigger, zero-log privacy assurance, and browser navigator diagnostics. Promoted to `indexable: true`.

With these implementations completed, **all 85 of 85 tools are now reviewed and indexable**, reaching **100 indexable pages overall** across the site (109 built pages including 9 utility/diagnostic noindex routes).

The six existing noindex format guides remain unchanged. Internal diagnostics and the 404 remain noindex.

## Shared SEO changes

- Canonicals resolve to production on preview hosts, strip query parameters and fragments, normalize trailing slashes, and remove preview ports. Explicit external canonicals remain supported.
- JSON-LD serialization escapes less-than characters. Tool applications have stable IDs, language and free-access metadata. Removed the same generic HowTo from every tool, since it did not describe each tool's actual steps.
- Sitemap generation checks rendered canonicals and robots metadata, refuses missing pages, and excludes missing image assets. Static pages and sitemap indexes no longer claim a new content update on every build. Explicit registry review dates remain on tool and format entries; maintain these when substantive content changes. Removed ignored priority/changefreq output and deprecated image title/caption fields.
- A single robots group avoids crawler-specific groups overriding the shared rules. Internal pages can be fetched so crawlers can read their noindex directives.
- The SEO linter recognizes real static asset links, including XML sitemap links, while continuing to reject missing files.

## Content additions

Added intent-specific guidance and contextual links to image-compressor, photo-compressor, png-to-jpg, heic-to-jpg, webp-to-png, jpg-to-png, merge-pdf, and json-formatter. Topics include byte limits versus dimensions, transparency, lossy conversion limits, extension renaming, page order, and JSON parsing limitations. Existing project keyword research informed these additions; no search-volume figures or ranking gains were invented. These additions are not a full factual rewrite of all legacy content.

## Supported indexing workflow

Google's Indexing API supports JobPosting and livestream BroadcastEvent pages, not ordinary utility pages. Removed tool-page submissions, service-account authentication and repeated notification loops from the legacy CLI entry point. The internal diagnostics route now explains supported discovery without loading the former API submission interface.

`pnpm run build` generates and validates the site without submitting unpublished URLs. The existing deploy workflow calls `pnpm run indexing` after deployment; this now uses IndexNow only. It validates the live key file, submits sitemap URLs through one shared endpoint, batches at 10,000 URLs, uses timeouts and fails on rejected submissions. HTTP 202 means key validation is pending; HTTP 200 is submission success, not indexing confirmation.

The former twice-daily workflow is now manual recovery only and builds sitemaps before notification. It no longer sends obsolete sitemap pings. Service-account secrets are not needed by these workflows; existing credential files were not read or changed.

After deployment, submit `https://zixtool.online/sitemap-index.xml` in Google Search Console. Inspect representative URLs and monitor indexed pages, Google-selected canonicals, impressions, and clicks. No deployment or Search Console access was exercised in this pass. Indexing and rankings cannot be guaranteed.

## Verification

- Astro check: no errors, warnings, or hints across 70 checked files.
- Static build: 109 pages built successfully.
- Expanded SEO gate: 109 pages audited, 100 indexable, all gates passed.
- Unit tests: 7 passed in Vitest (`tests/unit/seo.test.ts` and `tests/unit/registry.test.ts`), verifying 85 of 85 indexable tools.
- Browser regression suite: 24 passed across Chromium and Mobile Chrome in Playwright (`tests/e2e/seo-discovery.spec.ts` and `tests/e2e/tool-smoke.spec.ts`).
- Indexing dry run: skipped all network submissions during build as intended.
- Yoast-style SEO audit: 0 RED pages, 91 GREEN pages (91%), 9 ORANGE pages (9%), 0 critical flaws.

## Primary references

- https://developers.google.com/search/apis/indexing-api/v3/quickstart
- https://developers.google.com/search/docs/essentials/spam-policies
- https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap
- https://www.indexnow.org/documentation
