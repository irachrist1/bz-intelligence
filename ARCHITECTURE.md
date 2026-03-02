# BZ Intelligence — Technical Architecture

---

## System Overview

BZ Intelligence is a multi-tenant SaaS platform with two distinct query modes (Intelligence and Compliance) operating against a shared, curated knowledge base. The architectural foundation is built around four principles:

1. **Grounded AI**: The LLM never speaks from its training data alone — it always retrieves from our verified knowledge base first
2. **Data isolation**: Public knowledge base data and private user data (documents, profiles) are strictly separated
3. **Citation-first responses**: Every AI-generated answer includes verifiable source references
4. **Progressive personalization**: The more context the user provides, the more tailored the output

---

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        FRONTEND                             │
│           Next.js 14 (App Router) + TypeScript              │
│           Tailwind CSS + shadcn/ui + Recharts               │
└──────────────────────┬──────────────────────────────────────┘
                       │ HTTPS / WebSocket
┌──────────────────────▼──────────────────────────────────────┐
│                     API LAYER                               │
│              Next.js API Routes + Route Handlers            │
│         Better Auth middleware (session + org check)        │
│                  Vercel AI SDK (streaming)                  │
└────────┬─────────────────────────────┬───────────────────────
         │                             │
┌────────▼────────┐          ┌─────────▼──────────────────────┐
│  RAG PIPELINE   │          │      BUSINESS LOGIC LAYER      │
│                 │          │                                │
│ 1. Query embed  │          │  - Compliance roadmap engine   │
│ 2. Vector search│          │  - Benchmarking algorithm      │
│ 3. Context pack │          │  - Report generator            │
│ 4. LLM call     │          │  - Newsfeed curator            │
│ 5. Citation map │          │  - Health score calculator     │
└────────┬────────┘          └─────────┬──────────────────────┘
         │                             │
┌────────▼─────────────────────────────▼───────────────────────┐
│               NEON (Serverless PostgreSQL)                   │
│  ┌──────────────────┐  ┌──────────────────┐                  │
│  │   PUBLIC DATA    │  │   PRIVATE DATA   │                  │
│  │                  │  │  (org-scoped,    │                  │
│  │  companies       │  │   app-enforced)  │                  │
│  │  regulations     │  │                  │                  │
│  │  sectors         │  │  user_profiles   │                  │
│  │  regulatory_     │  │  org_documents   │                  │
│  │    bodies        │  │  compliance_     │                  │
│  │  news_items      │  │    history       │                  │
│  │  knowledge_      │  │  business_       │                  │
│  │    embeddings    │  │    profiles      │                  │
│  │  (pgvector)      │  │  audit_logs      │                  │
│  └──────────────────┘  └──────────────────┘                  │
└──────────────────────────────────────────────────────────────┘
         │                             │
         │               ┌────────────▼────────────────────────┐
         │               │        CLOUDFLARE R2                │
         │               │  user-documents/ (private, signed)  │
         │               │  report-exports/ (private, signed)  │
         │               │  company-assets/ (public CDN)       │
         │               └─────────────────────────────────────┘
┌────────▼────────────────────────────────────────────────────┐
│                  DATA PIPELINE (Railway)                    │
│                  Python + Celery + asyncpg                  │
│                                                             │
│  RDB scraper → NLP processor → Embedder → Neon ingest       │
│  PDF extractor → Chunker → Embedder → Neon ingest           │
│  News fetcher → Classifier → Curator → Neon ingest          │
└─────────────────────────────────────────────────────────────┘
```

---

## RAG Architecture (Core AI Layer)

Retrieval-Augmented Generation is the technical mechanism that prevents AI hallucination. The LLM is never allowed to answer from general knowledge alone — it must retrieve relevant context from our verified knowledge base first.

### Query Flow (Step by Step)

```
User Query: "What licenses does a digital lending startup need in Rwanda?"
     │
     ▼
[1] INTENT CLASSIFICATION
    - Is this an Intelligence Mode query or Compliance Mode query?
    - What entities are mentioned? (sector: fintech/digital lending, entity: Rwanda)
    - Personalization needed? (check if user has a Business Profile)
     │
     ▼
