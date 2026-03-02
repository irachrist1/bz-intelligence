# BZ Intelligence — Tender Monitoring Platform
## Vision, Product Strategy & Implementation Plan

> Status: Active strategic direction as of March 2026
> This document supersedes the dual-mode compliance/intelligence product described in PRODUCT.md.
> It defines what we are building, why, how, and in what order.

---

## 1. The Pivot in One Sentence

We are changing from a general-purpose Rwanda business intelligence platform to a **focused tender monitoring and opportunity-tracking platform** for professional service firms and businesses operating in Rwanda and East Africa.

---

## 2. Why We Are Doing This

### The original product's honest problem

The compliance/intelligence dual-product was directionally correct but commercially weak. The pain was real but the buyer had no money. A founder who "can't afford a lawyer yet" is also a founder who will not pay $79/month for software. We were building for the most sympathetic user, not the highest-leverage one.

We identified three facts that change the calculus:

**Fact 1: Public procurement in Rwanda is enormous and chronically underserved.**
The Government of Rwanda is one of the largest buyers of professional services, IT, construction, and consulting in the country. Tenders are published across RPPA, individual ministry procurement portals, and the Official Gazette. Billions of Rwandan francs in contracts are awarded every year. The firms competing for these contracts have real revenue and real budget.

**Fact 2: The information problem is worse here than anywhere else.**
Finding tenders currently requires someone to manually check RPPA's portal, the World Bank STEP system, the AfDB portal, UN Global Marketplace, USAID procurement pages, the EU procurement portal, and bilateral donor sites — every day. There is no aggregated source. Firms miss contracts because they weren't watching the right portal on the right day. This is not a hypothetical pain; it is a documented operational failure that every competitive procurement team has experienced.

**Fact 3: The buyer has budget and the ROI math is obvious.**
A single contract win worth $200,000 makes a $1,200/year subscription irrelevant. The sales conversation is not "is this worth it?" It is "why haven't you already done this?" This is a fundamentally better commercial dynamic than selling compliance guidance to cash-constrained early-stage founders.

### Why this fits what we've already built

The existing codebase maps surprisingly cleanly onto the new direction:

| Existing Infrastructure | New Purpose |
|---|---|
| `news_items` table + newsfeed UI | Tender listings feed |
| Newsfeed read/unread + mark-all-read | Tender seen/saved/dismissed workflow |
| Newsfeed article detail page | Full tender detail view |
| Onboarding profile (sector, biz type, customer type) | Firm capability profile for matching |
| Organization model (multi-member teams) | Firm account with multiple staff |
| Email via Resend | Tender alert digests and deadline reminders |
| pgvector + Voyage AI embeddings | Semantic tender-to-profile matching |
| AI chat infrastructure (RAG) | Tender analysis and eligibility screening |

We are not discarding the codebase. We are redirecting it.

---

## 3. The Problem in Full

### How tender monitoring works today in Rwanda

A Business Development Manager at a Kigali-based IT firm starts their morning by:

1. Opening RPPA's portal and scanning a table of tenders with no search, no filter, no notification system
2. Checking their firm's government client portals directly, if they have relationships
3. Waiting for colleagues or peers to forward WhatsApp messages about tenders they've seen
4. Missing the World Bank STEP system entirely because no one told them to check it
5. Discovering on Friday that a tender they could have bid on closed on Wednesday

This is the current state of play. It is not a niche problem. Every firm that competes for public and donor-funded contracts lives in this information environment.

The result: **firms systematically underparticipate in procurement markets** relative to their actual capabilities. They don't lose tenders — they never find them.

### The sources that need monitoring

| Source | Type | Update Frequency | Current Access |
|---|---|---|---|
| RPPA (Rwanda Public Procurement Authority) | Government RFPs / Tenders | Daily | Public portal, no API |
| Rwanda Official Gazette | Statutory procurement notices | Weekly | PDF, manual |
| World Bank STEP | Donor-funded project tenders | Continuous | Public API available |
| African Development Bank | AfDB-financed project tenders | Continuous | Public portal |
| UN Global Marketplace (UNGM) | UN agency procurements | Continuous | Public, structured |
| USAID Rwanda | Development partner tenders | Continuous | Public, FedBizOpps adjacent |
| European Union Delegations | EU-financed tenders | Continuous | TED (OJEU) adjacent |
| Individual ministry portals | Unsolicited procurement notices | Irregular | Per-ministry, HTML scraping |
| GIZ, World Food Programme, UNICEF | Sector-specific donor tenders | Continuous | Per-agency portals |
| East African Community (EAC) | Regional procurement | Periodic | Public portal |
| City of Kigali | Local government procurement | Irregular | Public portal |

