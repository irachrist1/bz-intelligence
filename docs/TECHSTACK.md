# BZ Intelligence — Tech Stack

Every decision below is made with three priorities: speed to market, operational simplicity, and predictable costs. Supabase was explicitly removed — slow, opaque billing, vendor lock-in on too many layers.

---

## The Stack at a Glance

| Layer | Technology | Version |
|-------|-----------|---------|
| Frontend Framework | Next.js (App Router) | 14+ |
| Language | TypeScript | 5+ |
| Styling | Tailwind CSS + shadcn/ui | Latest |
| Charts / Visualization | Recharts + Tremor | Latest |
| State Management | Zustand | 4+ |
| Database | Neon (serverless PostgreSQL) | Latest |
| ORM | Drizzle ORM | Latest |
| Vector Search | pgvector (via Neon) | Latest |
| Authentication | Better Auth | Latest |
| File Storage | Cloudflare R2 | Latest |
| AI / LLM | Anthropic Claude API | claude-sonnet-4-6 |
| AI SDK | Vercel AI SDK | 3+ |
| Embedding Model | OpenAI text-embedding-3-small | Latest |
| PDF Generation | Puppeteer | Latest |
| Data Pipeline | Python 3.11 + pdfplumber + BeautifulSoup | Latest |
| Email | Resend | Latest |
| Payments | Stripe | Latest |
| Deployment | Vercel (frontend) + Railway (pipeline/PDF) | — |
| Monitoring | Sentry + Vercel Analytics | Latest |
| Caching | Upstash Redis | Latest |

---

## Frontend

### Next.js 14 (App Router)
**Why:** Server components allow us to fetch and render company data, compliance roadmaps, and sector dashboards server-side — fast initial loads and good SEO. Streaming server components pair perfectly with the Vercel AI SDK. React Server Components reduce the JavaScript bundle for data-heavy dashboard pages.

**Why not:** Create React App (dead), Remix (smaller ecosystem), plain SPA (bad SEO).

### TypeScript
This codebase has complex data shapes — company profiles, compliance roadmaps, embedding metadata, regulatory rule trees. TypeScript prevents a class of runtime bugs that are extremely painful to debug in production when they involve compliance guidance.

### Tailwind CSS + shadcn/ui
**Tailwind:** Utility-first CSS with no runtime overhead. Faster iteration.

**shadcn/ui:** We own the component code, we can modify it freely, no dependency tree we can't control. Built on Radix UI primitives (accessible, headless) + Tailwind. Critical for customized filter UIs, compliance step cards, document upload interfaces.

### Recharts + Tremor
**Recharts:** Declarative charting — sector composition, funding trends, compliance health score.

**Tremor:** Pre-built dashboard components (metric cards, stat bars, data tables) in Tailwind. Gets us to a polished Intelligence Hub UI fast.

### Zustand
Lightweight global state for filter selections, mode switching, onboarding wizard progress. Right size — not Redux-heavy, not Context-fragile.

---

## Database

### Neon (Serverless PostgreSQL)

Neon replaces Supabase as the database. It's still PostgreSQL — we keep all the relational power and pgvector for embeddings — but with no vendor lock-in on auth or storage, and billing that scales to zero when idle.

**Why Neon:**
- **Scales to zero** — no idle compute charges. You pay for compute seconds used, not a flat monthly tier that bills whether you're active or not.
- **pgvector included** — same vector search capability, no separate service
- **Branching** — create instant database branches for dev/staging environments without duplicating data
- **Connection pooling built-in** (via pgBouncer proxy) — critical for serverless Next.js where each request is a new connection
- **No egress fees** within Neon
- **Straightforward pricing** — storage + compute seconds. No surprise charges for "realtime connections" or "edge function invocations"

**Why not PlanetScale:** MySQL — no pgvector support.
**Why not Turso:** SQLite — no pgvector, not suited for complex relational BI data.
**Why not Railway Postgres:** Good option but less scale-to-zero granularity and no branching.

### Drizzle ORM

The ORM layer between the application and Neon.

**Why Drizzle:**
- Type-safe SQL — the schema is the source of truth for TypeScript types
- Close to raw SQL — no magic, no N+1 surprises, complex joins are straightforward
- Works natively with Neon's serverless HTTP driver (`@neondatabase/serverless`)
- Migrations via `drizzle-kit generate` + `drizzle-kit push`
- Better Auth has first-class Drizzle adapter (no glue code needed)

**Why not Prisma:** Prisma's generated client doesn't work well with Neon's serverless driver. Edge compatibility issues. Drizzle is the better fit here.