[2] QUERY EMBEDDING
    - Convert the query to a vector using text-embedding-3-small (OpenAI)
    - or voyage-3 (Voyage AI — better for multilingual/specialized domains)
     │
     ▼
[3] VECTOR SIMILARITY SEARCH (pgvector in Supabase)
    - Search the knowledge_embeddings table for the top-K (k=10-20) most similar chunks
    - Filter by metadata: sector tags, document type, regulatory body, recency
    - Return: chunk text + source metadata (document title, URL, date, regulatory body)
     │
     ▼
[4] CONTEXT PACKAGING
    - Combine retrieved chunks into a structured context block
    - If Compliance Mode: inject user's Business Profile into context
    - If user has uploaded documents relevant to the query: inject those too
    - Ensure context fits within token limit (using LangChain token trimming or manual)
     │
     ▼
[5] LLM CALL (Claude API — claude-sonnet-4-6)
    System Prompt:
      "You are BZ Intelligence, a business intelligence assistant for Rwanda.
       You ONLY answer based on the provided context documents.
       If the answer is not in the provided context, say exactly:
       'I don't have verified information about this. You may want to
        consult [relevant regulatory body].'
       Always end your response with a SOURCES section citing the
       documents you used, in the format: [Source Name, Date, URL]"
     │
     ▼
[6] CITATION EXTRACTION & MAPPING
    - Parse the LLM output to extract SOURCE references
    - Map source references back to the original knowledge base entries
    - Attach full metadata (document title, regulatory body, date, link)
     │
     ▼
[7] RESPONSE TO USER
    - Streamed response (Vercel AI SDK streaming)
    - Citation panel rendered alongside answer
    - Confidence indicator (based on number of supporting sources)
    - "Last verified" timestamp on each source
```

### Knowledge Base Structure (Embeddings Table)

```sql
CREATE TABLE knowledge_embeddings (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content     TEXT NOT NULL,              -- The text chunk
  embedding   VECTOR(1536) NOT NULL,      -- pgvector embedding
  source_id   UUID REFERENCES sources(id),

  -- Metadata for filtering before vector search
  sector_tags TEXT[],                     -- ['fintech', 'digital-lending']
  doc_type    TEXT,                       -- 'regulation', 'company_profile', 'sector_report'
  reg_body    TEXT,                       -- 'BNR', 'RDB', 'RRA', 'RURA'
  is_current  BOOLEAN DEFAULT true,       -- false if superseded by newer version
  last_verified_at TIMESTAMPTZ,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX ON knowledge_embeddings USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);
