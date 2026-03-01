# BZ Intelligence — Current Status

> Last updated: March 2026
> Written for: any engineer picking up this codebase
> Assumption: nothing is production-ready yet. This documents what exists, what works, and what doesn't.

---

## TL;DR

The infrastructure is scaffolded. The app boots, auth works, onboarding works, and the compliance roadmap renders. The AI chat is wired but broken due to an invalid API key. The UI is functional — theme system works (system default + manual toggle in sidebar), chat renders markdown, rate limiting is integrated. This is a solid foundation ready for API key configuration and knowledge base seeding.

---

## What Actually Works Right Now

| Feature | Status | Notes |
|---------|--------|-------|
| Sign up (email/password) | ✅ Works | Tested, 200 response |
| Sign in | ✅ Works | Session persists, now respects callbackUrl |
| Onboarding questionnaire | ✅ Works | Saves business profile to DB, routes to correct mode |
| Compliance roadmap page | ✅ Loads | Renders seeded steps, not yet personalized intelligently |
| Compliance roadmap API | ✅ Works | Filters steps by sector and biz type from profile |
| Step status updates (mark complete) | ✅ Works | Persisted to compliance_history table |
| Compliance chat page | ✅ Redesigned | Blue "Compliance Advisor" identity, profile banner, citation cards, copy button, feedback; AI calls fail (invalid API key) |
| Intelligence directory page | ✅ Loads | Empty (no company data seeded) |
| Intelligence chat page | ✅ Redesigned | Amber "Market Analyst" identity, sector filter panel; AI calls fail (invalid API key) |
| Newsfeed page | ✅ Enhanced | Filter bar, read/unread state, article cards link to detail view |
| Newsfeed article detail | ✅ Built | Full article view with impact stripe, source link, auto-mark-as-read |
| Newsfeed read tracking | ⚠️ Schema ready | `newsReads` table defined; needs `npm run db:push` to activate |
| Documents page | ✅ Loads | Stub UI only — Phase 3 feature |
| Route protection (auth proxy) | ✅ Works | Unauthenticated users redirected to /sign-in with callbackUrl |
| Database (Neon) | ✅ Live | All tables created, 8 reg bodies + 9 compliance steps seeded |
| pgvector extension | ✅ Enabled | knowledge_embeddings table exists, 1024 dimensions, empty |
| Dark mode / theme toggle | ✅ Works | System default, persisted, toggle in sidebar |
| AI rate limiting | ✅ Works | 20 req/hour per user via Upstash |

---

## What Is Broken or Incomplete

### 1. AI Chat — Blocked by API Key
**Error:** `AI_APICallError: invalid x-api-key (401)`

The `ANTHROPIC_API_KEY` in `.env.local` is a Claude Code OAuth token (`sk-ant-oat01-...`). This format is for the Claude Code CLI only — the Anthropic REST API rejects it.

