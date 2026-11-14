# Weekly Measurement & Growth Tracking Framework

**Framework Date:** 13 Nov 2026 [source: search console growth scorecard protocol]  
**Confidence:** measured  

---

## 1. Growth Hard Gates & Kill/Pivot Rules

To safeguard against wasted engineering on penalized or non-performing assets, the project enforces two non-negotiable milestones:

- **Month 3 Gate (Indexation Health):** If $< 50\%$ of submitted pages are indexed in Google Search Console after 90 days, or if search impressions remain flat, **freeze all new page scaffolding immediately**. Perform a comprehensive crawl budget audit, purge thin pages, and expand on-page word count/FAQ depth on existing pages.
- **Month 6 Gate (Traffic Traction):** If organic search traffic remains $< 3,000$ monthly visits despite clean indexation, evaluate search intent mismatch and pivot from generic conversion terms to narrower, high-intent professional workflows (e.g. strict government visa photo specifications, developer API formatters).

---

## 2. Weekly Search Console Monitoring Routine

Review performance every Monday morning using the following step-by-step workflow:

1. **Check Coverage Report:**
   - Verify `Valid` vs `Excluded` count.
   - Inspect reasons for exclusion: "Crawled - currently not indexed" (indicates thin content); "Discovered - currently not indexed" (indicates crawl budget or internal linking deficit).
2. **Identify High-Opportunity Keywords (Striking Distance):**
   - Filter queries with Average Position between 5.0 and 20.0.
   - Sort by highest impressions.
   - For queries with high impressions but CTR $< 2\%$, optimize the Title tag and Meta description (test one variable at a time, observe over 14 days).
3. **Inspect Core Web Vitals:**
   - Confirm Mobile 75th percentile LCP $\le 2.0\text{ s}$, INP $\le 150\text{ ms}$, CLS $\le 0.05$.

---

## 3. Weekly Scorecard Template

```markdown
## Weekly Scorecard: [Week Ending YYYY-MM-DD] [source: Google Search Console export]

### 1. Indexing & Coverage
| Metric | Target | Actual | Delta vs Prior Week |
| :--- | :--- | :--- | :--- |
| **Total Pages in Sitemap** | - | - | - |
| **Indexed Pages (GSC)** | > 90% | - | - |
| **Excluded / Not Indexed** | 0 | - | - |
| **Soft 404 Flags** | 0 | - | - |

### 2. Search Traffic by Cluster
| Cluster | Weekly Impressions | Weekly Clicks | Avg Position | Top Query |
| :--- | :--- | :--- | :--- | :--- |
| **Target-Size & Resize** | - | - | - | - |
| **Photo Converters** | - | - | - | - |
| **Calculators** | - | - | - | - |
| **Text Utilities** | - | - | - | - |
| **Format Guides** | - | - | - | - |
| **Total** | - | - | - | - |
```