The aggregation problem is not trivial — but it is solvable with a structured scraping and ingestion pipeline, maintained with human review for quality.

### The specific users who feel this pain

**Primary buyer — Business Development Lead at a professional services firm:**
A BD Manager at a Rwandan IT company, engineering consultancy, management advisory firm, or law firm. Responsible for finding, qualifying, and submitting bids. Manages a pipeline of potential contracts. Currently works with manual processes and tribal knowledge. Has a budget for tools that win contracts.

**Secondary buyer — Senior Partner at a law firm or advisory firm:**
Oversees business development as part of firm management. Wants visibility into what opportunities exist in their sectors, without doing the manual monitoring themselves. Pays for market intelligence as a professional investment, not a personal decision.

**Tertiary buyer — Procurement/BD team at a larger company:**
A company with 50–500 employees that has dedicated BD staff. Wants a centralized tool their whole team uses to track opportunities, assign ownership, and manage the bid pipeline. Needs multi-user access and workflow features.

---

## 4. The Product

### Core concept

BZ Intelligence becomes a **tender intelligence platform**: an aggregated, searchable, AI-enhanced feed of procurement opportunities relevant to each firm's capabilities, delivered with enough context to make a fast go/no-go decision and track the entire bid lifecycle.

The platform has four jobs:

1. **Find** — Monitor all relevant sources continuously. Surface new tenders before competitors see them
2. **Match** — Filter signal from noise. Show each firm only tenders relevant to what they do
3. **Analyze** — Give firms enough context to make a fast go/no-go decision without reading the full RFP
4. **Track** — Manage the bid pipeline from discovery through submission

---

### Feature Set

#### 4.1 Tender Feed

The primary view. A continuously updated, searchable list of open procurement opportunities.

**Each tender card shows:**
- Title and issuing organization
- Tender type (RFP, RFQ, EOI, Framework, Sole Source)
- Category / sector tags (IT, Legal, Consulting, Construction, Healthcare, etc.)
- Estimated contract value (when available)
- Submission deadline with urgency indicator (red if <7 days, amber if 7–21 days)
- Source (RPPA, World Bank, UNGM, etc.)
- Date posted
- Relevance match score to the firm's profile (if AI matching is active)
- Funding source (Government of Rwanda, World Bank, AfDB, EU, etc.)
- Status badge: New / Saved / In Progress / Submitted / Passed

**Feed filters:**
- Source (multi-select)
- Category (multi-select)
- Deadline range
- Contract value range
- Funding source
- Status (new / saved / in-progress / submitted)
- Match score threshold

**Feed actions:**
- Search (full-text across title, description, issuing org)
- Sort: deadline ascending / date posted / match score

#### 4.2 Tender Detail Page

Full view of a single tender.

**Sections:**
- **Header:** Title, issuing organization, source, dates, estimated value, deadline countdown
- **Summary:** AI-generated plain-language summary of the scope of work (3–5 sentences, generated from the RFP text or notice)
- **Eligibility snapshot:** Key eligibility criteria extracted by AI ("requires minimum 5 years IT consulting experience, Rwandan registered company, ISO 27001 certification preferred")
- **Documents:** Links to original RFP documents, clarification questions, addenda
- **Fit analysis** (Pro): AI assessment of how well the firm matches the stated requirements, based on their capability profile
- **Similar tenders:** Other open or past tenders from the same organization or category
- **Timeline:** Posted date → Clarification deadline → Submission deadline → Award date (if available)
- **Notes:** Internal notes field for the BD team
- **Status tracker:** Dropdown to update bid status (Watching / Go / No-Go / Submitted / Won / Lost)
- **Assign to team member:** Multi-user firms can assign ownership

#### 4.3 Firm Capability Profile (Onboarding)

The firm's profile is what drives matching. It is the most important input in the system.

