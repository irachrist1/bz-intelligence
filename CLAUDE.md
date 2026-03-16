# CLAUDE.md

This file provides guidance to Claude Code when working with this repository.

## What This Is

BZ Intelligence — Rwanda business compliance and market intelligence platform. Compliance roadmap, tender pipeline, AI chat with RAG, newsfeed. Full SaaS with auth, orgs, and payments.

## Commands

```bash
# Development
npm run dev                 # Next.js dev server with Turbo (localhost:3000)

# Build
npm run build               # Production build
npm start                   # Start production server

# Database
npm run db:generate         # Generate Drizzle migrations
npm run db:push             # Push schema to Neon (uses DATABASE_URL_UNPOOLED)
npm run db:studio           # Open Drizzle Studio UI
npm run db:migrate          # Run pending migrations
npm run db:seed             # Seed regulatory bodies + compliance steps

# Knowledge Base
npm run kb:ingest           # Ingest & embed documents into knowledge base
npm run kb:clear            # Clear ingested documents

# Data Seeding
npm run seed:news           # Seed sample news items
npm run seed:sources        # Seed tender sources (RPPA, World Bank, UNGM, ADB, USAID, EU)
```

## Architecture

### Tech Stack
- Next.js 16 (App Router), React 19, TypeScript
- Neon PostgreSQL with pgvector (1024-dim HNSW index)
- Drizzle ORM 0.45 (type-safe, edge-compatible)
- Better Auth 1.4 (email/password + organization plugin)
- AI: Claude Sonnet 4.6 via Anthropic SDK, falls back to Google Gemini
- Embeddings: Voyage AI (`voyage-3`, 1024 dimensions)
- AI SDK 6 with streaming (`@ai-sdk/react`, `@ai-sdk/anthropic`)
- Cloudflare R2 (S3-compatible file storage, 3 buckets)
- Upstash Redis (caching + rate limiting: 20 req/hour)
- Stripe (payments), Resend (email), Sentry (monitoring)
- Tailwind CSS 4 + shadcn/ui + Recharts

### Route Structure
```
app/
├── (auth)/                    # Sign-up, sign-in (unprotected)
├── (dashboard)/               # Protected by Better Auth session
│   ├── onboarding/            # Multi-step business profile questionnaire
│   ├── compliance/            # Compliance roadmap + AI chat
│   ├── intelligence/          # Market intelligence + AI chat
│   ├── tenders/               # Tender pipeline (watching → submitted → won/lost)
│   ├── newsfeed/              # News items + read tracking
│   └── documents/             # Document vault (Phase 3, stub)
└── api/
    ├── auth/[...all]/         # Better Auth catchall
    ├── ai/chat/               # Streaming RAG chat endpoint
    ├── ai/model/              # Active model detection
    ├── compliance/roadmap/    # Filtered steps by business profile
    ├── tenders/               # Tender CRUD
    └── cron/                  # Deadline reminders, weekly digest
```

### Database Schema
**Public tables**: `regulatory_bodies`, `companies`, `regulations`, `compliance_steps`, `knowledge_embeddings` (pgvector), `news_items`, `tenders`, `tender_sources`

**Private tables** (org-scoped): `business_profiles`, `firm_profiles`, `org_documents`, `compliance_history`, `news_reads`, `tender_saves`, `alert_preferences`, `chat_sessions`, `chat_messages`

**Auth tables** (Better Auth auto-generated): `users`, `accounts`, `sessions`, `organizations`, `organization_members`

### RAG Pipeline
1. Query → Voyage AI embedding (1024 dims)
2. pgvector similarity search on `knowledge_embeddings` (top-K=10-20)
3. Filter by metadata (sector, docType, regBody, isCurrent=true)
4. Inject user's business profile (compliance mode)
5. LLM call with `searchKnowledgeBase` tool
6. Stream response with citations

## Key Patterns

- **Org scoping**: Every private table query must include `where(eq(table.orgId, orgId))` — no exceptions
- **AI model resolution**: `resolveModelInfo()` checks for `sk-ant-` prefix on Anthropic key, falls back to Gemini
- **Compliance personalization**: Business profile flags (`handlesMoney`, `collectsData`, etc.) filter which steps appear
- **Rate limiting**: 20 queries/hour per user via Upstash sliding window
- **Document storage**: R2 under `{orgId}/{docId}/{filename}`, AI extracts key fields on upload

## Environment Variables

```env
# Database (Neon)
DATABASE_URL=                          # Pooled connection
DATABASE_URL_UNPOOLED=                 # Direct (migrations only)

# Auth
BETTER_AUTH_SECRET=                    # openssl rand -hex 32
BETTER_AUTH_URL=http://localhost:3000

# AI
ANTHROPIC_API_KEY=                     # REST key from console.anthropic.com
GOOGLE_GENERATIVE_AI_API_KEY=          # Fallback (aistudio.google.com)
VOYAGE_API_KEY=                        # Embeddings

# Storage (Cloudflare R2)
CF_ACCOUNT_ID=
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=

# Payments & Email
STRIPE_SECRET_KEY=
RESEND_API_KEY=

# Caching
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=
```

## Current State

**Working**: Auth (sign-up/in, sessions, orgs), onboarding questionnaire, compliance roadmap (personalized by sector), newsfeed with read tracking, dark mode, rate limiting, pgvector knowledge base (25 chunks from 8 regulatory docs).

**Broken/WIP**:
- AI Chat: Needs a REST API key from console.anthropic.com (not an OAuth token). RAG pipeline works, only the final LLM call fails without a valid key.
- Tender tables: Schema defined but not pushed to Neon yet. Run `npm run db:push` to create them.
- Company directory: Empty, needs seed data.
- Documents page: Stub UI only (Phase 3).