```

---

## Database Schema (Core Tables)

### Public Schema (Shared Knowledge Base)

```sql
-- Company registry
CREATE TABLE companies (
  id              UUID PRIMARY KEY,
  name            TEXT NOT NULL,
  legal_name      TEXT,
  rdb_number      TEXT UNIQUE,           -- Registration number
  tin             TEXT,                  -- Tax ID
  sector          TEXT NOT NULL,
  sub_sector      TEXT[],
  description     TEXT,
  website         TEXT,
  founded_year    INTEGER,
  hq_district     TEXT,
  hq_province     TEXT,
  employee_range  TEXT,                  -- '1-10', '11-50', '51-200', '200+'
  stage           TEXT,                  -- 'startup', 'growth', 'established'
  status          TEXT DEFAULT 'active', -- 'active', 'inactive', 'dissolved'
  licenses        JSONB,                 -- [{body: 'BNR', type: 'PSP', status: 'active', expires: '2025-12-31'}]
  funding         JSONB,                 -- [{round: 'Seed', amount: 500000, currency: 'USD', year: 2022}]
  leadership      JSONB,                 -- [{name: '...', role: 'CEO', linkedin: '...'}]
  last_verified_at TIMESTAMPTZ,
  data_sources    TEXT[],
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Regulatory body definitions
CREATE TABLE regulatory_bodies (
  id          UUID PRIMARY KEY,
  code        TEXT UNIQUE NOT NULL,   -- 'BNR', 'RDB', 'RRA', 'RURA', 'RSB'
  name        TEXT NOT NULL,
  description TEXT,
  website     TEXT,
  sectors     TEXT[]
);

-- Regulations and compliance requirements
CREATE TABLE regulations (
  id              UUID PRIMARY KEY,
  title           TEXT NOT NULL,
  reg_body_code   TEXT REFERENCES regulatory_bodies(code),
  sector_tags     TEXT[],
  applies_to      JSONB,               -- business types, company structures this applies to
  summary         TEXT,
  full_text_url   TEXT,
  published_at    DATE,
  effective_at    DATE,
  status          TEXT,               -- 'active', 'superseded', 'draft'
  supersedes_id   UUID REFERENCES regulations(id),
  last_verified_at TIMESTAMPTZ
);

-- Compliance requirements (atomic steps)
CREATE TABLE compliance_steps (
  id              UUID PRIMARY KEY,
  title           TEXT NOT NULL,
  description     TEXT NOT NULL,
  plain_language  TEXT NOT NULL,      -- jargon-free explanation
  reg_body_code   TEXT REFERENCES regulatory_bodies(code),
  regulation_id   UUID REFERENCES regulations(id),

  -- Conditions: when does this step apply?
  applies_sector  TEXT[],
  applies_biz_type TEXT[],           -- 'ltd', 'sole_prop', 'ngo', 'branch'
  applies_customer TEXT[],           -- 'b2b', 'b2c', 'both'

  -- Step content
  prerequisites   UUID[],            -- IDs of steps that must precede this
  documents_req   JSONB,             -- [{name: '...', description: '...', template_url: '...'}]
  apply_url       TEXT,
  apply_location  TEXT,
  cost_rwf        INTEGER,           -- Approximate cost in RWF
  timeline_days   INTEGER,           -- Expected processing time
  penalty_description TEXT,         -- What happens if you skip this

  step_order      INTEGER,           -- Suggested execution order
  is_optional     BOOLEAN DEFAULT false,
  last_verified_at TIMESTAMPTZ
);
```

### Private Schema (Per-Org, RLS Enforced)

```sql
-- Row Level Security: users only see their org's data
ALTER TABLE business_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users see own org" ON business_profiles
  USING (org_id = auth.jwt()->>'org_id');

CREATE TABLE business_profiles (
  id              UUID PRIMARY KEY,
  org_id          UUID NOT NULL,
  user_id         UUID REFERENCES auth.users(id),

  -- Business DNA
  biz_name        TEXT,
  biz_type        TEXT,              -- 'ltd', 'sole_prop', 'ngo', 'branch'
  sector          TEXT,
  sub_sector      TEXT[],
  customer_type   TEXT,             -- 'b2b', 'b2c', 'b2g', 'all'
  transaction_type TEXT[],          -- for financial services
  revenue_model   TEXT,
  employee_target INTEGER,
  hq_district     TEXT,
  foreign_ownership BOOLEAN,
  current_status  TEXT,             -- 'idea', 'registered', 'operating'
  tin             TEXT,

  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE org_documents (
  id              UUID PRIMARY KEY,
  org_id          UUID NOT NULL,
  filename        TEXT NOT NULL,
  storage_path    TEXT NOT NULL,     -- Supabase Storage path
  doc_category    TEXT,              -- 'incorporation', 'license', 'tax_cert', etc.
  extracted_data  JSONB,             -- Key fields extracted by AI
  compliance_step_id UUID REFERENCES compliance_steps(id), -- Which step this fulfills
  expires_at      DATE,              -- For documents with expiry
  uploaded_at     TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE compliance_history (
  id              UUID PRIMARY KEY,
  org_id          UUID NOT NULL,
  step_id         UUID REFERENCES compliance_steps(id),
  status          TEXT,              -- 'pending', 'in_progress', 'completed', 'skipped'
  completed_at    TIMESTAMPTZ,
  notes           TEXT,
  doc_id          UUID REFERENCES org_documents(id)
);
```

---

## Security Architecture

### Authentication
- Better Auth (email/password + Google OAuth)
- Sessions stored in Neon database (or JWT, configurable)
- Every session includes `userId` and `orgId` claims
- Next.js middleware validates session on every protected route

### Data Isolation (Application-Layer Multi-Tenancy)
Without database-level Row Level Security, we enforce tenant isolation explicitly in the application layer:
- Every Drizzle query on private tables includes `.where(eq(table.orgId, session.orgId))`
- A `withOrgScope(db, orgId)` query builder helper is mandatory for all private data access
- This pattern is enforced via code review and linting rules
- Public knowledge base tables have no orgId — they are always readable by authenticated users

```typescript
// Enforced pattern — developers cannot bypass this
export async function getOrgDocuments(db: DB, orgId: string) {
  return db.select().from(orgDocuments)
    .where(eq(orgDocuments.orgId, orgId))  // always scoped
}
```

### Document Security
- Documents stored in Cloudflare R2 under path `{orgId}/{docId}/{filename}` — org scoping in the key itself
- All R2 access via presigned URLs (1-hour expiry) — no public URLs for user documents
- Documents encrypted at rest (AES-256, R2 server-side encryption)
- Documents in transit: TLS 1.3

### AI Data Handling
- User documents injected into LLM context ephemerally (per-request only)
- No user document content enters the shared vector store or knowledge base
- Prompt injection prevention: user document content sanitized before LLM injection
- All LLM calls logged with user ID, timestamp, and query hash (not full query text) for audit

### API Security
- Rate limiting per tier via Upstash Redis (Free: 10 queries/month, Pro: unlimited)
- All API routes protected by Better Auth session middleware
- No API keys in client-side code

---

## AI Integration Details

### LLM Selection
**Primary**: Claude claude-sonnet-4-6 (`claude-sonnet-4-6`)
- Best reasoning capability for complex compliance questions
- Excellent at following structured output instructions (citations, JSON)
- Responsible AI alignment reduces hallucination risk
- Used for: compliance analysis, market intelligence synthesis, report generation

**Embedding Model**: OpenAI `text-embedding-3-small` or Voyage AI `voyage-3`
- Used for: converting documents and queries to vectors
- 1536 dimensions (OpenAI) or 1024 dimensions (Voyage)
- Voyage AI is preferred if multilingual content (French, Kinyarwanda) becomes significant

### Prompt Architecture

Three system prompt templates, customized per query type:

**Intelligence Mode Prompt:**
```
You are a business intelligence analyst specializing in Rwanda's economy.
You have access to verified data about companies, sectors, and market conditions.
Answer ONLY from the provided context documents.
Format your response with:
1. A direct answer
2. Supporting data points
3. SOURCES: [citations]
If you cannot answer from the context, say: "I don't have verified data on this."
```

**Compliance Mode Prompt:**
```
You are a business compliance specialist for Rwanda.
The user's business profile is: [BUSINESS PROFILE JSON].
Answer their compliance question using ONLY the provided regulatory context.
Always specify WHICH regulatory body the requirement comes from.
Always note the "last verified" date of any regulatory information.
If requirements have changed recently, flag it explicitly.
Format: Direct answer → Step details → SOURCES
```

**Document Analysis Prompt:**
```
You are analyzing a business document uploaded by a user.
Extract: document type, key entities, dates, expiry dates, license numbers.
Identify: which compliance step this document fulfills.
Flag: any issues, missing information, or upcoming expiry dates.
Return structured JSON, not prose.
```

### Streaming Implementation
- Vercel AI SDK `useChat` hook for real-time streaming
- Server-sent events (SSE) for progressive response rendering
- Citation panel updates after full response completes

---

## Data Pipeline Architecture

```
DATA SOURCES
  ├── RDB Company Registry (API + scraping)
  ├── BNR Publications (PDF download pipeline)
  ├── RRA Announcements (web scraping)
  ├── RURA Directives (PDF pipeline)
  ├── Official Gazette (PDF pipeline)
  ├── PSF Reports (PDF pipeline)
  └── Curated web (company profiles, news)
         │
         ▼
INGESTION SERVICE (Python + Celery/Temporal)
  ├── Document fetcher (HTTP client with retry logic)
  ├── PDF extractor (PyMuPDF / pdfplumber)
  ├── HTML parser (BeautifulSoup / Playwright for JS pages)
  └── Deduplication (hash comparison)
         │
         ▼
NLP PROCESSING PIPELINE
  ├── Text chunking (semantic chunking, 512 tokens, 50-token overlap)
  ├── Entity extraction (company names, license types, regulatory refs)
  ├── Sector classification (custom fine-tuned classifier)
  ├── Metadata enrichment (add sector tags, reg body, doc type)
  └── Human review queue (for regulatory documents — required before publish)
         │
         ▼
EMBEDDING PIPELINE
  ├── Batch embedding API calls
  ├── Store in knowledge_embeddings (pgvector)
  └── Update sources table with ingestion metadata
         │
         ▼
SUPABASE (Production data store)
```

### Update Cadence
| Data Type | Update Frequency | Trigger |
|-----------|-----------------|---------|
| Company registry | Weekly | Scheduled job |
| BNR regulations | Per publication | Manual + automated detection |
| RRA announcements | Daily | RSS/scraping monitor |
| Official Gazette | Weekly | Scraping monitor |
| News/market data | Daily | RSS + curated sources |
| Company profiles (market intel) | Monthly | Scheduled job + user flag |

---

## PDF Report Generation

For the "Insight Reports" premium feature:

**Approach**: Puppeteer (headless Chrome) rendering a Next.js route into PDF
- More flexible than ReportLab for rich layout
- Supports charts (rendered as images via canvas)
- Consistent branding via CSS

**Workflow:**
1. User requests PDF report (sector analysis or compliance summary)
2. Backend generates report data (AI synthesis + database query)
3. Renders a dedicated `/report/:id` Next.js page (server-side, no auth required with signed token)
4. Puppeteer renders the page to PDF
5. PDF stored in Cloudflare R2 (private bucket, presigned URL)
6. User receives download link (expires in 1 hour)

---

## Infrastructure

| Component | Service | Rationale |
|-----------|---------|-----------|
| Frontend + API | Vercel | Zero-config deployment, edge functions, streaming support |
| Database | Neon (serverless PostgreSQL) | pgvector, scales to zero, branching, no surprise bills |
| ORM | Drizzle ORM | Type-safe, edge-compatible, Neon serverless driver |
| Authentication | Better Auth | Open-source, free, first-class Drizzle adapter, org support |
| Background jobs | Vercel Cron + Railway | Scheduled data ingestion |
| Data pipeline | Python on Railway | Long-running jobs, Celery queue |
| PDF generation | Puppeteer on Railway | CPU-intensive, isolated |
| File storage | Cloudflare R2 | Zero egress fees, S3-compatible API |
| Monitoring | Sentry (errors) + Vercel Analytics | |
| Email | Resend | Transactional email |
| Payments | Stripe | Subscription management |
| Caching | Upstash Redis | Serverless, pay-per-request |

---

## Scalability Considerations

### Vector Search Performance
- pgvector with IVFFlat index handles millions of embeddings efficiently
- For >10M embeddings, migrate to dedicated vector store (Pinecone or Qdrant)
- Query latency target: <500ms for vector search

### Multi-tenancy
- All private data isolated via RLS — no application-level tenant checks needed
- Supabase connection pooling (PgBouncer) handles concurrent connections

### Rate Limiting
- Vercel Edge Middleware for request-level rate limiting
- Per-user token budget tracking (stored in Supabase)
- Graceful degradation: return cached responses when LLM is under load

### Caching Strategy
- Common intelligence queries cached in Redis (Upstash) with 24-hour TTL
- Sector dashboards cached and rebuilt on data update events
- Compliance roadmaps cached per Business Profile hash
