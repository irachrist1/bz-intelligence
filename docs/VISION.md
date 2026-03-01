# BZ Intelligence — Vision & Strategic Thinking

> This is a living document for brainstorming and strategy. Not a task list. Not a spec.
> Write freely. No idea is too small or too big. Bad ideas get crossed out, not deleted.

---

## What this is — one-liners

*Collecting the best ways to describe this in one sentence. Pick the one that lands.*

- "The operating system for doing business in Rwanda."
- "Bloomberg Terminal for Rwanda's startup ecosystem — but for founders, not bankers."
- "The compliance layer every Rwanda business didn't know they needed."
- "An AI advisor that speaks Rwanda regulatory fluently so you don't have to."
- "The first thing you open when you're starting a business in Rwanda."
- "The intelligence platform that turns Rwanda's regulatory complexity into a competitive advantage."
- "We translate Rwanda's regulatory system into plain language, and then act on it for you."

---

## The core insight

Rwanda is one of the best countries in Africa to start a business. World Bank consistently ranks it top 5 in Africa for ease of doing business. But the actual experience of navigating RDB, RRA, BNR, RISA, RURA, RSSB — often in French and Kinyarwanda, with outdated PDFs and in-person queues — is miserable.

The gap between Rwanda's ambition and the day-to-day reality of regulatory compliance is enormous. BZ Intelligence lives in that gap.

The insight: **regulatory complexity is not a bug, it's a feature for us**. The more confusing the system, the more valuable a guide becomes. We want the system to stay complex — we just want to be the only one who can navigate it clearly.

---

## What this could become

### The compliance layer
Every business in Rwanda needs to interact with 5–8 regulatory bodies over their lifetime. We become the layer that sits between the business and those bodies. Not a law firm. Not a consultant. An always-on AI advisor that knows what you've done, what you still need to do, and what changed while you were asleep.

### The intelligence layer
Rwanda's private sector is largely opaque. Finding out who's licensed, who's funded, who's competing in your space is genuinely hard. We make that information searchable, analyzable, and actionable. Think PitchBook meets Bloomberg meets RDB registry — but designed for founders, not fund managers.

### The operating system
Eventually: a business opens, they register on BZ Intelligence, and we become the single pane of glass for everything compliance, everything market intelligence, everything documentation. The platform that knows your business better than you do.

---

## Strategic bets

**Bet 1: Data quality is the moat, not the AI**
Anyone can wire up a chatbot to an LLM. The actual defensible asset is a verified, up-to-date, expert-reviewed Rwanda regulatory knowledge base. If we get this right, competitors can't just copy us — they have to spend years building the same database.

**Bet 2: Rwanda is the beachhead, East Africa is the market**
Rwanda is small (17M people, ~$12B GDP). But it's the right place to start: pro-business government, strong English penetration, well-documented regulatory environment, aspirational tech ecosystem. Once we've nailed Rwanda, Uganda, Kenya, and Tanzania are natural expansions with similar regulatory structures.

**Bet 3: Compliance first, intelligence second**
Compliance is urgent. Intelligence is important. Founders will pay for "help me not get fined" before they'll pay for "help me understand the market." Start where the pain is sharpest.

**Bet 4: The consultant market is bigger than the founder market**
Individual founders: maybe 2,000 addressable early-stage companies in Rwanda today. Law firms, business advisors, accelerators, incubators: they each serve 20–100 clients. If we sell one seat to PSF, we touch hundreds of companies. B2B2B is a bigger opportunity than we initially scoped. *[See docs/VAULT_STRATEGY.md for the full analysis.]*

---

## Ideas in flight — rough & unfiltered

*These are half-formed. Some will become features. Some will get killed. Document them anyway.*

### The personalized regulatory briefing
Every Monday morning, a user gets a 5-minute digest: "Here's what changed this week that affects your business." BNR issued a new circular on digital lending. RRA updated PAYE thresholds. This is relevant because you're a fintech with 12 employees. — *Not generic news. Context-aware, business-profile-aware.*

### The document vault
Businesses upload their compliance documents: incorporation cert, TIN, PSP license, employment contracts. We:
1. Extract and store key metadata (expiry dates, license numbers, issuing body)
2. Map documents to compliance steps ("this satisfies step 6: BNR PSP License")
3. Alert on upcoming expiries
4. Let the AI answer questions against the user's own documents

The deeper vision: a business's entire compliance paper trail, organized, searchable, and AI-queryable. "When does our BNR license expire?" → pulls from their vault instantly.

*Full analysis: see docs/VAULT_STRATEGY.md*

### The consultant product (B2B play)
Law firms and business advisors in Rwanda each manage 20–100 companies. They currently track compliance status in spreadsheets. We sell them a multi-client dashboard: see all clients, their compliance status, upcoming renewals, recent regulatory changes affecting their industries. A consultant logs in and sees their entire portfolio at a glance.

This is a separate product sold separately ($X/month per firm, not per user). And it's extremely sticky — consultants don't churn when their entire workflow depends on you.

### The AI compliance drafter
Beyond answering questions, the AI drafts actual documents:
- Data protection policy (RISA-compliant)
- AML/CFT policy (BNR-compliant for PSPs)
- Employment contract (Rwanda Labour Law compliant)
- Privacy notice (for website/app)

Not legal advice — a starting point. This is enormously valuable for early-stage founders who can't afford a lawyer for every document.