**Profile fields:**
- Firm name and legal entity type
- Primary sectors of expertise (multi-select from taxonomy)
- Service categories offered (IT consulting, Legal services, Financial advisory, Engineering, Training, Audit, etc.)
- Typical contract size range (below $50K / $50K–$250K / $250K–$1M / above $1M)
- Geographic coverage (Rwanda only / East Africa / Pan-Africa / International)
- Funding sources you target (GoR / World Bank / AfDB / UN / EU / USAID / All)
- Languages of proposal submission (English, French, Kinyarwanda)
- Keywords that must appear for a tender to be relevant (free text, comma-separated)
- Keywords that disqualify a tender (e.g., "construction" for a pure IT firm)

This profile seeds the AI matching engine and can be updated at any time. Good profile = fewer irrelevant alerts.

#### 4.4 Alert Engine

The proactive delivery layer. Firms get notified when something relevant appears — without having to check the dashboard.

**Alert types:**
- **New tender match:** "3 new tenders matching your profile published today"
- **Deadline approaching:** "Submission deadline in 7 days: [Tender name]"
- **Critical deadline:** "Submission closes in 48 hours: [Tender name]"
- **Tender update:** "Addendum published for a saved tender: [Tender name]"
- **Weekly digest:** Every Monday, a summary of the past week's relevant tenders for the firm

**Delivery:** Email (Resend, already configured). In-app notification center. Future: Slack integration, WhatsApp.

**Alert preferences:** Each user controls their own alert frequency (real-time / daily digest / weekly digest). Prevents alert fatigue.

#### 4.5 Pipeline Tracker

A lightweight CRM for bid management. Not a full project management tool — just enough to track where each opportunity sits.

**View:** A Kanban-style board or table with columns:
- **Watching** — Saved, evaluating whether to bid
- **Go** — Decision made to pursue
- **In Preparation** — Bid team working on proposal
- **Submitted** — Proposal lodged
- **Won** — Contract awarded, we won
- **Lost / Passed** — Contract awarded to someone else, or decision made not to bid

**Per-bid metadata:**
- Assigned team member(s)
- Internal notes / comments thread
- Key dates (clarification deadline, submission deadline, award expected)
- Documents uploaded (draft proposals, team CV attachments, supporting evidence)
- Win/loss reason (tracked post-result for internal learning)

**Value this creates:** Over time, the pipeline tracker builds institutional memory. "We bid on 12 World Bank IT contracts last year. We won 3. Our win rate on contracts below $150K is 40%. Our win rate on contracts above $500K is 0%." This is data that firms currently have no way to generate. It becomes a reason to never churn.

#### 4.6 AI Tender Analyst (Pro Feature)

The AI layer, built on the existing RAG infrastructure and repurposed for tender analysis.

**What it does:**

- **RFP Summarization:** Upload the full RFP PDF. The AI extracts and presents: scope of work, deliverables, timeline, eligibility requirements, evaluation criteria and weights, key contacts, clarification process
- **Eligibility Check:** "Based on our firm profile, do we qualify?" — The AI cross-references the firm's capability profile against stated eligibility criteria and flags gaps or strong fits
- **Writing Assistance:** "Draft an executive summary for this proposal based on our firm profile and the stated objectives." Not a full proposal writer — a starting-point accelerator
- **Q&A on RFP Documents:** "What does the evaluation criterion for 'financial capacity' require?" against uploaded RFP documents — eliminates the back-and-forth within BD teams

**What it does not do:**
- Write entire proposals
- Submit on behalf of the firm
- Guarantee contract wins

**Why this is different from just using ChatGPT:**
The AI knows the firm's specific capability profile. It knows what sectors they operate in, their typical contract size, their geographic coverage, their past wins (if entered). It gives context-aware analysis, not generic RFP commentary.

#### 4.7 Admin Panel (Internal)

A simple internal tool for the BZ Intelligence team to:

- Add new tender sources
- Review and approve AI-generated tender summaries before publication
- Manually ingest tenders from sources without scrapers
- Tag tenders with sector categories and eligibility flags
- Monitor scraper health (which sources are live, which are failing)
- View firm subscription status and usage

This is not user-facing. It is how we maintain data quality without a fully automated pipeline on day one.

---

## 5. What We Are Not Building (Yet)

To stay focused, the following are explicitly out of scope until the tender platform has paying users:

