# BZ Intelligence

> **The operating system for doing business in Rwanda.**

A comprehensive Business Intelligence & Compliance Ecosystem for Rwanda — an AI-powered platform where investors, founders, and researchers can find, query, and act on verified information about Rwanda's companies, sectors, and regulatory landscape.

---

## Documentation

| Document | Description |
|----------|-------------|
| [MANIFESTO.md](./MANIFESTO.md) | Vision, mission, values, hard questions answered, personas |
| [PRODUCT.md](./PRODUCT.md) | Product modes, feature list, user journeys, pricing model |
| [ARCHITECTURE.md](./ARCHITECTURE.md) | Technical architecture, RAG system, database schema, security |
| [TECHSTACK.md](./TECHSTACK.md) | Tech stack with full reasoning for every decision |
| [ROADMAP.md](./ROADMAP.md) | Phased implementation plan with KPIs |
| [DATA_STRATEGY.md](./DATA_STRATEGY.md) | Data sources, quality process, the data moat |

---

## The Two Modes

**Intelligence Mode** — "Tell me about the market"
For investors, researchers, and corporate strategists who need a searchable, AI-queryable view of Rwanda's business ecosystem.

**Compliance Mode** — "Tell me what I need to do"
For founders and SME operators who need a personalized, step-by-step guide through Rwanda's regulatory landscape.

Both modes draw from the same verified knowledge base.

---

## Stack Summary

- **Frontend:** Next.js 14 + TypeScript + Tailwind + shadcn/ui
- **Database:** Neon (serverless PostgreSQL + pgvector) + Drizzle ORM
- **Auth:** Better Auth (open-source, self-hosted)
- **Storage:** Cloudflare R2 (zero egress fees)
- **AI:** Anthropic Claude API (claude-sonnet-4-6) + Vercel AI SDK
- **Embeddings:** OpenAI text-embedding-3-small
- **Pipeline:** Python (pdfplumber, BeautifulSoup, Celery, asyncpg) on Railway
- **Deployment:** Vercel + Railway

---

## Start Here

Read [MANIFESTO.md](./MANIFESTO.md) to understand what we're building and why.
Then [ROADMAP.md](./ROADMAP.md) to understand what to build first.
