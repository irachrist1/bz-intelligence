# BZ Intelligence

> **The operating system for doing business in Rwanda.**

A comprehensive Business Intelligence & Compliance Ecosystem for Rwanda — an AI-powered platform where investors, founders, and researchers can find, query, and act on verified information about Rwanda's companies, sectors, and regulatory landscape.

---

## Documentation

| Document | Description |
|----------|-------------|
| **[STATUS.md](./STATUS.md)** | **← Start here. Current build state, what works, what's broken, immediate next steps.** |
| [ROADMAP.md](./ROADMAP.md) | Phased implementation plan — updated to reflect actual progress |
| [MANIFESTO.md](./MANIFESTO.md) | Vision, mission, values, hard questions answered, personas |
| [PRODUCT.md](./PRODUCT.md) | Product modes, feature list, user journeys, pricing model |
| [ARCHITECTURE.md](./ARCHITECTURE.md) | Technical architecture, RAG system, database schema, security |
| [TECHSTACK.md](./TECHSTACK.md) | Tech stack with full reasoning for every decision (includes what's actually installed vs planned) |
| [DATA_STRATEGY.md](./DATA_STRATEGY.md) | Data sources, quality process, the data moat |

---

## The Two Modes

**Intelligence Mode** — "Tell me about the market"
For investors, researchers, and corporate strategists who need a searchable, AI-queryable view of Rwanda's business ecosystem.

**Compliance Mode** — "Tell me what I need to do"
For founders and SME operators who need a personalized, step-by-step guide through Rwanda's regulatory landscape.

Both modes draw from the same verified knowledge base.

---

## Actual Stack (as built, March 2026)

- **Frontend:** Next.js 16 + TypeScript + Tailwind + shadcn/ui
- **Database:** Neon (serverless PostgreSQL + pgvector) + Drizzle ORM
- **Auth:** Better Auth (open-source, self-hosted, email/password working)
- **Storage:** Cloudflare R2 — deferred to Phase 3
- **AI:** Anthropic Claude (claude-sonnet-4-6) + Vercel AI SDK v6 — wired but API key invalid
- **Embeddings:** Voyage AI voyage-3 (1024 dims) — replaces OpenAI, 200M free tokens
- **Pipeline:** Python — not yet started (Phase 2)
- **Deployment:** Local only — not yet on Vercel

---

## Start Here

New to this codebase? Read **[STATUS.md](./STATUS.md)** first — it tells you exactly what works, what's broken, and what to do next.

Then [MANIFESTO.md](./MANIFESTO.md) to understand what we're building and why.
Then [ROADMAP.md](./ROADMAP.md) for the phased implementation plan.
