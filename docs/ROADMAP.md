# BZ Intelligence — Implementation Roadmap

---

## Guiding Principles for This Roadmap

1. **Compliance Mode first, Intelligence Mode second.** Compliance has a clearer pain point, a more urgent use case, and is easier to monetize early. Intelligence Hub is more aspirational and requires more data — build it once the compliance foundation validates the product.

2. **Data before features.** A compliance feature with bad data is worse than no feature — it could actively harm users. Every phase starts with data validation.

3. **Narrow and deep > wide and shallow.** At launch, we serve 2–3 sectors extremely well rather than 10 sectors poorly. Quality of data and guidance matters more than breadth.

4. **Ship something users can test early.** The MVP does not need a full product — it needs one thing that works reliably and creates genuine value. Get to that one thing fast.

---

## Phase Overview

| Phase | Name | Duration | Primary Outcome |
|-------|------|----------|-----------------|
| 0 | Foundation | 3–4 weeks | Infrastructure up, data pipeline running, first data in DB |
| 1 | Compliance MVP | 6–8 weeks | Working compliance roadmap for 3 sectors, AI chat, beta users |
| 2 | Intelligence Hub | 8–10 weeks | Company directory, sector dashboards, AI market analyst |
| 3 | Full Product | 6–8 weeks | Document vault, PDF reports, full feature parity |
| 4 | Growth | Ongoing | Partnerships, API, expansion, monetization |

---

## Phase 0: Foundation (Weeks 1–4)

**Goal:** Everything is set up. No features exist yet, but the infrastructure is solid and data is flowing.

### 0.1 Infrastructure Setup (Week 1)
- [ ] Initialize Next.js 14 project with TypeScript, Tailwind, shadcn/ui
- [ ] Set up Supabase project (local + production)
- [ ] Configure Supabase Auth (email + Google OAuth)
- [ ] Initialize Supabase Storage (buckets: `user-documents`, `report-exports`, `company-assets`)
- [ ] Configure Row Level Security policies for all private tables
- [ ] Set up Vercel project, connect to GitHub for auto-deploys
- [ ] Set up Sentry for error tracking
- [ ] Configure environment variables for all services
- [ ] Create basic project structure:
  ```
  /app            - Next.js App Router pages
  /components     - React components
  /lib            - Utilities, Supabase client, AI config
  /pipeline       - Python data pipeline (separate directory)
  /supabase       - Migrations, seed data, RLS policies
  ```

### 0.2 Database Schema (Week 1–2)
- [ ] Write and run migrations for all core tables (see ARCHITECTURE.md schema)
- [ ] Enable pgvector extension
- [ ] Create knowledge_embeddings table with IVFFlat index
- [ ] Set up all RLS policies
- [ ] Write seed data scripts for regulatory bodies (RDB, BNR, RRA, RURA, RSB, PSF)

### 0.3 Data Pipeline Bootstrap (Week 2–4)
- [ ] Set up Python pipeline project on Railway
- [ ] Build PDF extractor for government publications (BNR circulars, RRA announcements)
- [ ] Build web scraper for RDB company registry (public data)
- [ ] Build text chunker (semantic, 512 tokens, 50-token overlap)
- [ ] Build embedding pipeline (OpenAI API → pgvector insert)
- [ ] Initial data load: manually curate first 50 companies across 3 sectors (Fintech, Agritech, ICT)
- [ ] Initial data load: ingest core compliance documents from BNR, RRA, RDB

### 0.4 Initial Compliance Knowledge Base (Week 3–4)
The most critical Phase 0 deliverable. Before writing any compliance feature code, the knowledge base must exist.

**Priority sectors for launch:**
1. **Fintech** (Digital Lending, Mobile Money, Payment Services) — most complex, highest demand
2. **General Business / SME** (all sectors: basic registration, tax, employment law)
3. **Technology / ICT** (software companies, IT services)

**Required documents to ingest:**
- [ ] RDB: Company registration guide, BPN process, foreign company branch registration
- [ ] RRA: TIN registration process, VAT registration thresholds, eTax setup guide, PAYE requirements
- [ ] BNR: PSP licensing framework, microfinance regulations, digital lending guidelines
- [ ] RURA: ICT sector licensing requirements
- [ ] Rwanda Labor Law summary: employment contracts, RSSB registration
- [ ] Official Gazette: relevant recent regulatory changes

**Human review gate:** No compliance document enters the knowledge base without human review and sign-off. This is non-negotiable.

### Phase 0 Success Criteria
- Infrastructure deployed and accessible
- First 50 companies in database, manually verified
- Core compliance documents ingested and embedded
- RAG system returns correct, cited answers to test queries
- Zero untested data in the compliance knowledge base

