# BZ Intelligence — Product Specification

---

## Product Philosophy

BZ Intelligence is one platform with two modes. Both modes draw from the same underlying knowledge base of Rwanda-specific business and regulatory data. The distinction is in the direction of the query:

- **Intelligence Mode** — "Tell me about the market." Outward-facing, aggregated, read-only. For investors, researchers, corporates.
- **Compliance Mode** — "Tell me what I need to do." Inward-facing, personalized, document-aware. For founders, operators, expansion teams.

The user's profile determines which mode is their entry point. Both modes are accessible to all users.

---

## User Personas

### Persona 1: The Investor / Analyst (Primary: Intelligence Mode)
**Who:** VC funds, angel investors, corporate development teams, DFIs researching Rwanda market opportunities
**Jobs to be done:**
- Map the competitive landscape in a target sector
- Benchmark a specific company against peers
- Identify white spaces (underserved markets)
- Track regulatory changes that affect portfolio companies
**Current workaround:** Commission expensive market research reports ($3,000–$15,000), hire local consultants, manually piece together LinkedIn + news + government publications
**Pain:** Slow, expensive, incomplete, often stale by the time it's delivered

### Persona 2: The Founder / SME Owner (Primary: Compliance Mode)
**Who:** Entrepreneurs starting or running businesses in Rwanda, including those registering for the first time
**Jobs to be done:**
- Understand exactly what licenses they need
- Navigate the step-by-step process for registration and compliance
- Stay updated on regulatory changes that affect their business
- Prepare and understand required documents
**Current workaround:** Hire a lawyer ($200–$500/hour), ask friends, trial-and-error at government offices
**Pain:** Expensive, intimidating, opaque — especially for first-time founders

### Persona 3: The Corporate Strategist (Both Modes)
**Who:** Multinational companies entering Rwanda or doing competitive intelligence
**Jobs to be done:**
- Market entry assessment
- Competitive intelligence on local incumbents
- Regulatory gap analysis before expansion
**Current workaround:** McKinsey/Deloitte market entry reports, local law firm retainers
**Pain:** Extremely expensive for information that should be publicly accessible

### Persona 4: The Researcher / Academic (Primary: Intelligence Mode)
**Who:** University researchers, journalists, policy analysts, NGO analysts
**Jobs to be done:**
- Find structured, citable data on Rwanda's economy and companies
- Track sector trends over time
- Get verified facts for publications
**Current workaround:** Manual research across government sites, emailing RDB, citing incomplete Wikipedia articles
**Pain:** No single source of truth, unreliable data, no historical tracking

---

## The Two Modes in Detail

---

### Mode 1: Intelligence Hub

The Intelligence Hub is a structured, searchable, AI-queryable view of Rwanda's business ecosystem.

#### 1.1 Company Directory

The core asset. A verified, filterable database of companies operating in Rwanda.

**Filter dimensions:**
- Sector (Fintech, Agritech, Healthtech, Logistics, Energy, Retail, etc.)
- Sub-sector (e.g., within Fintech: Mobile Money, Digital Lending, Insurtech, Payment Processing)
- Stage (Startup, Growth, Established, Public/Listed)
- Funding status (Bootstrapped, Seed, Series A+, PE-backed)
- Year founded
- Headquarters location (Province/District)
- Size range (employee count)
- Regulatory status (Licensed, Pending, Unlicensed)
- Foreign/Domestic

**Company profile page includes:**
- Company overview (description, website, social)
- Founding team (key executives)
- Products/services offered
- Known funding history
- Regulatory licenses held (BNR, RURA, etc.)
- Industry classifications
- Last verified date + source citations
- "Related companies" sidebar
- AI-generated summary

#### 1.2 Sector Intelligence Dashboards

