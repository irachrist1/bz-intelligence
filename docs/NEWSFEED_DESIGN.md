# BZ Intelligence — Newsfeed Design Document

> Status: Design-complete, pre-implementation
> Last updated: 2026-03-01

---

## The Thesis

The BZ Intelligence newsfeed is not a news aggregator. It is a personal regulatory intelligence briefing. The difference is everything.

Google News shows you what happened. The BZ Intelligence newsfeed tells you what it means for *your specific business* — a fintech startup handling mobile payments, or a logistics company operating across three provinces, or a foreign-owned NGO collecting biometric data. The AI reads the raw announcement, understands your business profile, and translates the gap between "what the regulator said" and "what you need to do about it."

This document specifies how to build that — from the data sources we monitor, to the backend pipeline, to the UI that makes it feel like a premium financial intelligence terminal rather than an RSS reader.

---

## 1. Data Sources

### 1.1 Source Inventory

The following sources are the authoritative publishers of regulatory and business news affecting Rwanda-based businesses. Every source listed below is public, freely accessible, and non-paywalled.

---

**The New Times** (`newtimes.co.rw`)
- Business section: `newtimes.co.rw/business`
- Economy section: `newtimes.co.rw/economy`
- RSS: Available at `newtimes.co.rw/rss.xml` (general) — no dedicated business RSS feed, so scrape the section pages
- Update frequency: Multiple times daily
- Signal quality: High. The New Times is the dominant English-language newspaper and regularly breaks regulatory and business stories before official press releases. It covers RDB, RRA, BNR, RURA announcements as news events.
- Notes: Some articles are paywalled after a certain read count per session. The introductory paragraphs (visible in the HTML before the paywall overlay renders) are sufficient for our purposes — we need the lede, not the full text.

---

**BNL Rwanda** (`bnlrwanda.com`)
- Business section: `bnlrwanda.com/category/business`
- RSS: `bnlrwanda.com/feed` (standard WordPress RSS, includes full article text)
- Update frequency: Daily
- Signal quality: High. BNL (Business News Limited) Rwanda is a dedicated Rwandan business news outlet. It covers RDB company registrations, investment announcements, sector expansions, and regulatory changes with greater detail than The New Times. RSS feed is clean and well-structured.
- Notes: WordPress backend — HTML structure is consistent and predictable. Full article text is available in the RSS feed without scraping.

---

**Rwanda Development Board (RDB) — Official News**
- News section: `rdb.rw/news`
- Press releases: `rdb.rw/media-center/press-releases`
- RSS: Not available
- Update frequency: Weekly to bi-weekly
- Signal quality: Authoritative. All investment approvals, export permits, Special Economic Zone policy updates, and business registration changes are published here first.
- Notes: Static HTML, simple structure. Easy to scrape. Pages use consistent `article` or `div.news-item` patterns. Requires full-page load (no JavaScript rendering needed).

---

**National Bank of Rwanda (BNR) — Press Releases and Circulars**
- Press releases: `bnr.rw/press-releases`
- Circulars: `bnr.rw/regulations-and-guidelines/circulars`
- Monetary Policy Statements: `bnr.rw/monetary-policy/monetary-policy-statements`
- RSS: Not available
- Update frequency: Bi-weekly (press releases), irregular (circulars — whenever new regulations are issued)
- Signal quality: Critical. BNR circulars are among the most consequential documents for fintech, banking, microfinance, insurance, and any business that handles money. A new BNR circular on mobile money agents or digital lending can create immediate compliance obligations.
- Notes: BNR's site has changed structure multiple times. Use CSS selectors tied to the content container, not navigational elements. Circulars are published as PDFs — the pipeline must handle PDF extraction. Playwright required (some BNR pages use JavaScript rendering for pagination).

---

**Rwanda Revenue Authority (RRA) — Notices and Announcements**
- News and announcements: `rra.gov.rw/news-and-announcements`
- Tax notices: `rra.gov.rw/tax-information/tax-notices`
- RSS: Not available
- Update frequency: Weekly
- Signal quality: High. RRA announcements cover VAT threshold changes, PAYE guidance, tax incentive programs, and compliance deadlines. Directly affects every operating business.
- Notes: RRA's site uses JavaScript rendering. Playwright required. The site occasionally serves CAPTCHA to automated requests — use respectful rate limiting (minimum 5 seconds between requests) and a legitimate user-agent string.

---

**Official Gazette of Rwanda** (`gazeti.gov.rw`)
- Gazette listings: `gazeti.gov.rw/gazettes`
- Latest gazette: `gazeti.gov.rw/gazettes/latest`
- RSS: Not available
- Update frequency: Weekly (Gazettes are published on Mondays)
- Signal quality: Supreme authority. The Official Gazette is the legal record. Laws, statutory instruments, ministerial orders, and regulatory amendments only take full legal effect upon publication in the Gazette. For compliance purposes, the Gazette is the source of truth.
- Notes: Gazettes are PDFs. The pipeline must download and extract them. The table of contents within each Gazette PDF identifies the relevant sections (search for "Minister of Finance", "National Bank", "Rwanda Revenue", "Company Law"). PDF parsing with pdfplumber handles these cleanly. Each weekly Gazette can be 100–300 pages; only process sections relevant to business and regulatory matters.

---

**Private Sector Federation Rwanda (PSF)** (`psf.org.rw`)
- News: `psf.org.rw/news`
- Policy advocacy positions: `psf.org.rw/policy-advocacy`
- RSS: Not available
- Update frequency: Weekly to bi-weekly
- Signal quality: Medium-high. PSF represents Rwanda's private sector to the government. Their news often signals regulatory changes before they're formally published — consultations, memoranda, sector-specific dialogue outcomes. Also covers trade events (Made in Rwanda, Rwanda Business Forum) that are useful for Intelligence Mode users.
- Notes: Clean WordPress-style HTML. Easy to scrape.