---

## Phase 1: Compliance MVP (Weeks 5–12)

**Goal:** A working compliance product that real users can use. Limited to 3 sectors, but everything within those sectors should be accurate and useful.

### 1.1 Authentication & Onboarding (Week 5–6)
- [ ] Sign up / sign in flow (Supabase Auth)
- [ ] Mode selection: "I want to understand the market" vs "I want to navigate compliance"
- [ ] Business DNA questionnaire (Compliance Mode entry)
  - Business type (Ltd, Sole Proprietorship, NGO, Branch)
  - Sector selection (3 sectors at launch)
  - Customer type (B2B, B2C, both)
  - Special flags (financial transactions, foreign ownership, data processing)
  - Current status (idea, registered, operating)
- [ ] Business Profile stored in Supabase private schema

### 1.2 Compliance Roadmap Generator (Week 6–8)
- [ ] Roadmap generation algorithm: map Business Profile → applicable compliance_steps
- [ ] Ordered step list with prerequisites enforced
- [ ] Each step card shows:
  - What it is (plain language)
  - Regulatory body
  - Documents required
  - Cost and timeline
  - Application link
  - Status (pending / in-progress / completed)
- [ ] User can mark steps as completed
- [ ] Compliance health score (% of required steps completed)
- [ ] Deadline tracking (for steps with time requirements)

### 1.3 AI Compliance Chat (Week 8–10)
- [ ] Chat interface with streaming responses (Vercel AI SDK)
- [ ] RAG pipeline integrated: query → embed → vector search → LLM call
- [ ] Business Profile injected into every compliance query
- [ ] Citation panel showing source for every claim
- [ ] "I don't have data on this" fallback behavior
- [ ] Conversation history (session-level)
- [ ] Rate limiting per tier (Free: 10 queries/month)

### 1.4 Regulatory Newsfeed (Week 10–11)
- [ ] Manually curated feed of recent regulatory changes (starting point)
- [ ] Items tagged by sector
- [ ] User sees only items relevant to their sector
- [ ] Plain-language summary for each item (AI-generated, human-reviewed)
- [ ] Link to original source

### 1.5 Beta Access & Feedback Loop (Week 11–12)
- [ ] Invite 20–50 beta users (mix of founders, researchers, advisors)
- [ ] In-app feedback widget on every response: "Was this helpful? Was this accurate?"
- [ ] Track: which queries return "I don't have data" (knowledge base gaps)
- [ ] Track: which steps users complete (engagement signal)
- [ ] Weekly review of AI responses for accuracy issues

### Phase 1 Success Criteria
- 50 active beta users
- Net Promoter Score (NPS) > 40 from beta users
- AI compliance chat accuracy rate > 85% (reviewed by legal advisor)
- Zero documented cases of harmful inaccurate compliance guidance
- Knowledge base gaps identified and backlog created

---

## Phase 2: Intelligence Hub (Weeks 13–22)

**Goal:** Launch the market intelligence product. The company directory and sector dashboards become the top-of-funnel product while compliance remains the core value driver.

### 2.1 Company Directory (Week 13–15)
- [ ] Company listing page with all filters (sector, stage, size, region, funding status)
- [ ] Search (Supabase full-text search across company names and descriptions)
- [ ] Company profile page (all fields from schema)
- [ ] "Last verified" dates visible on all data
- [ ] Data source attribution
- [ ] Free tier: limited to 20 results per search, basic fields only
- [ ] Pro tier: unlimited results, all fields, export to CSV

### 2.2 Sector Intelligence Dashboards (Week 15–18)
- [ ] Dashboard page per sector (starting with 3)
- [ ] Metrics: company count, funding totals, recent rounds, sector growth signals
- [ ] Company breakdown by sub-sector (Recharts pie/bar charts)
- [ ] Key players table (top 5 by funding / employee count)
- [ ] Regulatory landscape summary (AI-generated from knowledge base)
- [ ] Recent news section (from newsfeed, sector-filtered)
- [ ] "White space" indicator (sub-sectors with few or no players)