- **Compliance roadmap** — Retained in the codebase but deprioritized. Not promoted in onboarding or landing page.
- **Company intelligence directory** — Useful long-term, requires massive data investment. Out of scope.
- **Market analyst AI chat** — No company data to power it. Out of scope.
- **Document vault** — Useful for storing RFP documents, future scope. Out of scope for MVP.
- **Consultant portfolio management** — Different product, different buyer. Out of scope.
- **Geographic expansion (Uganda, Kenya, Tanzania)** — Rwanda first. East Africa is a Phase 3 goal.

---

## 6. Business Model

### Tiers

| Tier | Price | What's Included |
|---|---|---|
| **Free** | $0 | Up to 10 tender alerts/month, feed access (7-day delay), no pipeline tracker |
| **Starter** | $49/month | Full real-time feed, unlimited alerts, pipeline tracker (1 user), 3 saved profiles |
| **Pro** | $99/month | Everything in Starter + AI Tender Analyst (RFP upload & analysis), 5 users, priority sources |
| **Team** | $199/month | Everything in Pro + unlimited users, custom sector alerts, weekly consultant digest, API access |

### Why a delay-based free tier works

The free tier is structurally meaningful. Tenders have deadlines. A 7-day delay on the free tier means free users regularly discover tenders with insufficient time to prepare a competitive bid. They either miss the opportunity or scramble. The upgrade decision becomes: "I need to see these earlier." This is a forcing function for conversion that is directly tied to the product's core value, not an artificial feature gate.

### Revenue targets (conservative)

- 50 Starter accounts: $2,450 MRR
- 30 Pro accounts: $2,970 MRR
- 10 Team accounts: $1,990 MRR
- **Total at these numbers: $7,410 MRR (~$88K ARR)**

This is a sustainable initial business that funds continued product development and data pipeline maintenance. It is not venture scale, but it does not need to be venture scale to be a real, profitable product. The path to venture scale is East African expansion with the same product and a larger tender market.

---

## 7. The Phased Build Plan

---

### Phase 0: Repurpose (Current Sprint)

**Goal:** Redirect the existing codebase toward tender monitoring with minimal waste.

**Work:**

**UI Changes:**
- [ ] Update landing page: new headline, new value proposition copy, new feature pillars focused on tenders
- [ ] Update sidebar: replace compliance/intelligence nav with tender-focused nav (Feed, Pipeline, Saved, Alerts, Profile)
- [ ] Update onboarding: replace business compliance profile with firm capability profile (sector expertise, service categories, target funding sources, contract size range)
- [ ] Update dashboard default redirect to `/dashboard/tenders`
- [ ] Rename branding in UI from generic "BZ Intelligence" framing toward "procurement intelligence" positioning

**Schema Changes (additive, no destructive migrations):**
- [ ] Rename/repurpose `news_items` table → `tenders` table with tender-specific fields (or add new `tenders` table and deprecate `news_items`)
- [ ] Add `firm_profiles` table replacing/extending `business_profiles` with capability-oriented fields
- [ ] Add `tender_saves` table (org, tender, status, assignee, notes, pipeline stage)
- [ ] Add `alert_preferences` table (org, user, frequency, channels)
- [ ] Keep existing compliance/auth schema untouched (non-destructive)

**No new AI features in Phase 0. No new scrapers. Redirect what exists.**

---

### Phase 1: Manual MVP (The Email First Approach)

**Goal:** Validate willingness to pay before building automation.

**What "Manual MVP" means:**
Before the scraper pipeline exists, operate the product manually: one team member monitors all tender sources daily, ingests new tenders through the admin panel, and the platform delivers them to users as though the system were automated.

This approach has a specific strategic advantage: you learn **exactly which sources matter**, **which categories drive the most engagement**, and **where users get stuck** — before spending weeks building scrapers that might be targeting the wrong sources.

**Work:**

- [ ] Build admin panel for manual tender ingestion (form: title, source, category, description, documents, deadline, estimated value, eligibility notes)
- [ ] Build firm onboarding flow (capability profile form replacing current compliance onboarding)
- [ ] Build tender feed page with filters and search
- [ ] Build tender detail page
- [ ] Wire up email alert system using Resend (new tender matches, deadline reminders)
- [ ] Build pipeline tracker (simple status dropdown + notes per tender per firm)
- [ ] Deploy to Vercel and acquire first 5 firms manually