---

**Rwanda Standards Board (RSB)** (`rsb.gov.rw`)
- News: `rsb.gov.rw/news`
- Standards publications: `rsb.gov.rw/standards`
- RSS: Not available
- Update frequency: Monthly
- Signal quality: Medium. Relevant for manufacturing, food processing, healthcare, and any company exporting products. RSB sets product standards; non-compliance can result in market withdrawal. Less urgent than BNR or RRA for most users, but critical for the sectors it touches.
- Notes: Static site. The standards catalogue is more useful for ingestion into the knowledge base than as a news source.

---

**Rwanda Information Society Authority (RISA)** (`risa.rw`)
- News: `risa.rw/news`
- Directives: `risa.rw/directives`
- RSS: Not available
- Update frequency: Monthly
- Signal quality: High for tech/ICT companies. RISA issues data protection directives, cybersecurity guidelines, and ICT licensing requirements. Critical for any business that collects_data=true or operates in the ICT sector.
- Notes: Site structure is clean. RISA publishes its directives as PDFs — the pipeline must handle these.

---

**Rwanda Utilities Regulatory Authority (RURA)** (`rura.rw`)
- Regulatory decisions: `rura.rw/regulatory-decisions`
- News: `rura.rw/news`
- RSS: Not available
- Update frequency: Monthly
- Signal quality: Medium-high for telecoms, energy, transport, and water sectors. RURA sets tariffs and licensing requirements for these industries.

---

**Additional Sources to Consider**

| Source | URL | Relevance |
|--------|-----|-----------|
| Ministry of Finance | minecofin.gov.rw/news | Budget updates, tax policy direction |
| Rwanda Social Security Board (RSSB) | rssb.rw/news | Pension, maternity, medical insurance compliance |
| Capital Market Authority (CMA) | cma.rw/news | For startups pursuing investment or listing |
| East African Community (EAC) | eac.int/news | For cross-border businesses in EAC market |
| KT Press | ktpress.rw/business | Secondary source, often picks up RDB/RRA stories |
| The Chronicles Rwanda | thechronicles.rw | Secondary source, English-language business coverage |

---

### 1.2 Source Priority Matrix

| Tier | Sources | Monitoring | Human Review Required? |
|------|---------|------------|----------------------|
| 1 — Critical | BNR, Official Gazette, RRA, RDB | Daily | Yes — before publishing as compliance items |
| 2 — High | RISA, PSF, RURA, RSB | Every 2 days | Yes for regulatory items, no for general news |
| 3 — Signal | New Times, BNL Rwanda, KT Press, The Chronicles | Daily | No — AI-summarized and auto-published |

Tier 1 items tagged as "regulatory" are never auto-published. They go into a review queue. A human verifies the AI's interpretation before the item is marked `is_reviewed = true`. This is the same data quality gate applied to the knowledge base.

---

## 2. Backend Architecture

### 2.1 The Pipeline at a Glance

```
Scheduled Cron (Railway or Vercel Cron)
         │
         ▼
    Crawler Service (Python / Playwright + BeautifulSoup)
         │  Fetches HTML / PDFs from all monitored URLs
         │  Checks against seen_urls table (dedup at source level)
         ▼
    Text Extractor
         │  HTML → clean text (trafilatura or goose3)
         │  PDF → text (pdfplumber, with table-of-contents parsing)
         ▼
    AI Processing Pipeline (Claude claude-haiku-4-5 for speed/cost)
         │  Step 1: Is this relevant to business compliance in Rwanda? (binary)
         │  Step 2: Classify: reg body, impact level, sector tags
         │  Step 3: Generate plain-language summary (2-3 sentences)
         │  Step 4: Generate "what this means for [sector]" snippets (per sector affected)
         │  Step 5: Detect compliance alert trigger (does this create a new obligation?)
         ▼
    Deduplication Check
         │  Vector similarity against recent news_items (past 30 days)
         │  If cosine similarity > 0.92 with existing item → mark as duplicate, skip
         ▼
    Review Queue (for Tier 1 sources)
         │  Human reviews in admin panel before is_reviewed = true
         │
         ▼ (Tier 2/3 auto-publish, Tier 1 waits for review)
    news_items table (Neon)
         │
         ▼
    User Feed Scoring (on-read, not pre-computed)
         │  Score against user's BusinessProfile at read time
         ▼
    Personalized Feed Served to User
```

---

### 2.2 Cron Scheduling

Use a hybrid approach:

**Vercel Cron** (in `vercel.json`) — lightweight check every 2 hours that pings a Next.js API route:
```json
{
  "crons": [
    {
      "path": "/api/cron/newsfeed-ping",
      "schedule": "0 */2 * * *"
    }
  ]
}
```

This ping route checks if the Railway pipeline is running and, if not, triggers it. Vercel Cron is free on the hobby plan and handles the scheduling without needing a dedicated cron daemon.

**Railway Cron Worker** — the actual scraping and processing happens here. Railway's cron scheduler runs at configured intervals and executes the Python pipeline. No timeout constraints (unlike Vercel's 30-second function limit).

Railway cron schedule:
- Tier 1 sources: every 6 hours
- Tier 2 sources: every 12 hours
- Tier 3 sources: every 24 hours
- Official Gazette: Monday 08:00 Rwanda time (CAT, UTC+2)

---

### 2.3 Web Scraping — Responsible Approach

The goal is to read public information that any human could read in a browser. This is not ethically or legally problematic. The principles:

1. **Respect `robots.txt`** — check before scraping any new domain. If a path is disallowed, do not scrape it. For the sources listed, none currently restrict news/press release sections in their robots.txt.