### 2.3 AI Market Analyst (Week 17–20)
- [ ] Chat interface for intelligence queries (separate from Compliance Chat)
- [ ] Grounded in public knowledge base only (not user's private context)
- [ ] Handles queries like:
  - "List all fintech companies in Rwanda with a BNR license"
  - "Who are the investors active in Rwanda's agritech sector?"
  - "What sub-sectors of fintech are underserved?"
- [ ] Citation panel same as Compliance Chat

### 2.4 Expand Knowledge Base (Ongoing through Phase 2)
- [ ] Grow company directory to 200+ verified companies
- [ ] Add 2 additional sectors (Health, Energy)
- [ ] Automate government publication monitoring (daily checks for new PDFs)
- [ ] Implement data freshness alerts (flag stale records for re-verification)

### Phase 2 Success Criteria
- 500 total registered users (free + paid)
- 50+ paying subscribers
- Company directory: 200+ verified companies
- Sector dashboards: 5 sectors live
- < 5% of company data complaints about inaccuracy

---

## Phase 3: Full Product (Weeks 23–32)

**Goal:** Complete the feature set. Document vault, PDF reports, automated newsfeed, competitive benchmarking.

### 3.1 Document Vault (Week 23–25)
- [ ] Document upload UI (drag and drop, multiple file types)
- [ ] Supabase Storage integration with encryption
- [ ] AI document categorization (what type of document is this?)
- [ ] Key data extraction (expiry dates, license numbers, registration dates)
- [ ] Compliance step mapping (which roadmap step does this fulfill?)
- [ ] Expiry alerts (notify user 60 days before any document expires)

### 3.2 PDF Report Export (Week 25–28)
- [ ] Report templates: Sector Analysis, Competitive Landscape, Compliance Summary
- [ ] Report generator: AI synthesis → structured data → Puppeteer render → PDF
- [ ] Professional layout with BZ Intelligence branding
- [ ] Available on Pro tier (5 reports/month) and Team tier (unlimited)

### 3.3 Competitor Benchmarking Matrix (Week 27–30)
- [ ] Select a company or business model as the reference point
- [ ] System identifies comparable companies
- [ ] Side-by-side comparison table (size, products, funding, licenses, geography)
- [ ] AI-generated "market position" summary
- [ ] Gap analysis: where the user could differentiate

### 3.4 Automated Newsfeed (Week 29–31)
- [ ] Automated ingestion from government RSS feeds and monitored URLs
- [ ] AI-generated plain-language summaries (human review for regulatory items)
- [ ] User email digest (weekly, opt-in)
- [ ] Impact assessment: "How does this change affect your business?"

### 3.5 Company Profile Claiming (Week 31–32)
- [ ] Companies can claim their profile
- [ ] Verified company badge
- [ ] Self-reported data layer (clearly labeled as such)
- [ ] Editorial review before changes go live

### Phase 3 Success Criteria
- 1,000 registered users
- 150+ paying subscribers
- 3 Enterprise customers signed
- PDF report feature being used by > 30% of Pro users
- Document vault being used by > 50% of compliance mode users

---

## Phase 4: Growth (Ongoing from Month 8+)

### Data Partnerships
- [ ] Formal data sharing agreement with RDB (access to company registry API)
- [ ] Partnership with BNR for regulatory update feeds
- [ ] Integration with PSF (Private Sector Federation) membership data
- [ ] Academic partnerships for research data sharing

### API Product (Enterprise)
- [ ] Public API for company directory data
- [ ] API for compliance roadmap generation (for third-party apps)
- [ ] Rate-limited, metered billing via Stripe
- [ ] API documentation site
- [ ] Target customers: law firms, accelerators, government agencies, DFIs

### Geographic Expansion
- [ ] Market: Uganda (similar regulatory structure, EAC integration)
- [ ] Market: Kenya (larger market, more complex but higher demand)
- [ ] Framework: Build expansion as sector/region modules on the same platform

### White-Label
- [ ] Compliance module white-labeled for: law firms, business associations, accelerators
- [ ] They brand it, we power it, they pay a platform fee

### Monetization Optimization
- [ ] Introduce usage-based pricing for API (per query)
- [ ] Annual subscription discount (20%)
- [ ] Referral program for Pro users

---

## Cross-Cutting Concerns (All Phases)

### Data Quality Process (Non-Negotiable)
Every piece of regulatory data goes through:
1. **Ingestion** — automated pipeline
2. **Human review** — at least one person verifies against the original source
3. **Sign-off** — marked as "verified" with date and reviewer ID
4. **Publication** — enters the knowledge base
5. **Monitoring** — flagged for re-verification if source document changes

### Legal Review
- Quarterly legal review of compliance guidance quality by a Rwanda-admitted attorney
- Clear disclaimer on every compliance response: "This is informational, not legal advice"
- Any response that could lead to significant financial or legal consequences flagged for human review

### User Trust Metrics (Tracked Every Phase)
- Accuracy rate (user-flagged errors / total queries)
- "I don't know" rate (how often AI cannot answer — tracks knowledge base gaps)
- Compliance step completion rate (engagement signal)
- Data freshness score (% of knowledge base verified within last 90 days)
