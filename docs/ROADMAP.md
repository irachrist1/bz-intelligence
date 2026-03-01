# BZ Intelligence — Implementation Roadmap

> For current build status, see STATUS.md first.

---

## Guiding Principles

1. **Compliance Mode first.** More urgent pain point, clearer monetization, smaller scope. Intelligence Hub follows once compliance is validated.
2. **Data quality is the product.** A wrong compliance answer is worse than no answer. Every document in the knowledge base must be human-reviewed before publication.
3. **Narrow and deep over wide and shallow.** Three sectors done extremely well beats ten sectors done poorly.
4. **The perfect is the enemy of the shipped.** Get real users using a limited but reliable product. Expand from there.

---

## Phase Overview

| Phase | Name | Status | Primary Outcome |
|-------|------|--------|-----------------|
| 0 | Foundation | ✅ Done (partial) | Infrastructure, DB, basic app shell |
| 1 | Compliance MVP | 🔄 In progress | Working compliance product for 3 sectors |
| 2 | Intelligence Hub | ⬜ Not started | Company directory, sector dashboards, market AI |
| 3 | Full Product | ⬜ Not started | Document vault, PDF reports, automation |
| 4 | Growth | ⬜ Not started | API, partnerships, geographic expansion |

---

## Phase 0: Foundation — ✅ Complete (with caveats)

**What was built:**
- [x] Next.js 16 + TypeScript + Tailwind + shadcn/ui
- [x] Neon database provisioned (Neon project: `bz-intelligence`, region: us-west-2)
- [x] pgvector extension enabled
- [x] Full Drizzle ORM schema (public + private + auth tables)
- [x] Better Auth configured (email/password; Google OAuth not yet active)
- [x] All tables created via `drizzle-kit push`
- [x] Seed data: 8 regulatory bodies, 9 compliance steps
- [x] App shell: landing page, sign-up, sign-in, dashboard layout, sidebar
- [x] Route protection (proxy.ts — Next.js 16 renamed middleware)
- [x] RAG search function (Voyage AI embeddings + pgvector)
- [x] AI chat API route (streaming, tool-calling)
- [x] System prompts for both modes
- [x] Basic Compliance pages: roadmap, chat, documents (stub), newsfeed
- [x] Basic Intelligence pages: directory (empty), chat
- [x] Onboarding questionnaire → business profile saved to DB
- [x] Compliance history (step status tracking)
- [x] Vercel AI SDK v6 migration (breaking changes handled)

**What was intentionally skipped:**
- [ ] Cloudflare R2 — not needed until document vault (Phase 3)
- [ ] Stripe — not needed until paid tiers are ready
- [ ] Python data pipeline — separate project, not yet started
- [ ] Knowledge base content — no documents ingested yet
- [ ] Company data — no companies seeded
- [ ] Sentry error monitoring

**Known issues remaining from Phase 0:**
- Anthropic API key invalid (Claude Code OAuth token rejected by Anthropic API)
- Google OAuth not configured (credentials missing)
- No theme system (always light mode)
- Onboarding too shallow (4 questions, needs ~10)
- Rate limiting not wired up despite Upstash being configured

---

## Phase 1: Compliance MVP — 🔄 In Progress

**Goal:** A working compliance product that a real Rwanda founder could use with confidence. Limited to 3 sectors (Fintech, General SME, ICT/Tech), but everything within those sectors must be accurate and cited.

### 1.0 Fix Blockers (Do First)

- [ ] **API key** — Get a valid Anthropic API key from console.anthropic.com. This is the single blocker for all AI functionality.
- [ ] **Remove Google OAuth warning** — Either add credentials or conditionally remove the provider from `lib/auth/index.ts` to silence the constant warning.
- [ ] **Theme system** — Implement system-default dark/light + manual toggle. See 1.3 below.

### 1.1 Rebuild Onboarding as a Conversation

The current 4-question form is not enough context to generate a genuinely personalized roadmap. The redesign should feel like talking to an advisor, not filling in a form.

**Two implementation options:**

**Option A — Smart multi-step form (simpler)**
A step-by-step wizard with intelligent branching. Answer "fintech" and the next question becomes about fintech-specific sub-sectors. Answer "foreign investors: yes" and foreign ownership questions appear. Maximum 10 questions, shown conditionally based on prior answers. No question shown if it doesn't apply.

**Option B — AI chat onboarding (ideal)**
The user types naturally: "I'm starting a digital lending startup in Kigali." The AI responds with follow-up questions, extracts the business profile from the conversation, and shows a structured summary at the end for the user to confirm. This is more engaging and produces richer profiles.