2. **Rate limiting** — never send more than 1 request per 5 seconds to any single domain. Add jitter (random 1–3s delay between requests).

3. **User-Agent** — send a descriptive, honest user agent: `BZIntelligence-NewsfeedBot/1.0 (+https://bzintelligence.com/bot)`

4. **Cache aggressively** — store the raw HTML/PDF per URL in Cloudflare R2 with a 24-hour TTL. If the Cron runs every 6 hours but the content hasn't changed (compare ETag or content hash), skip processing.

5. **No login bypass** — only scrape content publicly accessible without authentication.

6. **No rate-abuse** — if the scraper receives a 429 or 503 response, back off exponentially and do not retry for at least 1 hour for that domain.

**Technical stack for scraping:**

```python
# For static HTML pages (RDB, PSF, BNL RSS)
import httpx
from bs4 import BeautifulSoup
import trafilatura  # best-in-class article text extraction

# For JavaScript-rendered pages (RRA, BNR pagination)
from playwright.async_api import async_playwright

# For PDFs (BNR circulars, RISA directives, Official Gazette)
import pdfplumber

# For RSS feeds (BNL Rwanda — clean WordPress RSS)
import feedparser
```

The `trafilatura` library is purpose-built for extracting clean article text from HTML pages. It removes navigation, ads, and boilerplate more reliably than manual CSS selectors. Use it as the primary extractor and fall back to manual `BeautifulSoup` parsing for sites it fails on.

---

### 2.4 AI Processing Pipeline

Each article runs through a structured 5-step pipeline using `claude-haiku-4-5-20251001` (fast, cheap — $0.25/M input tokens). The pipeline uses `generateObject` with Zod schemas for typed output at each step.

**Step 1: Relevance gate**

```typescript
const relevanceSchema = z.object({
  isRelevant: z.boolean(),
  reason: z.string().max(100),
})
```

Prompt: *"Is this article relevant to business compliance, regulation, or market intelligence in Rwanda? Answer yes/no with a brief reason."*

Discard anything below this gate. Expected discard rate: ~60% for Tier 3 sources (news sites publish a lot of non-business content).

**Step 2: Classification**

```typescript
const classificationSchema = z.object({
  regBodyCode: z.enum(['BNR', 'RRA', 'RDB', 'RISA', 'RURA', 'RSSB', 'RSB', 'PSF', 'OTHER', 'NONE']),
  impactLevel: z.enum(['high', 'medium', 'low']),
  sectorTags: z.array(z.string()).max(5),
  isComplianceAlert: z.boolean(), // does this create a new obligation or deadline?
  complianceAlertReason: z.string().optional(),
  appliesTo: z.object({
    handlesMoney: z.boolean(),
    collectsData: z.boolean(),
    foreignOwnership: z.boolean(),
    hasEmployees: z.boolean(),
    operatesProvince: z.boolean(),
  }),
})
```

The `appliesTo` object is the personalization key. It maps directly to the boolean flags in `BusinessProfile`.

**Impact level heuristics provided to the AI:**
- `high`: Creates a new legal obligation, sets a deadline, changes a fee, or announces enforcement action
- `medium`: Announces a consultation, changes a process, or signals upcoming policy change
- `low`: General market intelligence, industry awards, international partnerships with no direct regulatory effect

**Step 3: Plain-language summary**

Two summaries generated per item:

1. `summary` — 2-3 sentence factual summary of what was announced (for card display)
2. `plainSummary` — Same content but written as if explaining to a non-lawyer founder: no jargon, active voice, "what you need to know" framing

Prompt injection for plainSummary: *"Explain this in plain English to a Rwandan business founder who is not a lawyer. What happened? Why does it matter? No jargon."*

**Step 4: Sector-specific "what it means for you" snippets**

For each sector tag on the item, generate a short (1-2 sentence) sector-specific implication snippet. These are stored in a `sectorImplications` JSONB field:

```typescript
// Stored as JSONB in news_items
sectorImplications: {
  fintech: "Mobile money operators must update their agent network reporting by Q2 2026.",
  banking: "Commercial banks need to file updated liquidity ratio disclosures within 90 days.",
  general: "All businesses handling customer payments should review their PSP licensing status."
}
```

This is the differentiating layer. When a fintech user reads this item, they see the fintech implication. When a general SME user reads it, they see the general implication. Same item, different lens.

**Step 5: Compliance alert flag**

If `isComplianceAlert = true` from Step 2, the system generates a structured alert:

```typescript
const alertSchema = z.object({
  alertTitle: z.string().max(80),
  deadline: z.string().optional(), // ISO date if a specific deadline is mentioned
  action: z.string().max(200), // "What you should do"
  affectsProfileFlags: z.array(z.enum(['handlesMoney', 'collectsData', 'foreignOwnership', 'hasEmployees']))
})
```

Compliance alerts surface differently in the UI (red border, alert badge) and can optionally trigger email notifications.

---

### 2.5 Deduplication Strategy

The same story will often appear from multiple sources — The New Times picks up a BNR press release, BNL Rwanda covers it, then PSF comments on it. We want one canonical item per story, not three.

**Two-layer dedup:**

**Layer 1: URL-level dedup** — `seen_urls` table stores every URL ever fetched. If a URL has been processed, skip it. This handles the "same article fetched twice" case.

**Layer 2: Semantic dedup** — After generating the embedding for the new item's summary, run a vector similarity check against all `news_items` published in the past 14 days. If cosine similarity > 0.92, this is a duplicate story. Merge the source attribution (the newer item's source is appended to `dataSources` array on the canonical item) and discard the new item.

At 0.92 threshold: "BNR announces new digital lending framework" from The New Times and "National Bank releases digital lending guidelines" from BNL Rwanda will be correctly identified as the same story. "BNR announces new digital lending framework" and "BNR increases policy rate to 7.5%" will not be merged.

