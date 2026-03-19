# BZ Intelligence

AI-powered business intelligence platform for the Rwanda tech ecosystem.

BZ Intelligence ingests company profiles, candidate data, and ecosystem signals, then surfaces structured insights through an AI layer. It started as a merger of two separate tools — a business directory and a tech cluster map — and now functions as a unified intelligence system for investors, operators, and ecosystem builders working in the Rwanda market.

## What it does

- **Company intelligence** — 131+ verified Rwanda tech companies with enriched profiles, funding signals, and tech stack data
- **Talent layer** — 224+ candidate profiles linked to companies and skill domains
- **Ecosystem analytics** — sector breakdowns, growth trends, and market coverage across the Rwanda tech space
- **AI-powered search and Q&A** — natural language queries over the entire dataset via Claude
- **Tech Ecosystem module** — absorbed from Rwanda Tech Cluster, covers the full map of ESOs, hubs, investors, and accelerators

## Stack

- Next.js 16 + TypeScript + Tailwind + shadcn/ui
- Neon PostgreSQL + Drizzle ORM
- pgvector for semantic search
- Better Auth
- Anthropic Claude API (AI layer)
- Sentry for observability

## Status

Active development. Core ingestion pipeline is complete. AI chat and search are functional. Ongoing work: expanded data coverage, investor-facing views, and deeper analytics.