**Recommended questions (for either option):**
1. Describe your business in a sentence or two *(free text)*
2. Legal structure — Ltd company, Sole proprietorship, NGO/Association, or Branch of foreign company?
3. Where are you in your journey? — Pre-registration idea / Registered but not yet operating / Currently operating
4. Who are your customers? — Individual consumers (B2C) / Other businesses (B2B) / Government (B2G) / Mix
5. Does your business handle money? — Payments, lending, savings deposits, insurance, investment *(yes = BNR requirements)*
6. Will you have foreign shareholders or directors? *(yes = additional RDB + forex requirements)*
7. Will you collect personal data about customers or employees? *(yes = data protection requirements)*
8. How many employees in year one? — Just me / 2–10 / 11–50 / 50+
9. Where will you operate? — Kigali only / Kigali + provincial / Nationwide / Cross-border (EAC)
10. What's your most urgent compliance question right now? *(seeds first AI conversation)*

**Implementation note:** Upgrade the `business_profiles` table to store answers to questions 5–9 (foreign ownership boolean, handles_money boolean, collects_data boolean, employee_range, operates_province boolean). These are compliance trigger flags that make the roadmap personalization much more accurate.

### 1.2 Improve Compliance Roadmap Engine

Currently, the roadmap filters steps by sector and biz_type. This needs to be smarter:
- [ ] Filter steps by `handles_money` flag (BNR steps should only appear for fintech/financial businesses)
- [ ] Filter by `foreign_ownership` (additional RDB reporting, National Bank forex requirements)
- [ ] Filter by `collects_data` (data protection steps)
- [ ] Filter by employee count (RSSB mandatory above certain thresholds)
- [ ] Show prerequisite dependencies between steps (visually, not just in order)
- [ ] Show estimated total cost and timeline for completing the roadmap

### 1.3 Theme System

The app should respect the user's OS settings and allow manual override.

**Implementation:**
- Add `next-themes` package
- Wrap the root layout in `ThemeProvider`
- Add a toggle button (sun/moon icon) to the top-right of the dashboard header
- System default on first load; preference persisted in localStorage
- Test in both light and dark to ensure all shadcn/ui components look correct

### 1.4 Fix Google Auth Button

- Add the Google logo SVG to the sign-in and sign-up pages
- Either configure Google OAuth credentials or remove the button entirely until they're added
- Getting Google OAuth credentials: Google Cloud Console → Create OAuth 2.0 Client → Authorized redirect URI: `http://localhost:3000/api/auth/callback/google`

### 1.5 Seed the Knowledge Base

This is the most important Phase 1 deliverable. The AI is useless without content.

**Minimum viable knowledge base for testing (manually curated):**
- [ ] RDB: Company registration guide (public PDF from rdb.rw)
- [ ] RDB: Steps to register a Private Limited Company
- [ ] RRA: TIN registration process
- [ ] RRA: VAT registration thresholds and requirements
- [ ] BNR: Overview of PSP (Payment Service Provider) licensing
- [ ] BNR: Digital lending guidelines
- [ ] RURA: ICT licensing overview
- [ ] RSSB: Employer registration requirements
- [ ] Rwanda Labour Law summary: employment contracts, probation, termination
- [ ] Official Gazette: summary of most recent relevant regulatory changes

**Ingestion process (manual, pre-pipeline):**
1. Download/copy the document text
2. Chunk into ~300-word segments with 50-word overlap
3. Run through the embedding function (`voyage-3` model)
4. Insert into `knowledge_embeddings` with correct `sector_tags`, `doc_type`, `reg_body`, `source_title`, `source_url`

A simple Node.js ingestion script in `scripts/ingest-document.ts` should be written for this. It is much faster than doing it manually per row.

### 1.6 Compliance Chat — Make It Actually Work

Once the API key is fixed and knowledge base has content:
- [ ] Test the full RAG loop: question → embed → pgvector search → tool result → LLM answer
- [ ] Verify citations render correctly in the chat UI
- [ ] Test "no results found" graceful handling
- [ ] Verify the business profile is being injected into the system prompt
- [ ] Add the "This is not legal advice" disclaimer to every response

### 1.7 Beta Access Setup

- [ ] Set up a waitlist or invite-only flow
- [ ] Add in-app feedback widget on chat responses (👍 👎 + optional text)
- [ ] Track: queries that return "no relevant documents found" (knowledge base gap signals)
- [ ] Set up email notifications with Resend (welcome email on sign-up)