**Schema definition example:**
```typescript
import { pgTable, uuid, text, boolean, timestamp, vector, integer } from 'drizzle-orm/pg-core'

export const companies = pgTable('companies', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  sector: text('sector').notNull(),
  description: text('description'),
  lastVerifiedAt: timestamp('last_verified_at'),
  // ...
})

export const knowledgeEmbeddings = pgTable('knowledge_embeddings', {
  id: uuid('id').primaryKey().defaultRandom(),
  content: text('content').notNull(),
  embedding: vector('embedding', { dimensions: 1536 }),
  sectorTags: text('sector_tags').array(),
  docType: text('doc_type'),
  isCurrent: boolean('is_current').default(true),
  lastVerifiedAt: timestamp('last_verified_at'),
})
```

---

## Authentication

### Better Auth

Open-source, self-hosted authentication. No monthly auth bill. No vendor lock-in. The auth data lives in our own Neon database.

**Why Better Auth over Clerk:**
- Free forever — no per-MAU billing that surprises you at scale
- Self-hosted — auth data stays in our Neon database, not a third-party service
- Full control — we own the session logic, the user schema, the tokens

**Why Better Auth over NextAuth/Auth.js:**
- Built-in organization (multi-tenancy) support — critical for our Team and Enterprise tiers
- First-class Drizzle adapter — schema and queries are generated and type-safe
- Cleaner API — less boilerplate than NextAuth for complex session shapes

**What Better Auth handles:**
- Email/password login with secure hashing
- Google OAuth (one config line)
- Organizations: users belong to orgs, org members have roles
- Session management (JWTs or database sessions)
- Middleware for Next.js route protection

**Multi-tenancy approach:**
Without Supabase's Row Level Security (database-enforced), we handle tenant isolation at the application layer:
- Every user session includes `orgId` from Better Auth
- Every Drizzle query on private data includes `.where(eq(table.orgId, session.orgId))`
- A shared `withOrg` query helper enforces this — developers cannot write a private-data query without specifying org context
- This is explicit, auditable, and easily testable

```typescript
// Example: every private query goes through this helper
const orgDocuments = await db
  .select()
  .from(orgDocs)
  .where(eq(orgDocs.orgId, session.user.orgId))  // always scoped
```

---

## File Storage

### Cloudflare R2

Object storage for user-uploaded compliance documents and generated PDF reports.

**Why R2 over S3:**
- **Zero egress fees** — S3 charges $0.09/GB for data transfer out. R2 charges $0. On a document-heavy compliance platform, this is the single biggest cost saving.
- S3-compatible API — we use `@aws-sdk/client-s3` pointing at the R2 endpoint. Zero migration friction if we ever need to switch.
- $0.015/GB/month storage (S3 is $0.023/GB)
- No minimum monthly spend

**Why R2 over Supabase Storage:**
- Supabase Storage is just S3 with markup. R2 is R2 — no egress markup.
- Not tied to the Supabase platform

**Implementation:**
```typescript
import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

const r2 = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.CF_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
})

// Upload a document
await r2.send(new PutObjectCommand({
  Bucket: 'user-documents',
  Key: `${orgId}/${docId}/${filename}`,
  Body: fileBuffer,
  ServerSideEncryption: 'AES256',
}))

// Generate signed download URL (expires in 1 hour)
const url = await getSignedUrl(r2, new GetObjectCommand({
  Bucket: 'user-documents',
  Key: `${orgId}/${docId}/${filename}`,
}), { expiresIn: 3600 })
```

**Bucket structure:**
- `user-documents/` — private per-org compliance documents
- `report-exports/` — generated PDF reports (private, signed URLs)
- `company-assets/` — public company logos (public bucket, CDN-served)

---

## AI Layer

### The SDK Stack

```
@ai-sdk/anthropic    — Anthropic provider for Vercel AI SDK
@ai-sdk/openai       — OpenAI provider (embeddings only)
ai                   — Vercel AI SDK core (streamText, generateObject, embed, useChat)
```

We use the **Vercel AI SDK** as the unified interface. It wraps the Anthropic and OpenAI APIs and handles streaming, structured output, tool calling, and React hooks — all with a consistent API. You don't call `@anthropic-ai/sdk` directly in the app layer.

---

### Vercel AI SDK — How We Actually Use It

#### 1. Streaming Chat (`streamText` + `useChat`)

The compliance chat and market analyst both stream responses back to the user in real time. This is also how we handle Vercel's 30-second function timeout — as long as tokens are flowing, the connection stays alive.

