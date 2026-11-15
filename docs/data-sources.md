# Gudmud Colleges: Data Provenance & Sourcing Documentation

This document specifies the data architecture, official public sources, and verification protocols governing the Gudmud Colleges discovery engine.

---

## 1. Core Architectural Constraints
1. **Zero Database / Zero Backend:** All institutional records, cutoffs, and rankings are compiled into static, immutable JSON artifacts at deploy time.
2. **Zero Lead-Capture / Zero Personal Data:** The application does not solicit student contact numbers, coaching subscriptions, or counseling fees. All client-side predictors run in-memory within the user's browser.
3. **No Unverified Data:** Every record contains a verifiable `provenance` metadata block linking directly to the issuing government entity.
4. **No Third-Party Scraping in Production:** The production build pipeline reads only committed local files in `data/raw/`.

---

## 2. Official Public Data Sources

| Authority | Domain / URL | Category / Ingested Data | Retrieval Date | Legal Basis |
| :--- | :--- | :--- | :--- | :--- |
| **Joint Seat Allocation Authority (JoSAA)** | `https://josaa.nic.in` | Opening & closing ranks for Round 5 across 119 participating institutes | 2026-11-15 | Public seat allocation reports |
| **National Institutional Ranking Framework (NIRF)** | `https://www.nirfindia.org` | Overall, Engineering, and University ranking scores and ranks | 2026-11-15 | Ministry of Education public release |
| **Central Seat Allocation Board (CSAB)** | `https://csab.nic.in` | Special round guidelines & NIT+ eligibility rules | 2026-11-15 | Central advisory council |
| **University Grants Commission (UGC)** | `https://www.ugc.gov.in` | State, Central, and Deemed University statutory registries | 2026-11-15 | UGC Act, 1956 Sections 2(f) & 12(B) |
| **National Board of Accreditation (NBA)** | `https://www.nbaind.org` | Washington Accord Tier-I & Tier-II program accreditation charters | 2026-11-15 | Statutory autonomous body |

---

## 3. Data Pipeline & Schema Validation

The ingestion and validation pipeline consists of:

```
data/raw/
  ├── josaa-institutes.json    (119 verified participating institutes)
  ├── programs.json            (12 standardized academic disciplines)
  ├── nirf-rankings.json       (74 verified NIRF 2024 & 2023 rankings)
  └── josaa-cutoffs-2024.json  (217 JoSAA Round 5 cutoff records)
           │
           ▼
scripts/build-data.ts  <── Validates against scripts/schema.ts (Zod)
           │
           ├── Checks: Positive integer ranks
           ├── Checks: Mandatory provenance block on every record
           ├── Checks: verified_at within past 12 months
           ├── Checks: Drift <= 20% vs previous build
           │
           ▼
src/data/ (colleges.json, nirf.json, programs.json, meta.json)
           &
public/data/cutoffs/ (Chunked by type: 2024-iit.json, 2024-nit.json, etc.)
```

---

## 4. Update Cadence & Maintenance
- **JoSAA Cutoffs:** Updated within 48 hours of official Round 5 seat allocation release during the June–July counseling cycle.
- **NIRF Rankings:** Updated annually following the Ministry of Education's official release (typically June–August).
- **Audit Verification:** Sourced URLs and provenance timestamps are audited bi-annually.