**Success criteria:**
- 5 firms using the platform
- At least 3 paying or verbally committed to pay
- At least 1 firm credits the platform with finding a tender they would have missed

---

### Phase 2: Automated Ingestion

**Goal:** Replace manual monitoring with reliable automated scrapers for the highest-value sources.

**Sources to automate (in priority order):**
1. RPPA portal (highest volume of Rwanda government tenders)
2. World Bank STEP (structured data, API available, large contract values)
3. UN Global Marketplace (structured data, public API)
4. African Development Bank (high contract values, structured portal)
5. USAID Rwanda (significant volume of consulting/IT tenders)

**Architecture:**
- Python scraping pipeline (already planned in TECHSTACK.md)
- Runs on a scheduled cron job (every 4 hours for high-frequency sources, daily for low-frequency)
- Raw data lands in a staging queue
- AI extracts structured fields: title, issuing org, deadline, estimated value, category, eligibility requirements, document links
- Human reviewer spot-checks 20% of ingested tenders for quality
- Approved tenders publish to the live feed and trigger alert matching

**Schema additions:**
- [ ] `scraper_runs` table (source, run_at, tenders_found, tenders_new, status, errors)
- [ ] `tender_sources` table (name, url, type, scraper_status, last_successful_run)
- [ ] Staging mechanism for unreviewed tenders

**Work:**
- [ ] Build Python scrapers for RPPA, World Bank STEP, UNGM
- [ ] Build extraction pipeline (LLM-assisted structured field extraction from raw HTML/PDF)
- [ ] Build scraper health monitoring dashboard in admin panel
- [ ] Build AI-powered matching engine using pgvector (embed tender descriptions and firm profiles, score relevance by cosine similarity)

**Success criteria:**
- 3 sources automated with <5% missed tenders
- Alert matching precision >80% (firms rate alerts as relevant)
- 20+ firms on platform, 15+ paying

---

### Phase 3: Intelligence Layer

**Goal:** Add AI-powered analysis on top of the data foundation.

**Work:**
- [ ] AI RFP Summarization (upload PDF → structured summary)
- [ ] Eligibility pre-screening (firm profile vs. RFP requirements)
- [ ] AI Tender Analyst chat interface (Q&A against RFP documents)
- [ ] Win/loss pattern analysis (based on pipeline tracker data)
- [ ] Enhanced similarity recommendations ("firms that saved this also saved…")
- [ ] Tender value estimation for notices without stated values
- [ ] Proposal writing assistance (executive summary drafts)

**Success criteria:**
- Pro tier has clear distinct value from Starter (measurable per-tier usage split)
- AI analysis features used by >60% of Pro/Team users weekly
- 50+ paying firms

---

### Phase 4: Expansion

**Goal:** East African expansion and platform extensibility.

**Work:**
- [ ] Add Uganda sources (PPDA portal, bilateral donors active in Uganda)
- [ ] Add Kenya sources (PPIP portal, major government IFT notices)
- [ ] Add Tanzania sources (PPRA portal)
- [ ] Multi-country firm profiles (firms can specify which countries they operate in)
- [ ] API access (Team tier) — firms can pull tender data into their own systems
- [ ] Slack and WhatsApp notification channels
- [ ] CRM integration (Salesforce, HubSpot basic) for larger enterprise clients

---

## 8. UI Changes Required

### 8.1 Landing Page (`app/page.tsx`)

**Replace:**
- Current headline: "Move from scattered regulation to decisive execution"
- Current pillars: Intelligence Mode, Compliance Mode, Regulatory Newsfeed

**With:**
- New headline focused on tender discovery and never missing a contract
- New sub-headline explaining the fragmentation problem (10+ portals, one platform)
- New feature pillars: Aggregated Tender Feed, Smart Matching, Pipeline Tracker
- Social proof section (once available): "X firms, Y tenders tracked, $Z in contract value surfaced"
- CTA: "Get early access" or "Start monitoring" (waitlist or direct signup)

### 8.2 Sidebar (`components/sidebar.tsx`)

**Replace:**
- Compliance nav group (Roadmap, Compliance Advisor, Document Vault, Newsfeed)
- Intelligence nav group (Companies, Market Analyst)

**With:**
- Single nav group with:
  - Feed (all tenders, main view)
  - Pipeline (bid tracker)
  - Saved (bookmarked tenders)
  - Alerts (notification settings)
  - Profile (firm capability profile)