The canonical item always uses the highest-tier source. BNR's own press release is canonical over The New Times' coverage of it.

---

### 2.6 Schema Extensions to `news_items`

The existing `news_items` table (in `lib/db/schema/public.ts`) needs these additional columns:

```typescript
// New columns to add to newsItems table
fetchedFrom: text('fetched_from'),            // the exact URL scraped
sourceUrl: text('source_url'),                // canonical URL (may differ from fetchedFrom)
sourceTier: integer('source_tier'),           // 1, 2, or 3
sectorImplications: jsonb('sector_implications'), // {fintech: "...", banking: "...", general: "..."}
appliesTo: jsonb('applies_to'),               // {handlesMoney, collectsData, foreignOwnership, ...}
isComplianceAlert: boolean('is_compliance_alert').default(false),
alertTitle: text('alert_title'),
alertDeadline: date('alert_deadline'),
alertAction: text('alert_action'),
embedding: vector('embedding', { dimensions: 1024 }),  // for semantic dedup
canonicalItemId: uuid('canonical_item_id'),    // if this is a dupe, points to canonical
dataSources: text('data_sources').array(),    // all sources that reported this story
readCount: integer('read_count').default(0),  // aggregate, not per-user
```

New table: `news_seen_urls` — tracks every URL ever processed to prevent reprocessing:

```typescript
export const newsSeenUrls = pgTable('news_seen_urls', {
  id: uuid('id').primaryKey().defaultRandom(),
  url: text('url').unique().notNull(),
  contentHash: text('content_hash'),
  processedAt: timestamp('processed_at', { withTimezone: true }).defaultNow(),
  resultItemId: uuid('result_item_id'), // null if discarded at relevance gate
})
```

New table: `user_news_reads` — per-user read state (see Section 6):

```typescript
export const userNewsReads = pgTable('user_news_reads', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: text('user_id').notNull(),
  orgId: text('org_id').notNull(),
  newsItemId: uuid('news_item_id').references(() => newsItems.id).notNull(),
  readAt: timestamp('read_at', { withTimezone: true }).defaultNow(),
  savedAt: timestamp('saved_at', { withTimezone: true }), // null = not saved
})
```

---

## 3. Personalization Logic

### 3.1 The Relevance Score

Every news item gets scored against a user's `BusinessProfile` at read time. This is a simple weighted scoring function — not ML. It is deterministic, debuggable, and fast.

```typescript
function scoreNewsItemForProfile(
  item: NewsItem,
  profile: BusinessProfile
): number {
  let score = 0

  // ── Sector match (highest weight) ──────────────────────────────────────────
  if (profile.sector && item.sectorTags?.includes(profile.sector)) {
    score += 40
  }
  if (profile.subSector?.some(s => item.sectorTags?.includes(s))) {
    score += 15
  }

  // ── Compliance flag matches (creates compliance obligation for this user) ──
  if (profile.handlesMoney && item.appliesTo?.handlesMoney) score += 25
  if (profile.collectsData && item.appliesTo?.collectsData) score += 20
  if (profile.foreignOwnership && item.appliesTo?.foreignOwnership) score += 15
  if (profile.employeeRange && profile.employeeRange !== '1' && item.appliesTo?.hasEmployees) score += 10
  if (profile.operatesProvince && item.appliesTo?.operatesProvince) score += 10

  // ── Impact level bonus ─────────────────────────────────────────────────────
  if (item.impactLevel === 'high') score += 15
  if (item.impactLevel === 'medium') score += 5

  // ── Compliance alert bonus ────────────────────────────────────────────────
  if (item.isComplianceAlert) score += 20

  // ── Recency decay ──────────────────────────────────────────────────────────
  const ageHours = (Date.now() - new Date(item.publishedAt).getTime()) / 3_600_000
  if (ageHours < 24) score += 10
  if (ageHours > 72) score -= 5
  if (ageHours > 168) score -= 15 // older than 1 week

  return Math.max(0, score)
}
```

Items with a score of 0 are shown in a "General Updates" section with reduced prominence. Items with a score >= 35 appear in the main "For You" feed. Items with a score >= 60 get "Highly Relevant" treatment.

### 3.2 The "Zero Inbox" Problem

Two failure modes to avoid:

**Too empty:** The user sees "No news matching your profile." This destroys trust. The product looks broken. Users who made it through onboarding have invested time; they expect something.

**Too full:** The user sees 40 items on first load. Firehose. Overwhelming. They don't know what to read. They disengage.

**The solution:** The feed always shows exactly the 5 most relevant items in the primary "For You" section, regardless of how many items scored highly. If there are only 2 high-scoring items, show those 2 at the top and fill the remaining 3 from the best available general items (high impact, recent, from Tier 1 sources).

Below the primary 5, a "More Updates" section shows the next 10-15 items in a more compact format. This section is collapsed by default on first load.