**Server (API route):**
```typescript
import { streamText } from 'ai'
import { anthropic } from '@ai-sdk/anthropic'

export async function POST(req: Request) {
  const { messages, orgId } = await req.json()

  // 1. Embed the last user message
  const query = messages.at(-1).content
  const context = await searchKnowledgeBase(query, { sectorTags: userSector })

  return streamText({
    model: anthropic('claude-sonnet-4-6'),
    system: buildSystemPrompt(context, userBusinessProfile),
    messages,
  }).toDataStreamResponse()  // streams tokens to client
}
```

**Client (React component):**
```typescript
import { useChat } from 'ai/react'

export function ComplianceChat() {
  const { messages, input, handleSubmit, isLoading } = useChat({
    api: '/api/compliance/chat',
  })

  return (
    <div>
      {messages.map(m => <Message key={m.id} {...m} />)}
      <form onSubmit={handleSubmit}>
        <input value={input} onChange={...} />
      </form>
    </div>
  )
}
```

`useChat` handles: streaming token display, loading state, error state, message history, auto-scroll. Zero boilerplate.

---

#### 2. Structured Output for Document Analysis (`generateObject`)

When a user uploads a compliance document, we need structured data back from the AI — not prose. `generateObject` validates the response against a Zod schema, so we get typed output with no manual JSON parsing.

```typescript
import { generateObject } from 'ai'
import { anthropic } from '@ai-sdk/anthropic'
import { z } from 'zod'

const DocumentAnalysisSchema = z.object({
  category: z.enum(['incorporation', 'license', 'tax_certificate', 'permit', 'other']),
  companyName: z.string(),
  registrationNumber: z.string().optional(),
  issuingBody: z.string(),
  issuedDate: z.string().optional(),
  expiryDate: z.string().optional(),
  licenseType: z.string().optional(),
  complianceStepFulfilled: z.string().optional(),
  flags: z.array(z.string()),  // ["expires in 30 days", "missing signature"]
})

const { object } = await generateObject({
  model: anthropic('claude-haiku-4-5-20251001'),  // fast + cheap for classification
  schema: DocumentAnalysisSchema,
  prompt: `Analyze this document and extract key information:\n\n${documentText}`,
})

// object is fully typed — object.expiryDate, object.category, etc.
```

---

#### 3. AI Tool Calling for RAG

Instead of a manual RAG pipeline (embed → search → inject → call LLM), we give the AI a `searchKnowledgeBase` tool. The AI decides when to search and what to search for. This is more flexible and handles multi-step queries naturally ("what licenses do I need AND what's the process for each one?").

```typescript
import { streamText, tool } from 'ai'
import { anthropic } from '@ai-sdk/anthropic'
import { z } from 'zod'

export async function POST(req: Request) {
  const { messages } = await req.json()

  return streamText({
    model: anthropic('claude-sonnet-4-6'),
    system: `You are a Rwanda business compliance assistant.
             Use the searchKnowledgeBase tool to retrieve verified regulatory information
             before answering. Always cite sources from your search results.
             If results are insufficient, say so — do not answer from general knowledge.`,
    messages,
    tools: {
      searchKnowledgeBase: tool({
        description: 'Search the verified Rwanda regulatory and business knowledge base',
        parameters: z.object({
          query: z.string().describe('The search query'),
          sectorFilter: z.string().optional().describe('Filter by sector e.g. fintech'),
          docType: z.enum(['regulation', 'company_profile', 'guideline']).optional(),
        }),
        execute: async ({ query, sectorFilter, docType }) => {
          // embed → pgvector search → return top chunks with citations
          return await searchKnowledgeBase(query, { sectorFilter, docType })
        },
      }),
    },
    maxSteps: 5,  // allow up to 5 tool call rounds before final answer
  }).toDataStreamResponse()
}
```

The AI will call `searchKnowledgeBase` one or more times, read the results, and then write its answer — all streamed to the user in real time.

---

#### 4. Embeddings (`embedMany`)

Used in the data pipeline to convert document chunks into vectors for storage in Neon/pgvector.

```typescript
import { embedMany } from 'ai'
import { openai } from '@ai-sdk/openai'

const { embeddings } = await embedMany({
  model: openai.embedding('text-embedding-3-small'),
  values: chunks,  // string[]
})

// embeddings is number[][] — insert into knowledge_embeddings table
await db.insert(knowledgeEmbeddings).values(
  chunks.map((content, i) => ({
    content,
    embedding: embeddings[i],
    sectorTags: metadata.sectorTags,
    docType: metadata.docType,
    lastVerifiedAt: new Date(),
  }))
)
```

---

### Model Selection by Task

