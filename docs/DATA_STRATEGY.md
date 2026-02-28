# BZ Intelligence — Data Strategy

---

## The Core Argument

The AI is not our competitive advantage. Anyone can call the Claude API.

**The data is the moat.**

A curated, verified, Rwanda-specific knowledge base of companies, regulations, and market intelligence — built and maintained with rigorous quality standards — is what competitors cannot replicate quickly. It takes months of pipeline work, human review, and source relationships. Once built, it compounds: more data → better AI responses → more users → more user-flagged corrections → better data.

This document defines exactly how we build and maintain that moat.

---

## The Three Data Layers

### Layer 1: Regulatory & Government Data (The Authoritative Layer)

This is the foundation. It must be correct. A wrong date in a tax filing requirement or a missing license prerequisite can harm real users.

**Sources:**

| Source | What We Collect | Format | Update Method |
|--------|----------------|--------|---------------|
| **RDB (Rwanda Development Board)** | Company registration process, BPN documentation requirements, foreign company rules, special economic zones | PDFs, HTML | Weekly scrape + manual verification |
| **RRA (Rwanda Revenue Authority)** | TIN registration, VAT thresholds and registration, PAYE obligations, corporate tax rates and deadlines, eTax portal guides, withholding tax rules | PDFs, HTML, eTax portal | Monthly scrape + manual verification for tax year changes |
| **BNR (National Bank of Rwanda)** | PSP/payment service licensing, microfinance institution regulations, bancassurance rules, forex handling requirements, digital lending guidelines, AML/CFT obligations | PDFs (circulars, guidelines, annual reports) | Per-publication trigger |
| **RURA (Rwanda Utilities Regulatory Authority)** | ICT operator licensing, ISP permits, telecom infrastructure requirements, spectrum regulations, data protection obligations | PDFs | Per-publication trigger |
| **RSB (Rwanda Standards Board)** | Quality certification requirements by product category | PDFs | Per-publication trigger |
| **Official Gazette of Rwanda** | New laws, statutory instruments, ministerial orders | PDFs | Weekly scrape |
| **PSF (Private Sector Federation)** | Sector association memberships, industry codes of conduct | HTML, PDFs | Monthly |
| **RSSB (Rwanda Social Security Board)** | Employer registration, contribution rates, pension obligations | HTML, PDFs | Quarterly |
| **MIFOTRA / Labor Ministry** | Employment contract requirements, termination rules, minimum wage | PDFs, HTML | Per-publication |

**Quality standard for regulatory data:**
- Every document enters a review queue before publication
- A human reviewer confirms the content against the original source
- The document is tagged with: source URL, publication date, regulatory body, effective date, sector applicability
- Contradictions with existing data are flagged and resolved before publishing

**The "Last Verified" commitment:**
Every piece of regulatory data shown to users includes a "Last Verified" timestamp. We do not hide data freshness. If a regulation was last verified 6 months ago, users see that. This builds trust even when data is old — because honesty about freshness is more valuable than false confidence.

---

### Layer 2: Market Intelligence Data (The Intelligence Hub Fuel)

This layer powers the company directory and sector dashboards. It's less safety-critical than regulatory data (a wrong employee count doesn't harm users) but still requires rigor, because credibility in the intelligence product is what earns trust for the compliance product.

**Company Data Sources:**

| Source | Data Obtained | Method | Reliability |
|--------|--------------|--------|-------------|
| RDB Public Registry | Company name, legal status, registration date, BPN | API (where available) / scraping | High — authoritative |
| Company websites | Description, products, leadership, contact | Scraping + NLP extraction | Medium — self-reported |
| LinkedIn | Employee count (range), leadership, founded date, industry | Scraping (within ToS) | Medium — self-reported, often outdated |
| African startup databases (Partech, Disrupt Africa, WeeTracker) | Funding rounds, investors, valuations | Scraping + manual curation | Medium — journalism-sourced |
| Crunchbase | Funding data for larger companies | API | Medium |
| Google News / local media | News mentions, press releases, funding announcements | RSS + NLP | Medium — needs verification |
| App stores (Play Store, App Store) | App ratings, download estimates, product features | Scraping | Low — proxy metrics only |
| PSF sector directories | Sector membership, contact information | HTML | Medium |

**Company data processing pipeline:**
1. **Fetch** raw data from sources
2. **Entity resolution**: Is "Equity Bank Rwanda" the same as "Equity Group Rwanda"? Deduplicate aggressively.
3. **Confidence scoring**: Each data point gets a confidence score based on source quality and recency
4. **NLP enrichment**: Extract sector classification, sub-sector tags, geographic presence
5. **Human spot-check queue**: Random 10% of new records reviewed by a person before publish
6. **Profile published** with data source attribution and last-verified dates

**Funding Data Handling:**
Funding data is particularly unreliable in African markets. We apply these rules:
- Only report funding confirmed by at least 2 independent sources OR directly from the company
- Express funding as ranges when exact amounts are unclear ("raised between $1M–$5M in Series A")
- Always cite the source for funding claims
- "Unconfirmed" tag for single-source funding reports

---

### Layer 3: User Context Data (The Compliance Engine Fuel)

This is private per-organization data — uploaded documents, business profiles, compliance history. It never enters the shared knowledge base.

**What it includes:**
- Business Profile (sector, type, size, structure)
- Uploaded company documents (incorporation cert, licenses, tax certificates)
- AI-extracted metadata from documents (key dates, license types, registration numbers)
- Compliance step completion history
- AI chat history (session-level only — not stored long-term)