If the user has no business profile yet (completed onboarding but didn't set sector), show the 5 most recent high-impact items across all sectors with an inline prompt: "Personalize your feed by completing your business profile."

The feed is never empty. Even before any automated pipeline is running, the manually curated seed items (Phase 1) populate it.

### 3.3 Sector Mapping

Sectors used across the platform (defined in `businessProfiles.sector`):

| Profile Sector | News Sector Tags to Match |
|---------------|--------------------------|
| fintech | fintech, banking, payments, microfinance, insurance |
| ict | ict, technology, digital, cybersecurity, data_protection |
| agriculture | agriculture, agritech, food_processing, export |
| manufacturing | manufacturing, standards, export, industrial |
| hospitality | hospitality, tourism, food_beverage |
| healthcare | healthcare, pharmaceuticals, medical |
| logistics | logistics, transport, infrastructure |
| education | education, edtech |
| real_estate | real_estate, construction, property |
| general | (matches all items — fallback) |

### 3.4 Compliance Alert Routing

When `isComplianceAlert = true` and the item's `affectsProfileFlags` array overlaps with the user's profile flags, the item is automatically elevated to a compliance alert, regardless of its raw score. It bypasses the 5-item limit and appears in a dedicated "Compliance Alerts" section above the regular feed.

Example: BNR issues a new circular on digital lending. The item is tagged `isComplianceAlert: true`, `affectsProfileFlags: ['handlesMoney']`. A user whose profile has `handlesMoney: true` sees this in the "Compliance Alerts" section with a red badge and a direct action: "Read this and update your PSP licensing assessment."

---

## 4. UI Design

### 4.1 Design Principles

The newsfeed should feel like receiving the morning edition of *The Economist* crossed with a Bloomberg Terminal alert — but at consumer-grade beauty. Not a list of links. Not a blog. A curated intelligence briefing.

References:
- **Card layout**: Readwise Reader's "inbox" view — clean typographic hierarchy, no visual noise, the text is the hero
- **Alert system**: Stripe's Dashboard alerts — color is used sparingly, only when something genuinely requires attention
- **Information density**: Apple News+ for iPad — comfortable whitespace, magazine-quality typography, nothing feels cramped
- **Category pills**: Linear's label system — minimal, monochromatic, not a rainbow

Three rules that override everything else:
1. No element competes for attention with the headline
2. Color only appears when it carries information (red = action required, amber = worth watching)
3. The AI summary is the product, not the link to the original article

---

### 4.2 Feed Layout — Top Level

```
┌─────────────────────────────────────────────────────────┐
│  INTELLIGENCE BRIEFING          Mon, 3 Mar 2026    [▼]  │
│  Personalized for Acme Fintech Ltd                       │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│ COMPLIANCE ALERTS  ●  2 new                             │
│─────────────────────────────────────────────────────────│
│ ┌───────────────────────────────────────────────────┐   │
│ │ !! BNR   HIGH IMPACT                              │   │
│ │                                                   │   │
│ │ New Digital Lending Regulation Requires           │   │
│ │ Updated Consumer Disclosure Forms by April 30     │   │
│ │                                                   │   │
│ │ All licensed digital lenders must update their    │   │
│ │ loan application forms to include new APR         │   │
│ │ disclosure requirements before the deadline.      │   │
│ │                                                   │   │
│ │ What this means for fintech: Your loan            │   │
│ │ application flow needs to be updated. The         │   │
│ │ penalty for non-compliance is license suspension. │   │
│ │                                                   │   │
│ │ BNR Press Release · 2 Mar 2026     [Read more →] │   │
│ └───────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│ FOR YOU                                          [○ ○ ●] │  ← 3 filter pills: All · Unread · Saved
│─────────────────────────────────────────────────────────│
│  [card 1]  [card 2]  [card 3]  [card 4]  [card 5]       │
│─────────────────────────────────────────────────────────│
│  More Updates ▾  (collapsed, 12 more items)             │
└─────────────────────────────────────────────────────────┘
```

The header shows today's date and the org name. The `[▼]` is a discrete digest toggle — explained in Section 4.7. The dot `●` on "COMPLIANCE ALERTS" is a notification-style unread indicator.

The three filter pills (All / Unread / Saved) in the "FOR YOU" section replace the current reg body filter bar. Filtering by reg body is an advanced use case that should not dominate the primary UI. Move reg body filtering into the detail view and the search/filter panel (Section 4.5).

---

### 4.3 News Card Design

Two card sizes: **Primary** (full width, used for top 5 items) and **Compact** (used in "More Updates" and "Saved").

**Primary Card:**

```
┌──────────────────────────────────────────────────────────────┐
│  BNR  ·  medium impact           ← left: source + impact     │
│                                                               │
│  Rwanda Raises Base Lending Rate to 7.5%                     │  ← Title: 17-18px, semibold
│                                                               │
│  The National Bank of Rwanda increased the central bank      │  ← AI plain summary: 14px, zinc-600
│  rate by 50 basis points. This is the second increase this   │
│  year and signals continued inflation-targeting pressure.     │
│                                                               │
│  ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─  │
│                                                               │
│  For your business:  Expect higher borrowing costs for any   │  ← Sector implication: 13px, zinc-700
│  working capital facilities. Review your credit line terms.   │  ← subtle left border accent
│                                                               │
│  New Times  ·  2 Mar 2026                   [bookmark] [→]  │  ← source, date, save + open icons
└──────────────────────────────────────────────────────────────┘
```

Visual treatment details:
- White background (light mode), `zinc-900` background (dark mode)
- `1px solid zinc-200` border (light), `zinc-800` (dark)
- High impact: `border-l-4 border-l-red-400` + red dot next to "high impact" label
- Medium impact: `border-l-4 border-l-amber-400` + amber dot
- Low impact: no left border accent
- Compliance alert: full `ring-2 ring-red-300 dark:ring-red-800` treatment
- The "For your business:" section has a subtle `bg-zinc-50 dark:bg-zinc-800/50` background and `rounded-md` treatment to visually distinguish the AI-generated implication from the factual summary
- The `[bookmark]` and `[→]` actions are invisible until hover (opacity-0 → opacity-100 on card hover)
- Read items have reduced opacity: `opacity-70` on the title

**Compact Card (for "More Updates" section):**

```
┌─────────────────────────────────────────────────────────────┐
│  RRA · low    RRA Updates e-Filing System for VAT Returns   │
│               RRA has launched an updated portal. Existing  │  ← 2-line max
│               users must re-register their credentials.     │
│               RRA · 1 Mar 2026                  [→]        │
└─────────────────────────────────────────────────────────────┘
```

Compact cards have no "For your business" section. That only appears in the detail view.

---

### 4.4 Article Detail View — The Immersive Read

When a user clicks a card, it opens in a full-screen overlay (not a new page, not a side panel — a full takeover). This is the most important UI decision. A side panel feels timid. A new route loses context. The full overlay communicates: this is worth your full attention.

The overlay slides in from the bottom on mobile, from the right on desktop. Keyboard shortcut: `Esc` to close.

```
┌─────────────────────────────────────────────────────────────────┐
│  [← Back to Briefing]                [bookmark] [↗ original]   │
│─────────────────────────────────────────────────────────────────│
│                                                                 │
│  ●  HIGH IMPACT   BNR   FINTECH                                 │  ← pill row, large
│                                                                 │
│  New Digital Lending Regulation Requires Updated                │  ← title: 26px, semibold
│  Consumer Disclosure Forms by April 30                          │
│                                                                 │
│  BNR Press Release  ·  Published 2 March 2026                  │  ← source metadata, muted
│─────────────────────────────────────────────────────────────────│
│                                                                 │
│  WHAT HAPPENED                                                  │  ← section label: 10px, uppercase, tracking-wide
│                                                                 │
│  The National Bank of Rwanda issued Circular BK/DIR/01/2026    │  ← AI plain-language summary, full length
│  on 2 March 2026, requiring all licensed digital lenders to    │
│  update consumer-facing loan application materials to include  │
│  Annual Percentage Rate (APR) disclosure, total cost of        │
│  credit, and a cooling-off period notice...                     │
│                                                                 │
│─────────────────────────────────────────────────────────────────│
│                                                                 │
│  WHAT IT MEANS FOR ACME FINTECH LTD                            │  ← personalized section label
│                                                                 │
│  Your digital lending product is directly affected. You must:  │  ← sector implication, full length
│  1. Update your loan application UI to show APR prominently    │
│  2. Add a 24-hour cooling-off period mechanism                 │
│  3. File a compliance confirmation with BNR by April 30        │
│                                                                 │
│  The penalty for non-compliance is license suspension. This    │
│  is not a suggestion — it is a regulatory requirement with a   │
│  hard deadline.                                                 │
│                                                                 │
│─────────────────────────────────────────────────────────────────│
│                                                                 │
│  KEY DATES                                                      │  ← only shown when deadline exists
│  ─────────────────────────────────────────────────────────────  │
│  Compliance deadline:  April 30, 2026  (58 days away)          │
│                                                                 │
│─────────────────────────────────────────────────────────────────│
│                                                                 │
│  ASK ABOUT THIS ARTICLE                                         │  ← AI chat section
│  ─────────────────────────────────────────────────────────────  │
│                                                                 │
│  [ai icon]  Chat with BZ Intelligence about how this           │
│             regulation affects your specific business.          │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  "What do I need to change in my loan application..."   │   │
│  │                                                    [→] │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│─────────────────────────────────────────────────────────────────│
│                                                                 │
│  SOURCE                                                         │
│  ─────────────────────────────────────────────────────────────  │
│  Original BNR Press Release                                     │
│  bnr.rw/press-releases/circular-bk-dir-01-2026  [↗]           │
│  Published: 2 March 2026                                        │
│  Also reported by: The New Times, BNL Rwanda                   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**The "Ask about this article" chat section is the product's most powerful feature.** This is not a generic "ask Claude anything" field. It is pre-loaded with context: the article content, the AI's summary, and the user's business profile. The system prompt behind this chat is:

*"You are a Rwanda business compliance advisor. The user is reading [article title] about [regulatory body]. Their business profile: [sector, bizType, handlesMoney, collectsData, employeeRange]. The article contains: [full article text + AI summary + sector implication]. Answer their question in the context of their specific business. Be direct. Cite the article."*

Suggested prompts appear below the input when the user hasn't typed yet:
- "Does this apply to my business?"
- "What do I need to do and by when?"
- "How does this compare to the previous regulation?"
- "Show me the relevant section of my compliance roadmap"

When the user sends a message from this context, it opens the full compliance chat (in a new chat session) pre-seeded with the article context. This is the handoff from "reading" to "acting."

---

### 4.5 Filter System

The current filter bar (reg body pills) is replaced with a more elegant system:

**Primary filter** — three tabs built into the "FOR YOU" section header:
- `All` — everything scored for your profile
- `Unread` — items you haven't opened yet
- `Saved` — items you bookmarked

**Secondary filter** — a single `Filter` button (funnel icon) that opens a compact sheet (slides in from right, 320px wide on desktop) with:

```
FILTER

Regulatory Body
[○] All  [●] BNR  [○] RRA  [○] RDB  [○] RISA  [○] RURA

Impact Level
[●] High  [●] Medium  [○] Low

Date Range
[Last 7 days ▾]

Sector
[Your sector (default) ▾]

[Reset]                    [Apply filters]
```

This keeps the filter UI out of the main content area. It is a power-user feature, not the primary way people use the feed.

---

### 4.6 Empty State and First-Load Experience

**Empty state is abolished.** The feed never shows a "no items" message. Instead:

- If the pipeline hasn't run yet (Phase 1, manual content only), the feed shows the manually seeded news items with a top banner: "Your personalized feed will be ready when we add more content. Here are the most recent updates in the meantime."
- If the user has not completed their business profile, show the 5 most recent high-impact items globally, with a prominent but non-blocking inline card: "Complete your profile to get a fully personalized briefing."
- If truly nothing exists (fresh install, zero rows in `news_items`): show a skeleton loader first, then transition to a "Setting up your briefing" state with an animated loading indicator and "We're curating your first briefing. Check back in a few hours." — never the word "no results."

**First-load animation:** Cards animate in sequentially, each with a 50ms stagger delay. Not a flashy animation — just enough to feel alive. 200ms ease-in-out fade + 10px upward translate. This is how Linear animates list items.

---

### 4.7 The "Daily Briefing" Concept

The header of the newsfeed reads: **"INTELLIGENCE BRIEFING · Mon, 3 Mar 2026"**

The `[▼]` button next to the date collapses the entire feed into a distilled 3-sentence "briefing summary" — a single paragraph generated by Claude that summarizes the 5 most relevant items for this user today:

```
Today's briefing for Acme Fintech Ltd: BNR has issued a new digital lending
circular requiring updated disclosure forms by April 30 — this affects your
business directly. RRA has confirmed the extension of the SME tax relief
program through Q3 2026. The PSF has published a consultation on fintech
licensing reform; public comments close March 15.

[Expand full briefing]
```

This is a gesture toward the premium "executive summary" feel. It also solves the "I'm busy, just tell me what matters" use case.

The briefing summary is generated once per day per user, cached in Upstash Redis with a 24-hour TTL (key: `briefing:{userId}:{date}`). It is generated on the first page load of the day — if the cache is cold, it generates synchronously on load (acceptable, since it's fast with Haiku) and then caches.

---

### 4.8 Visual Language Summary

| Element | Light Mode | Dark Mode |
|---------|-----------|-----------|
| Page background | `zinc-50` | `zinc-950` |
| Card background | `white` | `zinc-900` |
| Card border | `zinc-200` | `zinc-800` |
| Title text | `zinc-900` | `zinc-100` |
| Body text | `zinc-600` | `zinc-400` |
| Muted / metadata | `zinc-400` | `zinc-600` |
| High impact accent | `red-400` | `red-600` |
| Medium impact accent | `amber-400` | `amber-600` |
| Compliance alert ring | `red-300` | `red-800` |
| "For your business" bg | `zinc-50` | `zinc-800/50` |
| AI chat input | `zinc-100` | `zinc-800` |
| Section labels | `zinc-400`, 10px, uppercase, tracking-widest | same |

Typography: System font stack (`-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif`). No custom font needed — the content is the product, not the typeface. This also eliminates a network request.

---

## 5. Differentiation

### 5.1 What We Are Not

We are not Google News. We are not an RSS aggregator. We are not a Rwandan news site.

The problem with those products in this context: they deliver raw information and leave interpretation to the reader. A Rwanda founder reading "BNR issues circular on electronic money institutions" on Google News must:
1. Find the actual circular
2. Read 40 pages of regulatory language
3. Figure out if it applies to their specific business type
4. Determine what actions are required
5. Know the deadline
6. Understand the consequences of non-compliance

This process takes 2-4 hours for someone with legal training. For a founder without that background, it may never happen — and they'll miss a compliance deadline.

BZ Intelligence compresses that entire process into 30 seconds. The AI has already read the circular, understood the user's business profile, and written a plain-English brief that says exactly what to do and by when.

### 5.2 The Compliance Connection

This is the structural moat: the newsfeed is connected to the compliance system.

When a news item triggers a compliance alert (`isComplianceAlert: true`) and it matches a user's profile flags, the system checks whether there is an existing compliance step in the user's roadmap that is now affected. If yes, the news card displays: "This may affect step 4 of your compliance roadmap: BNR Payment Service Provider License."

From the article detail view, the user can click "Update my roadmap" — which opens the compliance roadmap with the relevant step highlighted and a note: "Updated per BNR Circular BK/DIR/01/2026 (March 2026)."

No generic news aggregator can do this. It requires the integrated compliance knowledge base, the user's business profile, and the connected roadmap system — all three of which exist only in BZ Intelligence.

### 5.3 The Data Quality Moat

Every item in the feed that originates from a Tier 1 regulatory source (BNR, RRA, RDB, Official Gazette) goes through human review before being published. The AI's interpretation of a regulatory announcement is verified by a human reviewer before it is surfaced as a compliance alert.

This is not feasible for a generic news product. It is feasible for us because we are narrowly focused on Rwanda regulatory content, which produces 10-30 new Tier 1 items per week. That is a manageable human review queue.

The trust that comes from this quality gate is the business model. Founders pay for BZ Intelligence because they trust it. They trust it because it has never told them the wrong thing.

---

## 6. Read State and Saved Articles

### 6.1 Tracking Read State

Read state is tracked server-side, per user, in the `user_news_reads` table. Not localStorage — localStorage is per-device and invisible to our analytics.

When a user opens an article detail view (clicks a card), a `POST /api/news/read` call is fired immediately:

```typescript
// POST /api/news/read
body: { newsItemId: string }
// Creates row in user_news_reads if not exists
// Returns nothing — fire and forget
```

This is a non-blocking background call. The article detail view opens immediately; the read state update happens asynchronously.

A news item is considered "read" when a row exists in `user_news_reads` for the user+item combination. Read items receive reduced visual weight in the feed (`opacity-70` on the title, no left border accent).

The "Unread" filter tab shows count in parentheses: `Unread (7)`.

### 6.2 Saving Articles

The bookmark icon on each card triggers `POST /api/news/save`. This sets `savedAt` on the existing `user_news_reads` row (or creates one with both `readAt` and `savedAt` set).

The "Saved" tab shows only items where `savedAt` is not null, sorted by most recently saved.

### 6.3 Briefing History View

A dedicated "History" view (accessible from the sidebar, below "Newsfeed") shows all articles from the past 30 days, organized by date, with read/unread status.

```
BRIEFING HISTORY

─── Today, Monday 3 March 2026 ──────────────────────────────
  ● BNR: New Digital Lending Circular (Compliance Alert)
  ✓ RRA: e-Filing System Update                              ← ✓ = read

─── Yesterday, Sunday 2 March 2026 ──────────────────────────
  ✓ PSF: Fintech Sector Consultation Published
  ✓ New Times: Rwanda SME Growth Report 2025

─── Friday, 28 February 2026 ────────────────────────────────
  ✓ BNR: Monetary Policy Rate Announcement
  ✓ RDB: Q4 2025 Investment Report Released

[Load older articles...]
```

This view does not score or re-rank items. It is a chronological record. Items are shown with their original impact badges and read status. The goal is "I remember reading something last week about X" — a searchable memory of your briefings.

A search input at the top of History allows filtering by keyword. This is a simple `ILIKE '%keyword%'` query on `news_items.title` and `news_items.plainSummary`, filtered to the user's `user_news_reads` join.

---

## 7. Implementation Phases

### Phase 1 — Manual Curated Feed with Personalization (Current)

**Already built:**
- `news_items` table with sector tags, impact level, reg body code, plain summary
- Newsfeed page with sector-based personalization (`sectorOverlap` SQL query)
- Filter bar (reg body pills)
- `ImpactBadge` and `RegBodyBadge` components
- `NewsCard` component

**To complete in Phase 1:**

1. Manually seed 15-25 high-quality news items covering the most recent 2 months of Rwanda regulatory activity. These become the baseline content.

2. Add the `user_news_reads` table and `news_seen_urls` table to the schema. Run `db:push`.

3. Add the `sectorImplications` JSONB column and `appliesTo` JSONB column to `news_items`. Manually populate for the seed items.

4. Rebuild the newsfeed UI according to this document — replace the current simple card + filter bar with the Primary Card design, the "FOR YOU" section layout, and the three-tab filter.

5. Build the article detail overlay. The "Ask about this article" chat section in Phase 1 is a static prompt that links to the compliance chat pre-populated with a message — full context injection comes in Phase 2.

6. Wire up read state tracking with `user_news_reads`.

7. Add the Compliance Alerts section to the feed (for manually flagged items with `isComplianceAlert = true`).

**Phase 1 success:** A manually curated feed that feels personalized and premium, even though every item is hand-entered. Founders see it and think "this was built for me." No automated pipeline, no scraping — just good editorial judgment and clean UI.

---

### Phase 2 — RSS Feed Ingestion with AI Processing

**What changes:**
- Add the Python pipeline service on Railway
- Implement RSS feed readers for BNL Rwanda (clean WordPress RSS) and The New Times
- Add the AI processing pipeline (Steps 1-5) using `claude-haiku-4-5-20251001` via `generateObject`
- Implement semantic deduplication with pgvector
- Add the `news_seen_urls` table and URL-level dedup
- Implement Vercel Cron + Railway Cron scheduling
- Build the admin review queue UI (simple Next.js admin route, auth-protected) for Tier 1 items
- Connect article context to the compliance chat (pre-seed conversation with article content and user profile)
- Add the "Daily Briefing" summary generation (Upstash Redis cache)
- Build the Briefing History view

**Phase 2 success:** The feed updates automatically at least daily without manual entry. Founders receive compliance alerts within hours of BNR or RRA publishing. The AI chat in the detail view has full article context.

---

### Phase 3 — Full Web Scraping and Real-Time Monitoring

**What changes:**
- Add Playwright-based scraping for JavaScript-rendered sites (RRA, BNR, RURA)
- Add PDF extraction for Official Gazette, BNR circulars, RISA directives
- Full compliance alert routing: detected alerts are automatically checked against all user profiles and queued for targeted notification
- Schema-based compliance roadmap connection: when a news item affects an existing compliance step, the step is flagged as "may require review"
- Monitoring for newly published items (check for new content every 2 hours for Tier 1 sources, every 6 hours for Tier 2/3)
- `dataSources` array on news items: show "Also reported by 2 other sources" in the detail view

**Phase 3 success:** Comprehensive, near-real-time coverage of all major Rwanda regulatory sources. No human entry required for Tier 2/3 items. Tier 1 items have automated draft + human review workflow.

---

### Phase 4 — Push Notifications and Email Digest

**What changes:**
- Email digest (Resend): weekly opt-in email with the 5 most relevant items for each user, formatted in React Email with the same card hierarchy as the feed. Subject line: "Your Rwanda Business Briefing — Week of [date]"
- Push notifications (Web Push API): opt-in, only for `isComplianceAlert: true` items that directly match the user's profile flags. Not for general news — push notifications are reserved exclusively for genuine compliance deadlines.
- The email digest respects the same personalization scoring as the feed. Users who opt into "Compliance Alerts Only" email receive only items with `isComplianceAlert: true` and matching profile flags.

**Phase 4 success:** Zero-friction compliance awareness. Founders don't need to open the app to be informed. A BNR circular affecting their business triggers a push notification within 2 hours of publication.

---

## Appendix: Key Design Decisions Summary

| Decision | Choice | Reason |
|----------|--------|--------|
| Read state storage | Server-side (`user_news_reads` table) | Cross-device, analytics-accessible, persistent |
| Feed default | Always populated, never empty | Trust is destroyed by empty states |
| Filter system | 3-tab primary + sheet-based secondary | Clean for 80% use case, power for 20% |
| Article detail | Full-screen overlay, not side panel | Communicates importance, preserves context |
| AI summary type | Two summaries: factual + sector-implication | One explains what happened, one explains what to do |
| Daily briefing | Per-user generated summary, cached in Redis | "Executive summary" feel, fast performance |
| Dedup threshold | Cosine similarity > 0.92 | Conservative — avoids false positives that remove unique angles |
| Compliance alerts | Elevated above the fold, red treatment | Never missed in the noise of general news |
| Human review | Required for all Tier 1 regulatory items | Data quality is the product |
| Pipeline | Python on Railway (not Vercel functions) | No timeout limits, persistent workers, cheaper for long-running jobs |