**Fix required:** Get a real API key from [console.anthropic.com](https://console.anthropic.com). This requires a separate account and billing from your claude.ai subscription. They are entirely separate systems.

**Impact:** Both compliance chat and intelligence chat return an error. The RAG pipeline (Voyage AI embeddings + pgvector search) is implemented but untested because the final LLM call fails.

---

### 2. Onboarding — ✅ Rebuilt (10 questions, conditional branching)
Now captures all key compliance trigger flags:
- Legal structure, sector, journey stage
- Who are customers (B2B/B2C/B2G)
- **Handles money?** (yes → BNR licensing required)
- **Financial service type** (payments / lending / savings / insurance)
- **Foreign shareholders?** (yes → extra RDB/BNR disclosure)
- **Collects personal data?** (yes → RISA registration required)
- Employee range (solo / 2-10 / 11-50 / 50+ → PAYE/RSSB thresholds)
- Operates outside Kigali? (yes → local permits)
- Biggest compliance question (seeds first AI conversation)

These flags are stored in `business_profiles` and used to filter the compliance roadmap — e.g., BNR steps only appear if `handles_money = true`, RISA step appears if `collects_data = true`.

Schema was extended with `handles_money`, `collects_data`, `operates_province`, `employee_range` boolean/text columns. Migration applied to live Neon DB.

---

### 3. Theme — ✅ Fixed
`next-themes` `ThemeProvider` added to root layout. Respects system preference on first load (`defaultTheme="system"`). Manual toggle (Moon/Sun) in the sidebar footer. Persisted in localStorage.

---

### 4. Google OAuth — ✅ Fixed
Google OAuth button removed from sign-in page. Google provider was already absent from `lib/auth/index.ts`. No more warnings or runtime errors.

---

### 5. Knowledge Base — ✅ Seeded (25 chunks, 8 documents)
The `knowledge_embeddings` table contains 25 embedded chunks from 8 foundational Rwanda regulatory documents:
- RDB Company Registration Guide
- RRA Tax Registration Guide (TIN, VAT, PAYE)
- RSSB Employer Registration Guide
- BNR PSP Licensing Framework
- BNR Digital Lending / MFI Framework
- RISA Data Protection Law
- RURA ICT Licensing Guide
- Rwanda Labour Law Summary

The AI, once given a valid Anthropic API key, will answer from this verified knowledge base with citations.

---

### 6. Company Directory — Empty
The `companies` table has zero records. The intelligence directory renders an empty state.

---

### 7. File Uploads — Not Implemented
The documents page is a UI stub. There is no file upload logic, no Cloudflare R2 connection, and no document processing pipeline. R2 buckets have not been created.

**Decision:** Skipped for MVP. Document vault is a Phase 3 feature.

---

### 8. Rate Limiting — ✅ Fixed
`@upstash/ratelimit` integrated in `/api/ai/chat/route.ts`. 20 requests per user per hour (sliding window). Returns 429 with headers if exceeded. Gracefully skips if Redis env vars are not set.

---

### 9. No Error Monitoring
Sentry is not installed. Errors are visible in the terminal during development but will be silent in production.

---

### 10. middleware.ts Warning
The dev server shows: `The "middleware" file convention is deprecated. Please use "proxy" instead.`

The file has been renamed to `proxy.ts` with the correct `proxy` function export. This warning should not appear after a clean server restart. If it persists, verify `middleware.ts` no longer exists.

---

## Database State (March 2026)

**Neon project:** `bz-intelligence` (ID: `cool-dream-92936928`)
**Region:** `us-west-2`

| Table | Records | Notes |
|-------|---------|-------|
| user | 1+ | Created during testing |
| session | 1+ | Active test sessions |
| account | 0 | No OAuth accounts yet |
| verification | 0 | Email verification not yet required |
| organization | 1+ | Created on first sign-up |
| member | 1+ | |
| invitation | 0 | |
| regulatory_bodies | 8 | RDB, RRA, BNR, RURA, RSB, PSF, RSSB, RISA |
| compliance_steps | 9 | Basic steps seeded |
| business_profiles | 1+ | From onboarding test |
| compliance_history | 0+ | Depends on test activity |
| knowledge_embeddings | 25 | 8 documents ingested — RDB, RRA, RSSB, BNR (PSP+MFI), RISA, RURA, Labour Law |
| companies | 0 | Empty |
| news_items | 0 | Empty |
| org_documents | 0 | Document vault not implemented |

---

## Environment Variables — Current State

```
DATABASE_URL            ✅ Neon pooled connection
DATABASE_URL_UNPOOLED   ✅ Neon direct connection
BETTER_AUTH_SECRET      ✅ Set
BETTER_AUTH_URL         ✅ http://localhost:3000
ANTHROPIC_API_KEY       ❌ Invalid (Claude Code OAuth token — needs real API key)
VOYAGE_API_KEY          ✅ Set (Voyage AI, 200M free tokens)
RESEND_API_KEY          ✅ Set
UPSTASH_REDIS_REST_URL  ✅ Set
UPSTASH_REDIS_REST_TOKEN ✅ Set
GOOGLE_CLIENT_ID        ❌ Not set
GOOGLE_CLIENT_SECRET    ❌ Not set
STRIPE_SECRET_KEY       ❌ Not set (not needed for MVP)
R2 credentials          ❌ Not set (not needed for MVP)
```

---

## Actual Tech Stack in Use (vs. What Was Planned)

| Layer | Planned | Actual | Why Different |
|-------|---------|--------|---------------|
| Next.js version | 14 | 16.1.6 | `create-next-app` installed latest |
| Embeddings | OpenAI text-embedding-3-small | Voyage AI voyage-3 (1024 dims) | No OpenAI key; Voyage has 200M free tokens |
| React | 18 | 19 | Shipped with Next.js 16 |
| Charts | Recharts + Tremor | Recharts only | Tremor incompatible with React 19 |
| State management | Zustand | None installed yet | Not needed for current features |
| AI SDK | v3 | v6 | Latest version — breaking changes from prior docs |
| Proxy/middleware | middleware.ts | proxy.ts | Next.js 16 renamed it |

---

## Key Technical Decisions Made During Build

### Why lazy proxy for the database?
```typescript
export const db = new Proxy({} as ReturnType<typeof createDb>, {
  get(_target, prop) {
    if (!_db) _db = createDb()
    return ...
  }
})
```
Neon's serverless driver crashes if imported without `DATABASE_URL` set — which happens at build time on Vercel. The proxy delays initialization until the first actual database call at runtime, when the env var is available.

### Why the Better Auth schema is in our schema file?
Better Auth's Drizzle adapter looks up model names (`user`, `session`, `account`, etc.) in the schema object you pass to it. We had to manually write these table definitions in `lib/db/schema/auth.ts` because the Better Auth CLI binary was not present. These tables are the ones Better Auth creates and manages — do not modify their column names without checking Better Auth's source.

### Why Voyage AI instead of OpenAI for embeddings?
Voyage AI offers 200M free tokens with no credit card required. OpenAI requires billing setup. For an early-stage project with an empty knowledge base, the provider doesn't matter — switch to any embedding model later as long as you re-embed all documents with the new model (they use 1024 dimensions; if you switch to a different model, you may need to alter the `knowledge_embeddings.embedding` column and re-run all embeddings).

### Why not Convex?
Convex has a different vector search system that doesn't use pgvector. Our RAG architecture is built specifically on Postgres + pgvector — the same database handles relational BI data and vector embeddings. Splitting this across two databases adds operational complexity with no benefit at current scale.

### Why not Supabase?
Explicitly rejected by the project owner. Reasons: slow dashboard, unpredictable billing (realtime connections, edge function invocations, and storage egress all billed separately), and excessive vendor lock-in across auth, storage, and database simultaneously.

---

## The "If Done Perfectly" Answer

This section answers the question the project owner raised: *"If this were done in a perfect way, what would that look like?"*

### Onboarding
Not a form — a **conversation**. The user chats with the AI, which asks follow-up questions intelligently based on answers. "You mentioned fintech — are you doing lending, payments, or something else? Do you have foreign investors? Are you targeting retail consumers or businesses?" The AI builds the business profile from the conversation and shows a summary at the end for confirmation. No dropdowns, no radio buttons.

**10 quality questions (minimum bar for good personalization):**
1. Tell me about your business — what does it do? *(free text, AI extracts sector)*
2. What legal structure are you or do you plan to be? *(Ltd, Sole Proprietorship, NGO, Branch of foreign company)*
3. Where are you in your journey? *(Idea, pre-registration, registered and operating, expanding)*
4. Who pays you? *(Individual consumers, businesses, government, or a mix)*
5. Will your business touch money in any way? *(payments, lending, savings, insurance — triggers BNR requirements)*
6. Do you have or plan to have foreign investors or directors? *(triggers additional RDB and BNR requirements)*
7. Will you collect or process personal data? *(triggers data protection requirements)*
8. How many employees do you have or plan to hire in year one? *(triggers RSSB, labor law)*
9. Where will you operate — Kigali only, or provincial? *(affects local government permits)*
10. What's your single biggest compliance question right now? *(seeds first AI conversation)*

### AI Chat
Not just a chatbot — an **advisor with memory**. It remembers previous conversations. It proactively surfaces new regulatory changes relevant to the user's sector. It can draft compliance letters. It can flag when the user's described business model creates a regulatory conflict they may not have considered.

### Theme
Instant, seamless. Respects the system setting on first load. Smooth transition (not a flash). Toggle is always accessible from the top-right corner of every page. Persisted in localStorage so it survives page reloads.

### Compliance Roadmap
Not just a list — a **Gantt-style timeline** with dependencies visible. Steps that can run in parallel shown side by side. Deadline tracking with reminders. Each step has a checklist of exactly what to bring / submit. When a step is completed, the AI generates a "what's next" nudge.

### Intelligence Hub
A professional-grade research tool. Think Bloomberg for Rwanda's startup ecosystem. Sector dashboards with live data. The ability to build a shortlist of companies and compare them side by side. Saved searches. Export to PDF or Excel. An AI analyst you can talk to in the same way you'd brief a research assistant.

### Data Quality
Everything in the knowledge base has a "last verified" badge. When it goes stale (>90 days without re-verification), it's flagged and downranked in search results. A quarterly legal review ensures the compliance guidance meets a professional standard. Users can flag inaccuracies, which triggers a human review before the record is corrected.

---

## Immediate Next Steps (Prioritized)

1. **Fix Anthropic API key** — get a real key from console.anthropic.com. The key must start with `sk-ant-api03-`. The current key in `.env.local` (`sk-ant-oat01-...`) is a Claude Code CLI OAuth token — rejected by the Anthropic REST API. This is the only remaining hard blocker for AI functionality. *(Must be done manually)*
2. **Run `npm run db:push`** — the `newsReads` table was added to the schema this session. Push it to Neon to activate read-tracking on the newsfeed.
3. **Add Sentry DSN** — Sentry is installed. Add `NEXT_PUBLIC_SENTRY_DSN=` to `.env.local`. *(Must be done manually)*
4. **Seed new compliance steps** — 2 new foreign ownership steps were added to `lib/db/seed/compliance-steps.ts`. Run `npm run db:seed`.
5. **Add `EMAIL_FROM` env var** — configure a verified Resend domain for welcome emails.
6. **Expand knowledge base** — more sector-specific documents (agritech, health sector licensing, etc.)

### ✅ Completed (session 4 — AI chat UI overhaul + newsfeed + dark mode)

#### AI Chat — visual and functional differentiation (VAULT_STRATEGY.md §4)
- **Compliance Chat** fully redesigned:
  - Blue color identity throughout (header, avatar, thinking dots, send button, citations)
  - Renamed to "Compliance Advisor" with shield icon
  - Profile context banner — fetches business profile from `/api/profile` and shows sector/biz-type/BNR/RISA context badges
  - Citation cards — AI responses ending with a SOURCES section now render sources as styled cards with blue framing, not raw text
  - Copy-to-clipboard button on every AI message (with green check confirmation)
  - Improved disclaimer copy and dark-mode-aware styles throughout
- **Market Analyst Chat** fully redesigned:
  - Amber/orange color identity throughout (header, avatar, thinking dots, send button)
  - Renamed to "Market Analyst" with BarChart2 icon
  - Left sector filter panel — 6 sector buttons (All / Fintech / Agritech / ICT / Healthtech / Logistics)
  - Sector selection updates example questions dynamically and prepends research context to messages
  - Placeholder and framing reflect market research purpose, not compliance
  - No compliance disclaimer in footer (appropriate for market data, not legal guidance)
- New `/api/profile` route — returns business profile for the current user without loading full roadmap
- Both chats: copy-to-clipboard button, improved thinking indicator dots in brand colors

#### Newsfeed (NEWSFEED_DESIGN.md)
- **Article detail view** — new route `/dashboard/compliance/newsfeed/[id]` renders full article with:
  - Impact stripe (red for high, amber for medium)
  - Sector tags, reg body badge, date, source attribution
  - Separate "plain language summary" vs "original summary" sections
  - External source link
  - `MarkReadButton` client component
- **Read tracking** — `newsReads` table added to `lib/db/schema/private.ts`
  - `POST /api/newsfeed/read` — marks article read (idempotent, graceful fail if table missing)
  - `GET /api/newsfeed/read` — returns all read article IDs for current user
  - ⚠️ **Requires `npm run db:push` to create the table in Neon**
- **Newsfeed list page** updated:
  - News cards now link to article detail view
  - Unread dot indicator (blue filled circle) on unread items
  - Read articles show at 70% opacity
  - "X unread" count shown in header when items exist
  - Auto-marks article as read when the detail page is opened
  - Graceful degradation if `newsReads` table doesn't exist yet

#### Dark mode fixes
- Sidebar: was missing dark mode for background, borders, text, mode switcher, nav active states
- Dashboard layout: missing `dark:bg-zinc-950`
- Compliance roadmap page: step cards, expanded detail, headers all now dark-mode-aware

#### Intentionally skipped this session
- Document vault implementation — VAULT_STRATEGY.md verdict: build only after Phase 1 compliance AI is validated. R2 credentials not set.
- RSS/scraping cron pipeline — requires external infrastructure (Railway/Vercel cron). NEWSFEED_DESIGN.md §1 data sources are documented but ingestion is not built.
- Company directory search — no company data exists; building search UI with no data is premature.
- AI chat conversation persistence — `chatSessions`/`chatMessages` schema exists but wiring it to the UI requires significant work; no session is blocking on this.
- Newsfeed "Read" tab / archived-reads view — schema is in place; build when there's actual data.

### ✅ Completed (session 1 — bug fixes)
- Theme system — `ThemeProvider`, system default, manual toggle in sidebar
- Google OAuth button removed — was calling unconfigured provider
- Sign-in callbackUrl — now reads `?callbackUrl=` param set by proxy instead of hardcoding `/dashboard`
- Onboarding mode routing — step 0 mode selection now correctly routes to compliance vs intelligence dashboard
- Markdown rendering — AI chat responses now render markdown (headers, lists, bold, code blocks)
- Rate limiting — 20 req/hour per user via Upstash, graceful skip if not configured
- Dead redirect fixed — `requireOrg()` redirected to non-existent `/onboarding/org`

### ✅ Completed (session 3 — Sentry, Phase 1.2 + 1.7)
- Sentry installed (`@sentry/nextjs@10.40.0`) — org: `ct-mi`, project: `javascript-nextjs`
  - `sentry.client.config.ts`, `sentry.server.config.ts`, `sentry.edge.config.ts` created
  - `next.config.ts` wrapped with `withSentryConfig`
  - Set `NEXT_PUBLIC_SENTRY_DSN` in `.env.local` (copy DSN from Sentry dashboard → Project Settings → Client Keys)
- Foreign ownership compliance steps added to seed file (2 new steps: RDB + BNR)
  - `npm run db:seed` must be run to push these to the live DB
- Roadmap API now filters foreign ownership steps by `profile.foreignOwnership` flag
- Query gap tracking: when RAG returns no results, logs `[KB_GAP]` with query + userId to server console
- AI response feedback widget: 👍/👎 on each assistant message in compliance chat
  - POST to `/api/ai/feedback` (logs `[AI_FEEDBACK]` to server console, fire-and-forget)

### ✅ Completed (session 2 — implementing what's next)
- Schema extended — `handles_money`, `collects_data`, `operates_province`, `employee_range` added to `business_profiles`, pushed to live Neon DB
- Onboarding rebuilt — 6-step flow with 10 quality questions and conditional branching (fintech sub-type, compliance triggers)
- Roadmap API smarter — BNR steps now gated by `handles_money` flag; RISA step gated by `collects_data`; PAYE/RSSB skip for solo founders
- System prompt updated — passes all profile flags to AI so compliance advice is contextually accurate
- `drizzle.config.ts` fixed — now reads `.env.local` so `npm run db:push` works without manually exporting env vars
- Knowledge base seeded — 8 documents, 25 chunks embedded via Voyage AI, live in Neon pgvector
  - Covers: RDB registration, RRA taxes, RSSB employment, BNR PSP, BNR MFI, RISA data protection, RURA ICT, Rwanda labour law
- Ingestion script written at `scripts/ingest-document.ts` + `scripts/knowledge-base-seed.ts`
  - `npm run kb:ingest` — add new documents
  - `npm run kb:clear` — re-embed from scratch
- Welcome email wired — sends on first onboarding completion via Resend (graceful fail if not configured)