### Phase 1 Success Criteria
- AI compliance chat returns accurate, cited answers for at least 80% of test queries
- 3 sectors fully covered in knowledge base
- 20 real Rwanda founders have used the product
- Zero documented cases of materially wrong compliance guidance

---

## Phase 2: Intelligence Hub

**Goal:** Launch the market intelligence product. Company directory and sector dashboards become the top-of-funnel (free) product, while compliance remains the core revenue driver.

**Do not start Phase 2 until:**
- Phase 1 compliance chat is working accurately
- At least 20 active compliance users
- Knowledge base covers 3 sectors with verified content

### 2.1 Company Directory

The Intelligence Hub needs data before it has UI. Bootstrap the company directory before building the pages.

**Data strategy:**
- Start with 50 manually verified companies across 3 sectors (Fintech, Agritech, ICT)
- Source: RDB public registry, company websites, PSF member directory
- Each company needs: name, sector, description, website, founding year, employee range, known licenses
- Data must be verified against primary sources before publication

**Directory features:**
- [ ] Search by name, sector, location, stage
- [ ] Filter panel (sector, biz type, employee range, funded/bootstrapped)
- [ ] Company profile pages (individual pages per company)
- [ ] "Last verified" date visible on all data
- [ ] Data source attribution on each field
- [ ] Free tier: 20 results/search, core fields only
- [ ] Pro tier: unlimited results, all fields, CSV export

### 2.2 Sector Intelligence Dashboards

One dashboard per sector showing:
- Company count and growth over time
- Sub-sector breakdown (Recharts pie chart)
- Funding totals and recent rounds
- Key players (top 5 by funding or employee count)
- Regulatory landscape summary (AI-generated from knowledge base)
- Recent relevant news

### 2.3 AI Market Analyst

Same RAG architecture as compliance chat, but grounded in public company and market data rather than regulatory documents:
- "List all fintech companies with a BNR Payment Service Provider license"
- "Who are the active investors in Rwanda's agritech sector?"
- "What sub-sectors of ICT are underserved in Rwanda?"
- "Compare Irembo's product scope to similar GovTech companies in the region"

### 2.4 Data Pipeline (Python — Separate Project)

Before Phase 2 can scale beyond manually entered data, the Python data pipeline must be built:
- [ ] Set up Railway project for the pipeline service
- [ ] Build PDF extractor for government publications (BNR circulars, RRA notices)
- [ ] Build web scraper for RDB company registry (public data only)
- [ ] Build text chunker and embedding pipeline
- [ ] Automated monitoring: detect new government publications daily
- [ ] Human review queue before any regulatory content is published

### Phase 2 Success Criteria
- Company directory: 200+ verified companies
- Sector dashboards: 3 sectors live with real data
- AI market analyst answers 5 benchmark test queries accurately
- 500 registered users total
- 50+ paying subscribers

---

## Phase 3: Full Product

### 3.1 Document Vault
- File upload (drag and drop, PDF/JPG/PNG)
- Cloudflare R2 storage with org-scoped paths
- AI document analysis: extract document type, dates, license numbers, expiry
- Map uploaded documents to compliance steps they fulfill
- Expiry alerts (email 60 days before expiry)

### 3.2 PDF Report Export
- Templates: Compliance Summary, Sector Analysis, Competitive Landscape
- HTML/CSS report templates rendered by Puppeteer on Railway
- Stored in R2, delivered via signed URL (1 hour expiry)
- Available on Pro tier (5/month) and Team tier (unlimited)

### 3.3 Competitor Benchmarking
- Select a company as reference point
- System identifies comparable companies in the directory
- Side-by-side comparison table
- AI-generated market position analysis and gap identification

### 3.4 Automated Newsfeed
- Automated ingestion from government RSS feeds and monitored URLs
- AI-generated plain-language summaries (human review for regulatory items)
- Weekly email digest (opt-in, sector-filtered)
- Impact assessment: "How does this regulatory change affect your business?"

### 3.5 Company Profile Claiming
- Verified companies can claim and update their profile
- "Claimed" badge distinguishes self-reported from independently verified data
- Editorial review before changes go live

---

## Phase 4: Growth (Month 8+)

### API Product
- Public API for company directory data and compliance roadmap generation
- Metered billing via Stripe
- Target customers: law firms, accelerators, government agencies, DFIs

### Data Partnerships
- Formal data sharing with RDB (registry API access)
- BNR regulatory update feeds
- PSF member data integration

### Geographic Expansion
- Uganda (similar regulatory structure, EAC integration)
- Kenya (larger market, higher complexity)
- Framework: region/sector as modular overlays on the same platform