### 8.3 Onboarding (`app/(dashboard)/onboarding/page.tsx`)

**Replace:**
- Current compliance-oriented questions (handles money, legal structure, BNR triggers)

**With:**
- Capability-oriented firm profile:
  - Firm name
  - What services do you offer? (multi-select: IT, Legal, Consulting, Engineering, Audit, Training, Construction, Other)
  - Which sectors do you primarily work in? (multi-select)
  - What size contracts do you typically pursue?
  - Which funding sources do you target? (GoR, World Bank, AfDB, UN, EU, USAID, Bilateral, All)
  - What countries do you operate in? (Rwanda, Uganda, Kenya, Tanzania, Pan-Africa)
  - Any keywords we should always watch for? (free text)
  - Any keywords that disqualify a tender? (free text, e.g. "we are not a construction firm")

### 8.4 Dashboard Pages

**Retire (keep in codebase, remove from nav):**
- `/dashboard/compliance/*` (roadmap, chat, documents, newsfeed)
- `/dashboard/intelligence/*` (directory, chat)

**Create:**
- `/dashboard/tenders` — main feed
- `/dashboard/tenders/[id]` — tender detail
- `/dashboard/pipeline` — bid tracker kanban/table
- `/dashboard/saved` — bookmarked tenders
- `/dashboard/alerts` — notification preferences
- `/dashboard/profile` — firm capability profile editor

---

## 9. Database Schema Changes

### New tables (additive — no existing tables dropped)

```sql
-- Tenders (replaces news_items as the primary public data table)
tenders (
  id uuid PK,
  source text NOT NULL,              -- 'rppa' | 'world_bank' | 'ungm' | 'adb' | 'usaid' | 'eu'
  source_id text,                    -- original ID from source system
  title text NOT NULL,
  issuing_org text NOT NULL,         -- "Ministry of ICT", "World Bank", "UNICEF Rwanda"
  tender_type text,                  -- 'rfp' | 'rfq' | 'eoi' | 'framework' | 'direct'
  funding_source text,               -- 'gor' | 'world_bank' | 'adb' | 'un' | 'eu' | 'usaid'
  category_tags text[],              -- ['it', 'consulting', 'training']
  description text,
  ai_summary text,                   -- AI-generated plain-language summary
  eligibility_notes text,            -- AI-extracted eligibility requirements
  estimated_value_usd integer,
  estimated_value_rwf integer,
  currency text,
  documents jsonb,                   -- [{name, url, type}]
  deadline_submission timestamp,
  deadline_clarification timestamp,
  date_posted timestamp,
  award_date timestamp,
  contact_info jsonb,
  source_url text NOT NULL,
  status text DEFAULT 'open',        -- 'open' | 'closed' | 'awarded' | 'cancelled'
  review_status text DEFAULT 'pending', -- 'pending' | 'approved' | 'rejected'
  country text DEFAULT 'rw',
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now()
)

-- Firm capability profiles (replaces business_profiles for new onboarding)
firm_profiles (
  id uuid PK,
  org_id text NOT NULL UNIQUE,
  firm_name text,
  service_categories text[],         -- ['it_consulting', 'legal', 'audit', 'training']
  sectors text[],                    -- ['ict', 'finance', 'health', 'education']
  contract_size_min_usd integer,
  contract_size_max_usd integer,
  funding_sources text[],            -- ['gor', 'world_bank', 'un', 'all']
  countries text[],                  -- ['rw', 'ug', 'ke', 'tz']
  keywords_include text[],
  keywords_exclude text[],
  embedding vector(1024),            -- embedded firm profile for similarity matching
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now()
)

-- Per-firm tender tracking (saves, pipeline status, notes)
tender_saves (
  id uuid PK,
  org_id text NOT NULL,
  tender_id uuid NOT NULL REFERENCES tenders(id),
  stage text DEFAULT 'watching',     -- 'watching' | 'go' | 'no_go' | 'in_prep' | 'submitted' | 'won' | 'lost'
  assigned_to text,                  -- user_id
  notes text,
  win_loss_reason text,
  submitted_at timestamp,
  result_at timestamp,
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now(),
  UNIQUE(org_id, tender_id)
)

-- Alert preferences
alert_preferences (
  id uuid PK,
  org_id text NOT NULL,
  user_id text NOT NULL,
  new_match_frequency text DEFAULT 'realtime', -- 'realtime' | 'daily' | 'weekly' | 'off'
  deadline_7day boolean DEFAULT true,
  deadline_48hr boolean DEFAULT true,
  tender_update boolean DEFAULT true,
  weekly_digest boolean DEFAULT true,
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now()
)

-- Tender source registry
tender_sources (
  id uuid PK,
  code text UNIQUE NOT NULL,
  name text NOT NULL,
  url text,
  scraper_type text,                 -- 'html' | 'api' | 'pdf' | 'manual'
  scraper_status text DEFAULT 'manual', -- 'manual' | 'active' | 'failing' | 'paused'
  last_successful_run timestamp,
  country text DEFAULT 'rw',
  active boolean DEFAULT true
)
```