**What we never do with this data:**
- We do not train AI models on user-uploaded documents
- We do not use private data to enrich the public knowledge base
- We do not share private data across organizations
- We do not sell or license private data to third parties

**What we do with aggregate signals:**
- We may use anonymized, aggregated patterns (e.g., "which compliance steps do users most often get stuck on") to improve the product — never tied to individual organizations.

---

## Data Quality Framework

### The Four Quality Gates

Every data point passes through four gates before it's used in any AI response:

**Gate 1: Source Verification**
Does this data come from an authoritative source? Is the source URL valid and accessible? Is the document dated?

**Gate 2: Accuracy Check**
Does the content match the original source? (For regulatory data: human reviewer confirms. For company data: automated cross-reference against at least 2 sources.)

**Gate 3: Freshness Assessment**
How old is this data? Is it likely to still be accurate? Flag anything older than:
- 3 months for regulatory data (regulations change)
- 12 months for company profiles (companies evolve)
- 24 hours for news items (news has a shelf life)

**Gate 4: Conflict Resolution**
Does this data contradict existing knowledge base entries? If yes: queue for human review. Never allow contradictory data to coexist — resolve it.

---

## Data Classification Schema

Every document and data point in the knowledge base is tagged with:

```json
{
  "doc_type": "regulation | company_profile | sector_report | news | guideline",
  "reg_body": "BNR | RDB | RRA | RURA | RSB | RSSB | PSF | null",
  "sector_tags": ["fintech", "digital-lending"],
  "is_current": true,
  "effective_date": "2024-01-01",
  "source_url": "https://bnr.rw/...",
  "last_verified_at": "2025-01-15T10:00:00Z",
  "verified_by": "human | automated",
  "confidence": "high | medium | low",
  "supersedes": null
}
```

This metadata is used by the RAG pipeline to:
1. Filter before vector search (only search current, verified documents)
2. Rank results (high-confidence sources prioritized)
3. Include in citation output (users see exactly what was used)

---

## The Data Operations Process

### Weekly Rhythm

**Every Monday:**
- Automated pipeline checks for new publications from all government sources
- New documents queued for human review
- Stale records (past freshness threshold) queued for re-verification

**Every Wednesday:**
- Human reviewer processes the review queue
- Approved documents embedded and published
- Rejected documents flagged with reason

**Every Friday:**
- AI accuracy audit: sample 20 recent AI responses, verify against source documents
- Data gap report: which queries returned "I don't have data"? What's missing?
- Knowledge base health metric updated

### Triggered Processes (Event-Driven)

- **Official Gazette published** → Automated fetch → NLP extraction → Human review → Priority publish (within 48 hours of gazette publication)
- **BNR circular published** → Automated fetch → Priority human review → Compliance roadmap updated if affected
- **User flags inaccuracy** → Queued for review within 24 hours → User notified of outcome

---

## Getting the First Data (Bootstrap Strategy)

The data pipeline takes weeks to build. The product needs data now. Here's how we handle the bootstrap:

**Week 1–2: Manual Curation Sprint**
Two people spend one week manually curating the first dataset:
- 50 companies across 3 sectors (Fintech: 25, Agritech: 15, ICT: 10)
- Core compliance documents for all 3 sectors
- This is enough to run beta with real users

**Month 1–2: Pipeline Automation**
While users test the manually-curated data, the pipeline is built to automate ongoing data acquisition.

**Month 3+: Scale and Expand**
Pipeline running, human review cadence established, data growing with lower marginal cost per new record.

---

## The Data Moat Argument (For Investors)

**Why this data can't be replicated overnight:**

1. **Source relationships take time.** RDB doesn't have a clean API. BNR publications are inconsistently formatted PDFs. Building reliable pipelines for each source takes months of work and debugging.

2. **Verification is human-intensive.** Regulatory data requires legal knowledge to interpret correctly. Building a process for human review at scale is an organizational capability, not just a technical one.

3. **Data quality compounds.** As we find and fix errors, user trust grows. As user trust grows, users flag more errors. As errors get fixed, the knowledge base gets cleaner. This is a flywheel that takes time to start spinning.

4. **Sector-specific taxonomy is custom-built.** Rwanda's business ecosystem doesn't map cleanly to generic industry classification systems (SIC, NAICS). We've built a custom taxonomy that reflects how business is actually structured in Rwanda. That's an asset.

5. **Regulatory interpretation requires context.** The difference between a company that needs a full Banking License vs. a Microfinance License vs. a PSP License vs. no license depends on transaction types, volumes, counterparty types, and operational structure. Encoding that branching logic accurately takes legal expertise + time + testing. It's not something a competitor can copy from our UI.

---

## Data Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Regulation changes and we don't catch it | Medium | High | Automated gazette monitoring + weekly freshness checks + user reporting |
| Company data is outdated | High (inevitable) | Low | Clear "Last Verified" timestamps + user profile claiming |
| User relies on incorrect compliance guidance and faces legal/financial harm | Low | Very High | Mandatory legal disclaimer + human review for regulatory data + quarterly legal audit |
| Source website structure changes, breaking scraper | High | Medium | Pipeline monitoring alerts + fallback to manual fetch |
| RDB or BNR blocks our scraping | Medium | High | Build relationships for official data partnerships + manual alternatives |
| Competitor copies our data | Medium | Low | Data is a continuous process — a snapshot is less valuable than an operational capability. Our moat is the pipeline and process, not the data at a point in time. |
