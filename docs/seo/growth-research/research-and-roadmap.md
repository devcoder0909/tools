# Organic discovery research and execution roadmap

Research date: 19 November 2026. Scope: SEO, query intent, content architecture and acquisition; no product changes made by this research task. Companion file: `keyword-page-map.csv` maps all 85 existing tools.

## Evidence and limits

This is a primary-source opportunity study, not an estimate of competitors' traffic. Current competitor pages and institutional help documents establish real use cases and observable acquisition architecture. They do not establish monthly search volume, keyword difficulty, backlink counts, conversion rates, or precise Google rankings. Those fields remain **unknown** in the CSV. The user has no GA4 measurement ID or Search Console access; no private search-performance dataset was available. Search results are discovery evidence, not reproducible geographic rank measurements. The live site could not be opened through the web research tool; do not interpret that fetch failure as proof that Google cannot crawl it.

The million-daily-view objective is an ambition rather than a forecast. Building more landing pages cannot establish that sufficient addressable traffic, rankings or retention will follow. Early milestones should measure verified discovery and useful landing-page visits before expansion.

## Where to focus

1. **Image upload requirements and exact KB limits:** strongest directly observed workflow evidence. A college's own help PDF sends applicants to a 20KB compression page. Prioritize existing 20/50/100/200KB pages and one explanatory guide covering bytes, dimensions, formats and final-file verification. Do not create pages for every integer KB value. [Hinduja College upload instructions](https://www.hindujacollege.edu.in/assets/documents/JuniorCollege/Guidline-for-Uploading-Image.pdf)
2. **HEIC compatibility:** an education provider's own help sheet describes HEIC submission difficulties and links an online converter. Explain conversion versus renaming, output checks and still-image limitations. Keep the main tool URL and link to image upload guidance. [SIDE education help sheet](https://erol.side.wa.edu.au/content/file/74193491-de7f-4fd5-929e-3f7402092106/2/Managing%20HEIC%20files.pdf)
3. **PDF size-limit troubleshooting:** iLovePDF has a dedicated guide published 30 October 2026 and another for 100KB splitting. This is active competitive content, not an underserved-keyword claim. ZixTool should explain its actual object-stream optimization limits and alternatives when scans remain large; no exact-size compression promise. [Specific-size guide](https://www.ilovepdf.com/blog/compress-pdf-to-specific-size), [100KB splitting guide](https://www.ilovepdf.com/blog/how-to-compress-pdf-to-100kb)
4. **JSON formatting and conversion checks:** focus on correctness, syntax versus schema validation, preserving large numeric identifiers, and inspecting CSV output. MDN documents the JavaScript parsing behavior relevant to this tool. Treat these as qualified long-tail hypotheses pending actual impressions. [JSON.parse reference](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/JSON/parse)

## Competitor architecture and opportunities

These are observable page features, not claims about why a site ranks or how much traffic it receives. Product claims below belong to each competitor and were not independently benchmarked.

| Primary page | Observed acquisition/product structure | Practical implication for ZixTool |
|---|---|---|
| [JPEG Optimizer, 20KB](https://jpeg-optimizer.com/compress-image-to-20kb/) | Tool-first exact-size URL, batch processing, ZIP download, links among size targets; claims browser-local processing | Exact-size intent is established and competitive. Verify output bytes, readability and limitations; do not copy its large size-page grid. |
| [iLoveIMG compression](https://www.iloveimg.com/compress-image) | Short tool page, task-oriented navigation, format links and many language options | Strong task navigation can outperform long repetitive prose as a user experience. Build useful category paths; translate only when maintained and validated. |
| [TinyPNG](https://tinypng.com/) | Sample comparison, knowledge base, integrations, API and CDN links; free upload limits shown | It serves multiple audiences and repeat workflows. Demonstrable outcomes and documentation matter. Local privacy alone does not establish superior compression. |
| [Squoosh](https://squoosh.app/) | Sample assets, adjustable output and explicit local processing | Client-side processing is already available elsewhere. Original before/after evidence and easier task completion are stronger differentiators. |
| [CloudConvert PNG to JPG](https://cloudconvert.com/png-to-jpg) | One clear conversion pair, format hubs, controls for output, security/company links | Preserve conversion URLs. Explain real output tradeoffs and connect the format guides; do not add synonymous duplicate tools. |
| [iLovePDF compression](https://www.ilovepdf.com/compress_pdf) | Three compression levels and task-specific PDF navigation | Describe what ZixTool actually changes. Avoid targeting scan-downsampling intent until that capability is real. |
| [HEICJPG.dev](https://heicjpg.dev/) | Dedicated conversion, visible quality explanation, local processing and clear still-image output | ?No upload? is competitive parity. Demonstrate successful handling of supported HEIC variants and clear failure recovery. |
| [JSONFormatter.org](https://jsonformatter.org/) | Format/validate/minify, file controls, tree/graph views, examples and related conversions | Distinguish useful correctness guidance from generic definitions. Keep examples adjacent to actions and link JSON/CSV tasks contextually. |

Do not reuse competitor percentages or claim better output without a repeatable benchmark. Avoid negative comparisons such as ?all cloud tools lose quality? or ?competitors leak files?; these were not established.

## Page mapping and differentiation

The CSV has one row per existing tool. `primary_query` and `supporting_queries` come from the repository's keyword fields; these are candidate target phrases, not measured demand. A researched cluster indicates relevant primary evidence, not that every secondary phrase was independently validated. P1/P2/P3 are editorial priorities based on observed workflow fit and implementation readiness, not keyword-difficulty scores.

Keep `/image-compressor/` for general image optimization, `/photo-compressor/` for photo-upload requirements, and `/jpg-compressor/` for JPEG-specific recompression. There is potential query overlap, but cannibalization is unproven without query-to-page data. Do not redirect or merge established URLs based on similarity alone.

Use existing exact-size pages only for functional, preconfigured targets. Do not publish new city, device, institution or near-synonym pages unless they offer genuinely different requirements or functionality and have maintained source evidence. Do not present one institution's file limit as universal.

## Distinct supporting guides

The primary agent implemented the following guide routes during this pass. Each answers a separate workflow question; the tool remains the destination for action.

| Guide | Search intent hypothesis | Unique value | Relevant existing tool links |
|---|---|---|---|
| `/guides/image-upload-requirements/` | image rejected; correct KB but wrong dimensions; format not accepted | A diagnostic sequence for size, dimensions and true file format; no invented official specifications | image-compressor, resize-image, PNG/JPG/HEIC conversion, exact-KB tools |
| `/guides/pdf-file-size-limits/` | PDF still too large after compression; scanned PDF size | Distinguishes structural optimization from image recompression; verifies results and explains alternatives | compress-pdf, split-pdf, merge-pdf |
| `/guides/json-to-csv-data-checklist/` | JSON to CSV loses data; nested objects or number IDs | Checklist for column selection, nesting, types, numeric identifiers and result inspection | json-formatter, json-to-csv, csv-to-json |

Use concise answer-first summaries, realistic examples, definitions and readable tables where useful. These can improve answer extraction, but featured snippets and AI citations are not guaranteed. Keep schema consistent with visible content; extra markup is not a substitute for useful information.

## Content trust findings

These findings refer to source snapshots inspected during research and may be resolved by concurrent work. Recheck before editing. No legacy tool content was changed by this research task.

- `compress-pdf.mdx` originally claimed 150 DPI resampling, 80?90% reductions, font pruning and WebAssembly processing; the inspected PdfShell only used `PDFDocument.load()` and `save({useObjectStreams:true})`. The primary agent reports correcting this content and FAQ. Keep future promises tied to actual operations and sample tests.
- `json-formatter.mdx` described universal precise error locations, a bespoke AST engine, and compliance assurances. Inspected TextShell used `JSON.parse`, `JSON.stringify` and browser exception messages. Avoid claiming all browsers use V8; avoid exact diagnostics unless implemented; local processing alone does not establish GDPR or HIPAA compliance.
- HEIC copy contained a fixed Microsoft codec price and ?100% of PC software? support claims. These are brittle or overbroad. Describe compatibility without universal or price claims unless checked and maintained.
- PNG/JPG guidance contains guaranteed clarity or fixed savings language. Lossy output depends on source, settings and encoder. Keep file-size examples explicitly measured samples, not guaranteed results.
- Passport and exam copy includes institution-specific dimensions and file sizes. Each needs a current official source and review date; never imply that meeting a byte target guarantees application acceptance.
- Password, finance and health pages require careful authoritative sourcing. A technical title or generic ?engineering team? byline is not proof of credentials. Do not invent expert review, certification or endorsements.

Current indexability differs from the earlier handoff: the parallel Google AI work implemented live currency/IP functionality. Verification on 20 November confirms 83 indexable tools. `/pdf-to-jpg/` and `/heic-to-pdf/` are excluded because their current outputs do not perform the claimed PDF conversion. Currency and IP lookup remain indexable after the parallel functionality fixes. The CSV captures registry state at export; re-read the registry after parallel edits before publishing counts.

## SEO execution roadmap

| Priority | Deliverable | Completion evidence | Next decision |
|---|---|---|---|
| P0 | Confirm production DNS/HTTP responses, sitemap reachability and canonical production host | Real response capture and successful public sitemap fetch | Fix deployment/discovery before adding more pages if inaccessible |
| P0 | Keep placeholder or unsupported-intent pages out of index; match claims to capabilities | Registry/build comparison, rendered robots, factual content review | Enable a held page only when working behavior supports its intent |
| P1 | Publish the three substantive guides and contextual links | Static rendered content, no broken links, distinct intent, sitemap inclusion | Observe impressions and landing-page engagement after deployment |
| P1 | Create/verify Search Console and add sitemap | Verified owner access and sitemap status; not simulated CLI notifications | Classify discovery, crawl, canonical or quality issues using actual GSC data |
| P1 | Map query/page performance to the CSV | 28-day comparable query and page exports once enough data exists | Improve impression-rich pages before generating new ones |
| P2 | Publish reproducible compression/privacy examples | Original samples, settings, output sizes, test date and limitations | Promote useful evidence to relevant educators/design/developer resources |
| P2 | Review overlapping compressor pages using query/page pairs | Actual data showing overlap, performance and distinct use | Improve differentiation; redirect only with evidence and explicit URL plan |
| P3 | Expand into new targets or languages | Demonstrated demand plus maintained functionality/editorial ownership | Avoid bulk expansion while current pages have no measured discovery |

Do not promise a timeline for rankings. Assess technical completion immediately, discovery once crawlers revisit, and traffic trends only after an adequate comparable observation window. Avoid treating a low-volume week or single average-position change as causal evidence.

## Sustainable backlinks and digital PR

Build link-worthy evidence before outreach. Useful assets include a small original test set comparing format choices for photo versus line art, a byte/dimension validation checklist, and a reproducible browser Network-panel demonstration of local file processing. Label device/browser/settings, allow independent replication, and avoid declaring universal superiority from a few samples.

Institutional help pages already link converters, as the education sources above show. This is evidence of a real editorial use case, not permission to contact those organizations or a promise of links. After the product and guide are tested, identify relevant help pages with outdated instructions or missing privacy alternatives. Prepare an individual note explaining the exact reader benefit and disclose ownership. Contact only when authorized; no emails or outreach were sent in this task.

For developers, publish a verifiable JSON/CSV edge-case checklist and examples, then contribute it where the maintainers accept resource submissions. For designers, publish actual compression examples with usable original assets. Track referring page, destination, editorial relevance and referral visits, rather than buying links or optimizing an invented authority score.

Do not buy ranking links, automate forum promotion, require keyword-rich backlinks in embeds, trade large numbers of links, or submit to indiscriminate directories. Google's spam policy explicitly addresses scaled content abuse, doorway abuse and link spam. [Google spam policies](https://developers.google.com/search/docs/essentials/spam-policies)

## Measurement decisions once access exists

- **No impressions:** first check indexing/canonical/coverage, then query relevance; do not assume a penalty.
- **Impressions with low CTR:** compare query intent, title and snippet against actual results at similar positions. Use page/query cohorts, not one universal CTR benchmark.
- **Clicks without tool completion:** hand off the observed failure to the product owner; the SEO pass should not disguise a broken tool with longer text.
- **Declining clicks:** compare equivalent periods, query mix, device/country, indexing and seasonality. A concurrent Google update is a hypothesis, not a diagnosis.
- **Growing impressions with successful tasks:** deepen the proven cluster and its supporting content before broadening into unrelated keywords.

Google's people-first guidance emphasizes originality, usefulness, truthful expertise and an overall good experience. Use it as the editorial release standard rather than trying to satisfy a fixed word count or keyword density. [Helpful-content guidance](https://developers.google.com/search/docs/fundamentals/creating-helpful-content)