### White-Label
- Compliance module licensed to law firms, business associations, accelerators
- They brand it; we power it

---

## Cross-Cutting Non-Negotiables (Every Phase)

### Data Quality Gate
No regulatory content enters the knowledge base without:
1. Human review against the primary source document
2. Sign-off from a reviewer
3. Marked "verified" with date and reviewer name
4. Scheduled re-verification date (max 90 days)

### Legal Disclaimer
Every AI compliance response must include: *"This information is for general guidance only and does not constitute legal advice. Consult a qualified Rwanda-admitted attorney for advice specific to your situation."*

### Accuracy Tracking
- User can flag any response as inaccurate (single click)
- Flagged responses trigger human review within 24 hours
- Track: accuracy rate, "I don't know" rate, most common query types
- Monthly accuracy review with a legal advisor (at least from Phase 1 beta onward)

---

## Product Backlog — Identified but not yet scheduled

> Items here are confirmed desirable but not yet placed in a phase. Assign to a phase when scoped.

### AI Chat UI Overhaul (Priority: High — assign to Phase 1.8)
The current chat UI streams text as a wall. Needs a full redesign pass:
- **Citations as interactive cards** — every AI claim links to the source document with a clickable card showing: source title, reg body, date, relevance snippet. Not buried in text — surfaced as UI elements below the response.
- **Streaming that looks intentional** — not raw text dumping. Consider showing a "thinking" skeleton before the response starts, then fade-in paragraphs.
- **Response anatomy** — structure each response into: summary (1–2 sentences), then detail, then sources. The AI should be prompted to output structured sections.
- **Message actions** — copy response, share, flag as inaccurate (currently 👍/👎 only)
- **Conversation context** — show a sidebar with conversation topics / question history
- Design reference: Linear's AI interface, Perplexity's cited answers UI

### Newsfeed Phase 2 — Real-time Rwanda Intelligence (Priority: High — assign to Phase 2.5)
*Full design in docs/NEWSFEED_DESIGN.md*
- [ ] Cron job to scrape The New Times, BNL, BNR press releases, RRA announcements, Official Gazette
- [ ] AI pipeline: article text → relevance classification → impact level → business-profile-aware summary
- [ ] Article detail page with: AI summary tailored to user's business type + embedded chat ("ask me how this affects you")
- [ ] "Read" tab: archive of viewed articles, organized by date
- [ ] Deduplication (same story from multiple sources → one card)
- [ ] Weekly email digest: top 3–5 items relevant to your sector

### Document Vault (Priority: Medium — Phase 3 confirmed)
*Full analysis in docs/VAULT_STRATEGY.md*
- [ ] File upload (Cloudflare R2, org-scoped paths)
- [ ] AI document parser: extract type, expiry, license number, issuing body
- [ ] Map uploaded documents to compliance steps ("this satisfies step 6")
- [ ] Expiry alerts: email 60 days + 14 days before expiry
- [ ] Vault dashboard: visual map of what's in order, what's missing, what's expiring
- [ ] RAG over user's own documents: "When does our BNR license expire?"

### Consultant Product / B2B (Priority: Medium — Phase 3–4)
*Full analysis in docs/VAULT_STRATEGY.md*
- [ ] Multi-client dashboard (one consultant sees all their clients)
- [ ] Per-client compliance status at a glance
- [ ] Exportable compliance reports (PDF)
- [ ] Separate pricing tier ($X/month per firm)
- [ ] Target: PSF member firms, law firms, RDB-authorized agents

### AI Compliance Chat vs Market Analyst — UX Differentiation (Priority: High — Phase 1.8)
Currently both chats look identical. Needs clear visual and functional distinction:
- Compliance Chat: "Your regulatory advisor" — knows your profile, personalized, cautious, always cites
- Market Analyst: "Your market researcher" — talks about sectors/companies/ecosystem, data-driven
- Consider: different color schemes, different UI layouts, different example prompts
- Consider: compliance = free, market analyst = paid (or vice versa)
- Full thinking in docs/VISION.md

### The Compliance Score (Priority: Low — Phase 4)
- A 0–100 score representing a business's compliance readiness
- Based on: which steps are completed, what documents are in the vault, how recently verified
- Shareable link (for investors, lenders, partners)
- BZ Intelligence becomes a trusted credentialing layer

### AI Compliance Document Drafter (Priority: Medium — Phase 3)
- AI drafts RISA-compliant data protection policy from your profile
- AI drafts AML/CFT policy for BNR PSP applicants
- AI drafts Rwanda Labour Law compliant employment contract template
- Watermarked: "Draft only — review with a qualified attorney before use"