### The regulatory change monitor
A system that watches official government websites and the Rwanda Official Gazette for new publications. When something relevant drops, it's processed by AI, classified, and surfaced to affected users. Rwanda publishes regulatory changes — but nobody is reading the gazette.

### The "compliance score"
A business profile score out of 100 representing their compliance readiness. Gamified. Shareable (with a lender, investor, or partner). "Our company has a 94/100 compliance score, verified by BZ Intelligence." This is a credentialing play — we become the trusted third party that vouches for a company's compliance status.

### The investor-grade intelligence product
A premium tier targeted at VCs, DFIs, and angels doing due diligence on Rwanda deals. Faster than hiring a local law firm. Deeper than any public data source. Includes: regulatory history, license status, compliance gaps, comparable companies, market size estimates.

### The Rwanda ecosystem map
A public-facing free product: a visual, searchable map of Rwanda's startup ecosystem by sector, stage, and location. Drives organic traffic. Generates leads. Positions BZ Intelligence as THE source of truth for Rwanda's private sector.

---

## What this is NOT

- Not a law firm. Never legal advice. Always a starting point, always verified against primary sources.
- Not a government service. We're independent. We have opinions. We flag when regulations are unclear or contradictory.
- Not a generic AI chatbot. We don't answer questions we don't have verified sources for. We say "I don't know" when we don't know.
- Not a data aggregator. We verify everything. Low-quality data is actively harmful in compliance contexts.

---

## The AI Chat vs The Market Analyst — what's the actual difference?

*This needs to be crystal clear to users. Currently it isn't.*

**Compliance Chat** — your personal regulatory advisor
- Knows your business profile deeply
- Answers: "Do I need this license?" "What does this regulation mean for me?" "Help me understand my obligations"
- Personality: careful, precise, always cites sources, always adds "verify with the relevant authority"
- Think: a very diligent junior lawyer who has memorized every Rwanda regulatory document
- Access: compliance mode users only
- The AI talks TO you about YOUR situation

**Market Analyst AI** — your market intelligence researcher
- Knows Rwanda's business ecosystem
- Answers: "Who are the active BNR-licensed PSPs?" "What's the funding landscape in Rwandan agritech?" "Which sectors are underserved?"
- Personality: analytical, data-driven, talks about sectors and companies not individual situations
- Think: a research analyst who has mapped every company in Rwanda
- Access: intelligence mode users (different audience entirely — investors, consultants, researchers)
- The AI gives you MARKET DATA, not personalized advice

These are two different products for two different users. The UI should make this unmistakable.

---

## Revenue model thinking

**Current plan:** Free → Pro ($29) → Team ($79) → Enterprise

**Questions to resolve:**
- Should compliance and intelligence be separately priced, or bundled?
- Is the consultant product a separate SKU at a higher price point?
- Can we charge for verified compliance reports (PDF exports)?
- Is the document vault a premium feature or a core feature?
- What does "free forever" look like that still creates upgrade pressure?

**Early hypothesis:**
- Free: compliance roadmap (read-only) + 5 AI queries/month + basic newsfeed
- Pro: unlimited AI queries + document vault + personalized newsfeed
- Team: multiple users per org + consultant features
- Enterprise: API access + custom knowledge base + white-label

---

## Design philosophy

Speed and simplicity are the product. Not features.

The best compliance tool is the one that gets used. A beautiful, fast, simple product that covers 80% of cases will beat a comprehensive but complex tool every time.

Design principles:
1. **Speed above everything.** Every page under 1 second. Every AI response starts within 500ms.
2. **One thing per screen.** No dashboards crammed with widgets. Each view has one job.
3. **Show, don't ask.** Don't make the user think about what they need — surface it based on what we know about them.
4. **Sources are not optional.** Every AI claim must be traceable to a specific document with a specific date. Trust is our product.
5. **Dark mode is first-class.** Not an afterthought. Professional tools look professional.

---

## Competitive landscape

**Direct competitors (Rwanda):** None known. This appears to be an open space.

**Indirect competitors:**
- Generic AI chatbots (ChatGPT, Claude.ai) — not Rwanda-specific, hallucinate regulatory details
- Law firms — expensive ($200–500/hour), not scalable, not always up to date
- RDB's own portal — government-paced, incomplete, no AI
- PSF publications — good but static, not personalized, not searchable

**The moat:** The combination of:
1. Rwanda-specific verified knowledge base (takes years to build well)
2. Business profile personalization (can't be replicated by generic tools)
3. Network effects from the consultant product (each consultant brings 20-100 companies)

---

## Open questions / things to figure out

- [ ] What does the "compliance score" certification look like legally? Can we issue something that others trust?
- [ ] How do we handle the case where regulations change and our knowledge base is wrong/stale?
- [ ] At what point does this product require a legal advisor on staff or on retainer?
- [ ] Should we have a Kinyarwanda interface? French?
- [ ] How do we handle queries we can't answer with confidence — do we refer to specific lawyers or firms?
- [ ] Is there a Government of Rwanda partnership angle? (RDB has an accelerator program)
- [ ] What's the correct data retention policy for documents uploaded to the vault?
- [ ] How does this product handle a regulatory change that contradicts our previous advice?

---

*Last updated: March 2026*
*This document is for the product owner's thinking — not for external sharing*