Pre-built dashboards for major sectors. Each shows:
- Number of active companies
- Sector composition breakdown (sub-sectors)
- Funding activity (total raised, recent rounds)
- Regulatory landscape (key licenses, current regulatory priorities)
- Market size estimates (with methodology note)
- Key players table
- Recent news feed (curated, sector-tagged)
- Trend indicators (growth vs. decline signals)

**Available sectors at launch (Phase 2):**
1. Financial Services & Fintech
2. Agriculture & Agritech
3. Health & Healthtech
4. Telecommunications & ICT
5. Energy & Cleantech

#### 1.3 AI Market Analyst (Intelligence Mode)

A conversational AI interface grounded in the knowledge base. Users can ask:
- "Which fintech companies in Rwanda offer digital lending?"
- "How many companies in Rwanda have a BNR payment service provider license?"
- "What are the biggest gaps in Rwanda's insurance sector?"
- "Compare Equity Bank Rwanda and I&M Bank in terms of their digital product offerings"

**Key behavior:**
- Every answer cites a source (company profile, regulatory document, sector report)
- If data is unavailable or uncertain, the AI says so explicitly
- Cannot answer questions outside Rwanda's business/regulatory domain
- Does not speculate — only synthesizes from the knowledge base

#### 1.4 Competitor Benchmarking Matrix

For users researching a specific company or planning to enter a market:
- Select a target company or business model
- System maps comparable companies
- Side-by-side comparison on: size, products, funding, regulatory status, geographic footprint
- AI generates a "competitive landscape summary" with gap analysis

#### 1.5 Insight Reports (PDF Export)

Premium feature. Generate a downloadable, professionally formatted PDF containing:
- Executive summary of sector or competitive analysis
- Key data tables
- AI-generated insights and recommendations
- Source citations and methodology
- Branded with BZ Intelligence watermark

---

### Mode 2: Compliance Assistant

The Compliance Assistant is a personalized, document-aware engine that creates a step-by-step regulatory path for each user's specific business.

#### 2.1 Smart Onboarding (Business DNA Capture)

When a user first enters Compliance Mode, they complete a structured questionnaire:
- Business type (sole proprietorship, Ltd, NGO, cooperative, branch of foreign company)
- Sector and sub-sector
- Target customer (B2B, B2C, B2G)
- Transaction type (if financial: lending, payments, insurance, investment)
- Revenue model
- Expected employee count
- Headquarters location
- Foreign ownership structure (if any)
- Current registration status (idea-stage, registered, operating)
- TIN status

This data forms the user's **Business Profile** — the context layer for all subsequent compliance queries.

#### 2.2 Dynamic Compliance Roadmap

Based on the Business Profile, the system generates a personalized, ordered compliance roadmap:

**Example roadmap structure for a Digital Lending Startup:**
1. ✅ Company Registration at RDB (prerequisites, documents, cost, timeline)
2. ✅ Tax Registration at RRA (TIN, VAT threshold, eTax setup)
3. 🔲 Microfinance Institution License from BNR (or determine if exempt)
4. 🔲 Data Protection Registration with RISA
5. 🔲 Consumer Protection compliance review
6. 🔲 Anti-Money Laundering (AML) policy + reporting obligations
7. 🔲 Annual RRA filing setup (PAYE, corporate tax, withholding tax)

Each step includes:
- **What it is**: Plain-language explanation
- **Who issues it**: Which regulatory body
- **Prerequisites**: What must be done first
- **Documents required**: Exact list
- **Where to apply**: Portal link or physical location
- **Cost**: Application fees
- **Timeline**: Expected processing time
- **What happens if you skip it**: Legal consequences

#### 2.3 Document Vault + AI Document Explainer

Users can upload their company documents (incorporation certificate, shareholder agreements, licenses, tax certificates). The system:
- **Categorizes** the document automatically
- **Extracts key data** (company name, registration date, license type, expiry date)
- **Flags compliance gaps**: "Your PSP license expires in 45 days. Here's how to renew it."
- **Explains legal jargon**: Hoverable tooltips that convert regulatory language into plain English
- **Maps documents to compliance steps**: Shows which roadmap steps are fulfilled vs. pending