| Task | Model | SDK Function | Reason |
|------|-------|-------------|--------|
| Compliance chat | `claude-sonnet-4-6` | `streamText` | Complex reasoning, tool calling |
| Market intelligence chat | `claude-sonnet-4-6` | `streamText` | Complex reasoning, tool calling |
| Document analysis | `claude-haiku-4-5-20251001` | `generateObject` | Simple extraction, fast, cheap |
| Report generation | `claude-sonnet-4-6` | `generateText` | Quality, long-form output |
| Newsfeed summaries | `claude-haiku-4-5-20251001` | `generateText` | Speed + cost |
| Embeddings | `text-embedding-3-small` | `embedMany` | Best cost/performance for English |

---

### Why Not Call the Anthropic SDK Directly?

You could. But the Vercel AI SDK gives you:
- **Streaming** built-in (`.toDataStreamResponse()` — one line)
- **`useChat` hook** — handles the entire client-side chat lifecycle
- **`generateObject`** — typed structured output with Zod validation
- **Tool calling** — multi-step RAG without manual orchestration
- **Provider abstraction** — swap Claude for another model without touching app code
- **`maxSteps`** — lets the AI call tools iteratively before giving a final answer

For a product where 80% of the backend is AI calls, this abstraction pays for itself immediately.

---

## Data Pipeline

### Python 3.11
Python's data ecosystem (pdfplumber, BeautifulSoup, spaCy, pandas) is unmatched for document processing. The pipeline is a separate service on Railway — doesn't need to share a language with the web app.

**Key libraries:**
- `pdfplumber` — PDF text extraction with layout awareness
- `BeautifulSoup4` + `Playwright` — HTML scraping (Playwright for JavaScript-rendered pages)
- `spaCy` — Named entity recognition (company names, license types)
- `langchain.text_splitter` — Semantic text chunking
- `openai` — Embedding API calls
- `asyncpg` — Direct async PostgreSQL connection to Neon (replaces supabase-py)
- `boto3` — Cloudflare R2 uploads (S3-compatible)
- `celery` + `redis` — Job queue for scheduled ingestion tasks

### Deployment: Railway
Long-running jobs (PDF processing, web scraping) need persistent processes. Lambda's 15-minute limit doesn't work. Railway gives persistent processes, cron scheduling, and simple deployment.

---

## PDF Generation

### Puppeteer on Railway
Design reports in HTML/CSS (same skills as the web app). Recharts renders to canvas, Puppeteer captures it. Professional output without learning a PDF DSL.

**Flow:** User requests PDF → API creates job → Puppeteer renders Next.js report route → returns PDF → stored in Cloudflare R2 → user gets signed download URL (expires 1 hour).

---

## Infrastructure & Deployment

### Deployment Architecture

```
GitHub
  │
  ├─► Vercel (auto-deploy on push)
  │     ├── Next.js app (frontend + API routes)
  │     └── Edge Middleware (auth check, rate limiting)
  │
  └─► Railway (GitHub integration)
        ├── Python pipeline service (Celery workers)
        └── Puppeteer PDF service (Node.js + Express)

External services (credentials only — no infra to manage):
  ├── Neon          → DATABASE_URL
  ├── Cloudflare R2 → R2 credentials
  ├── Upstash Redis → REST URL + token
  ├── Resend        → API key
  └── Stripe        → secret key + webhook secret
```

### Vercel (Next.js App)

Auto-detects Next.js — zero config. What it handles:
- **Preview deployments** on every PR — critical for reviewing AI response changes before merge
- **Edge Middleware** for session validation (Better Auth) and rate limiting (Upstash) on every request
- **CDN** for all static assets (JS bundles, images, public company logos from R2)
- **Streaming** AI responses via Server-Sent Events — the 30-second function timeout is not an issue because streaming connections stay alive as long as tokens flow

The only AI calls that could exceed 30s are non-streaming (PDF report generation). Those are routed to Railway's Puppeteer service, which has no timeout limit.

```jsonc
// vercel.json
{
  "functions": {
    "app/api/ai/**": { "maxDuration": 30 },      // streaming — fine
    "app/api/webhooks/**": { "maxDuration": 10 }
  }
}
```

### Railway (Pipeline + PDF Service)

Two separate Railway services:

**Python Pipeline** — Celery workers for all data ingestion:
- Scraping, PDF extraction, NLP enrichment, embedding, DB writes
- Cron-scheduled (e.g., daily government publication checks)
- No HTTP server — pure background workers
- Connects to Neon via `asyncpg`, R2 via `boto3`