### Existing tables: retained as-is

All existing tables (`regulatory_bodies`, `compliance_steps`, `compliance_history`, `business_profiles`, `knowledge_embeddings`, `companies`, `news_items`, `org_documents`, `chat_sessions`, `chat_messages`) are retained. They will not be dropped. The compliance features remain in the codebase but are de-emphasized in navigation and onboarding. This keeps our options open for a future compliance tier without rebuilding.

---

## 10. Technology: What Changes, What Stays

### Unchanged

- Next.js 16 + TypeScript + Tailwind + shadcn/ui
- Neon PostgreSQL + Drizzle ORM
- pgvector (now used for tender-profile semantic matching instead of regulatory document retrieval)
- Voyage AI embeddings (embed firm profiles and tender descriptions for matching)
- Better Auth (authentication unchanged)
- Resend (now actively used for tender alert emails)
- Upstash Redis (rate limiting on AI features and alert delivery)
- Vercel deployment

### New additions

- **Python scraping pipeline** — scheduled scrapers for each tender source. Runs in a separate service (could be a Vercel cron function for simple sources, or a separate Python worker for complex ones). Returns structured JSON per tender.
- **Cron job infrastructure** — Vercel cron or a lightweight worker (Railway, Render) to trigger scrapers and alert matching on schedule
- **PDF extraction** — `pdfplumber` (already in tech stack plan) for extracting text from RFP documents uploaded by users or scraped from sources

### Deferred (from original stack, still not needed)

- Cloudflare R2 (still Phase 3 — document storage for user-uploaded RFPs)
- Stripe (Phase 1 end — after manual validation complete)
- Sentry (add before production deploy)

---

## 11. Validation Steps Before Phase 2

Do not build the automation pipeline until these are true:

1. **5 firms have signed up and completed onboarding** — real firms, not test accounts.
2. **Manual monitoring is running for 4 weeks** — you have processed at least 50 tenders through the admin panel.
3. **At least 3 firms have saved a tender** — demonstrating the pipeline tracker has real usage.
4. **At least 2 firms have received an alert and acted on it** — opened the tender detail, updated a pipeline stage, or shared it internally.
5. **At least 1 firm has indicated they found a tender through you that they would have missed otherwise** — this is the product-market fit signal. Not satisfaction — specific attribution.

Only when all five are true should engineering effort shift to building the automated ingestion pipeline.

---

## 12. The End Goal

BZ Intelligence becomes the default procurement intelligence layer for professional service firms in East Africa.

**In Rwanda:** Every serious firm competing for public and donor-funded contracts uses BZ Intelligence as their source of truth for opportunity discovery. They don't check RPPA manually. They don't rely on forwarded WhatsApp messages. The platform finds it, surfaces it, and tracks it.

**In East Africa:** The same product, the same model, applied to Uganda, Kenya, and Tanzania — markets with larger procurement volumes and identical information fragmentation problems. The effort to expand is primarily data pipeline work (new scrapers, new sources), not product redesign.

**The defensible position:** A firm that has used the platform for 12 months has 12 months of bid history, win/loss data, and pipeline insights in their account. Their team knows the interface. Their alert profiles are tuned. Switching to a competitor means starting from zero. The longer a firm uses the platform, the more it knows about how they win — and that institutional memory has no substitute.

The end goal is not the largest product. It is the most necessary one.

---

*Last updated: March 2026*
*Replaces: PRODUCT.md, VISION.md (original dual-mode product vision)*
*Owner: Product*