**Privacy guarantee**: Uploaded documents are encrypted, isolated per organization, never used for training, never visible to other users.

#### 2.4 AI Compliance Chat

A conversational interface for compliance questions, grounded in the user's Business Profile and uploaded documents:
- "Do I need to register for VAT?"
- "What's the penalty if I miss my PAYE filing deadline?"
- "My company does both lending and money transfer — do I need two separate BNR licenses?"
- "What documents do I need to open a corporate bank account at BK?"

The AI combines:
- General Rwanda regulatory knowledge (from knowledge base)
- User-specific context (Business Profile + uploaded documents)
- Generates cited, personalized answers

#### 2.5 Regulatory Newsfeed

A curated stream of regulatory updates filtered to the user's sectors. Sources:
- Official Gazette of Rwanda
- BNR circulars and publications
- RRA announcements
- RURA directives
- PSF bulletins

Every item is tagged, summarized in plain language, and assessed for impact on the user's specific compliance posture.

#### 2.6 Compliance Health Score

A dashboard metric showing the user's current compliance posture:
- % of required steps completed
- Upcoming deadlines (tax filings, license renewals)
- Open action items
- Risk flags (expired documents, missed deadlines)

---

## Feature Prioritization (MoSCoW)

### Must Have (MVP — Phase 2)
- [ ] User authentication + Business Profile capture
- [ ] Company directory (basic: name, sector, description, website) with search and filter
- [ ] Compliance roadmap generator (for top 5 sectors)
- [ ] AI Compliance Chat (grounded in knowledge base)
- [ ] Regulatory newsfeed (manual curation at launch)
- [ ] Document vault (upload + storage)

### Should Have (Phase 3)
- [ ] Sector intelligence dashboards
- [ ] AI Market Analyst
- [ ] Document explainer / jargon tooltips
- [ ] Compliance health score
- [ ] Competitive benchmarking (basic)
- [ ] PDF report export

### Could Have (Phase 4)
- [ ] Full competitor benchmarking matrix
- [ ] Automatic document categorization + key data extraction
- [ ] Real-time regulatory newsfeed automation
- [ ] Company profile claiming (verified companies manage their own data)
- [ ] API access (Enterprise)
- [ ] White-label (for law firms, accelerators)

### Won't Have (for now)
- Stock market / securities data
- Financial modeling tools
- HR or payroll features
- Direct filing/submission to government portals (integration complexity)

---

## Pricing Model

### Free Tier
- 10 AI queries/month (both modes)
- Access to company directory (read-only, limited filters)
- Basic compliance checklist for 1 sector (non-personalized)
- 5 document uploads
- Goal: Drive top-of-funnel, let users experience the value, build trust

### Pro — $29/month (individual)
- Unlimited AI queries
- Full company directory with all filters
- Personalized compliance roadmap (all sectors)
- Document vault (50 documents)
- Regulatory newsfeed (personalized)
- PDF report export (5/month)
- Compliance health score

### Team — $79/month (up to 5 users)
- Everything in Pro
- Shared document vault
- Multi-sector compliance tracking
- PDF reports (unlimited)
- Priority support

### Enterprise — Custom pricing
- API access to company directory and compliance engine
- White-label deployment
- Custom data integrations
- Dedicated data verification SLA
- Suitable for: law firms, accelerators, DFIs, government agencies

---

## What We Are NOT

To stay focused, we explicitly define what we will not build:
- We are not a legal services firm. We provide information, not legal advice.
- We are not a filing service. We guide users to the right process; we don't submit applications on their behalf.
- We are not a CRM or ERP. Business operations management is not our domain.
- We are not a news aggregator. We curate only regulatory and business-relevant content.
- We are not a general-purpose AI chatbot. Our AI is constrained to Rwanda's business and regulatory domain.