**Puppeteer PDF Service** — Express.js + headless Chrome:
- Renders a Next.js report route to PDF
- No timeout constraints
- Returns PDF → stored in R2 → signed URL sent back to user

Why Railway for these (not Vercel):
- Celery workers must stay alive as persistent processes
- Chrome/Puppeteer is memory-heavy and needs a real server
- PDF rendering can take 10–60s — no serverless timeouts
- Predictable billing ($5/service/month base)

### Upstash Redis

Serverless Redis with a REST API — works from Vercel Edge Middleware without a persistent connection pool.
- **Rate limiting:** Per-user AI query counters on every request
- **Caching:** Sector dashboard aggregations (24h TTL), company search results (1h TTL)
- **Job signaling:** Notify Puppeteer service when a PDF job is queued

### Stripe

Webhook at `/api/webhooks/stripe` handles subscription changes:
1. User upgrades/downgrades on Stripe
2. Webhook updates `plan` field in Neon
3. Better Auth session picks up new plan on next request
4. Middleware enforces feature access based on plan

### Resend

React Email templates for: welcome emails, compliance deadline reminders (30 days out), document expiry alerts (60 days out), weekly regulatory digest (opt-in, sector-filtered), PDF report ready notification.

### Sentry

Error tracking on Vercel (Next.js) and Railway (pipeline + PDF service). Catches: unhandled API exceptions, AI tool call failures, pipeline job errors, and DB query timeouts.

---

## What We Explicitly Rejected

| Technology | Why |
|-----------|-----|
| Supabase | Slow, unpredictable billing, too much vendor lock-in across DB + Auth + Storage |
| Convex | Poor fit for relational data; no pgvector |
| Firebase | Non-relational; weak for complex BI queries |
| Clerk | Per-MAU billing gets expensive; Better Auth is free and self-hosted |
| Auth.js (NextAuth) | No built-in org/team support; more manual wiring required |
| AWS S3 | Egress fees; R2 is identical API at lower cost |
| Pinecone | Unnecessary when Neon + pgvector handles our scale |
| Prisma | Edge compatibility issues with Neon serverless driver; Drizzle fits better |
| PlanetScale | MySQL — no pgvector |
| Self-hosted LLM | Compliance quality requires frontier models |
| LangChain (full) | Use individual utilities only; the framework adds complexity without proportional benefit |
| ReportLab | Python PDF DSL; harder to produce beautiful layouts than HTML/CSS + Puppeteer |

---

## Key npm Packages

```bash
# Core
next react react-dom typescript

# Styling
tailwindcss @tailwindcss/typography
shadcn-ui     # via `bunx shadcn@latest add <component>`

# Database
drizzle-orm @neondatabase/serverless
drizzle-kit   # dev dependency — migrations CLI

# Auth
better-auth

# AI
ai                   # Vercel AI SDK core
@ai-sdk/anthropic    # Claude provider
@ai-sdk/openai       # OpenAI provider (embeddings)

# Storage
@aws-sdk/client-s3 @aws-sdk/s3-request-presigner

# Charts
recharts @tremor/react

# State
zustand

# Email
resend react-email @react-email/components

# Payments
stripe @stripe/stripe-js

# Caching / Rate limiting
@upstash/redis @upstash/ratelimit

# Monitoring
@sentry/nextjs

# Validation (used everywhere with AI SDK)
zod
```

---

## Development Environment

```bash
# Prerequisites
node >= 20.x
python >= 3.11
bun (preferred package manager)

# .env.local
DATABASE_URL=                    # Neon pooled connection string
DATABASE_URL_UNPOOLED=           # Neon direct connection (migrations only)
BETTER_AUTH_SECRET=
BETTER_AUTH_URL=http://localhost:3000
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
CF_ACCOUNT_ID=
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
ANTHROPIC_API_KEY=
OPENAI_API_KEY=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
RESEND_API_KEY=
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=
```

## Local Development Setup

```bash
# 1. Clone and install
git clone <repo> && cd bz-intelligence
bun install

# 2. Push schema to your Neon dev branch
bun db:push

# 3. Run the app
bun dev

# 4. (Optional) Inspect your DB visually
bun db:studio

# 5. (Optional) Run the data pipeline locally
cd pipeline && pip install -r requirements.txt
python -m celery worker -A tasks --loglevel=info
```

## Scripts (package.json)

```json
{
  "scripts": {
    "dev": "next dev --turbo",
    "build": "next build",
    "db:generate": "drizzle-kit generate",
    "db:push": "drizzle-kit push",
    "db:studio": "drizzle-kit studio",
    "db:migrate": "drizzle-kit migrate"
  }
}
```
