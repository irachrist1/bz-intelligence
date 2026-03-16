# Codex Task Specs

These tasks are designed to run in parallel with Claude Code's work. Each spec is self-contained.
Read `docs/tasks.md` for overall sprint context. Check status there before starting a task.

---

## E1 — RPPA Tender Scraper

**File:** `scripts/scrape-rppa.ts`
**Command:** `npm run scrape:rppa`
**Size:** L

### What to build

A standalone TypeScript script that fetches open tenders from RPPA (Rwanda Public Procurement Authority) and writes them to the `tenders` table with `reviewStatus = 'pending'`. Runnable manually for now — no scheduling.

### Stack constraints

- Use `tsx` to run (already in devDependencies)
- Database: Drizzle ORM via `@/lib/db`. Schema: `tenders` table in `lib/db/schema/public.ts`
- Load env from `.env.local` using `process.loadEnvFile(resolve(process.cwd(), '.env.local'))`
- Do NOT use puppeteer or playwright — use `fetch` + HTML parsing (`node-html-parser` or `cheerio`, add as devDependency if needed)
- Target URL: `https://www.rppa.gov.rw/public-procurement-opportunities` (or the active tenders page — verify the actual URL structure by fetching it first)

### Inputs

None. Reads from RPPA website directly.

### Expected output

For each new tender found on RPPA:
- Upsert into `tenders` table using `sourceId` (RPPA reference number) as the dedup key
- Set `source = 'rppa'`, `reviewStatus = 'pending'`, `status = 'open'`, `country = 'rw'`
- Extract: `title`, `issuingOrg`, `sourceUrl` (link to full tender page), `deadlineSubmission`, `datePosted`, `estimatedValueRwf` (if available), `tenderType`, `categoryTags`
- Log to stdout: how many tenders found, how many were new inserts vs already-existing skips

### Acceptance criteria

1. `npm run scrape:rppa` runs without crashing
2. At least 5 tenders written to the DB in a single run against the live RPPA site
3. Re-running does not create duplicates (upsert on `source + sourceId`)
4. Each inserted tender has a valid `sourceUrl` pointing to the original RPPA page
5. Script exits with code 0 on success, code 1 on unrecoverable error

### Files to create/touch

- `scripts/scrape-rppa.ts` — new file
- `package.json` — add `"scrape:rppa": "tsx scripts/scrape-rppa.ts"` to scripts

### Implementation notes

- RPPA's site may paginate. Handle at least 3 pages of results.
- If the site returns non-200, log the error and exit with code 1 (don't silently skip).
- `deadlineSubmission` dates on RPPA are typically in `DD/MM/YYYY` format — parse carefully.
- If estimated value is in RWF, store in `estimatedValueRwf`. Leave `estimatedValueUsd` null.
- Keep the script idempotent: safe to run daily via cron later.

---

## E2 — Tender Seed Script

**File:** `scripts/seed-tenders.ts`
**Command:** `npm run seed:tenders`
**Size:** M

### What to build

A one-time seed script that inserts 20+ real, currently open RPPA tenders into the database so the feed is not empty on first load. Tenders should be real — look them up on `rppa.gov.rw` or use data from the E1 scraper run. All tenders should be inserted with `reviewStatus = 'approved'` so they appear in the feed immediately without needing admin action.

### Stack constraints

- Same as E1: `tsx`, Drizzle, `.env.local`
- Insert directly, skip `reviewStatus = 'pending'` step since this is trusted seed data

### Expected output

Inserts 20+ tender rows into the `tenders` table. Each row must have:
- `title` — real tender title from RPPA
- `issuingOrg` — the procuring entity (ministry, agency)
- `source = 'rppa'`
- `sourceUrl` — direct link to the RPPA tender page
- `reviewStatus = 'approved'`
- `status = 'open'`
- `country = 'rw'`
- `deadlineSubmission` — real deadline (must be in the future relative to when you write this script — use 2026 dates)
- `categoryTags` — 1–3 tags per tender (e.g. `['consulting', 'legal']`)
- At least half the tenders should be relevant to: legal services, management consulting, IT consulting, audit, training, or advisory services

### Acceptance criteria

1. `npm run seed:tenders` inserts exactly 20+ rows on a fresh DB (or skips existing rows gracefully on re-run using upsert)
2. All tenders have `reviewStatus = 'approved'` and `status = 'open'`
3. All `deadlineSubmission` dates are in 2026 or later
4. After running, visiting `/dashboard/tenders` shows the seeded tenders in the feed
5. Script exits with code 0 on success

### Files to create/touch

- `scripts/seed-tenders.ts` — new file
- `package.json` — add `"seed:tenders": "tsx scripts/seed-tenders.ts"` to scripts

### Implementation notes

Use real tenders. Do not invent data. If pulling from RPPA directly is too slow, use the output of the E1 scraper run as source data. The key thing is that the tenders are real procurement opportunities so the AI fit score produces meaningful results.

---

## E3 — Pipeline Tracker UI Polish

**Size:** M

### What to build

The pipeline board at `/dashboard/pipeline` currently renders a read-only kanban view grouped by stage. It links to individual tender detail pages where users change stages. The problem: users can't move cards between columns directly from the pipeline view — they have to click into each tender and use the stage dropdown there.

Add inline stage-change capability to the pipeline board so users can move a card to the next logical stage without leaving the pipeline.

### Files to touch

- `app/(dashboard)/dashboard/pipeline/page.tsx` — add a stage-move button to each card
- `components/tenders/pipeline-card.tsx` — NEW: extract the card into its own client component with move actions
- `app/api/tenders/save/route.ts` — already handles `update_stage` action, no changes needed

### Expected inputs / outputs

**Input:** A rendered pipeline board with tender cards grouped by stage column.

**Output:** Each card in the pipeline has a "Move to next stage" button (or a compact stage selector). Clicking it calls `POST /api/tenders/save` with `action: 'update_stage'` and the next stage value. The board updates optimistically (move the card to the new column without a full page reload).

Stage order: `watching → go → in_prep → submitted → won / lost`

Note: `won` and `lost` are terminal — no "next stage" button from there. `no_go` is also terminal.

### Acceptance criteria

1. From the pipeline page, a user can move a card from `watching` → `go` without navigating away
2. The card visually moves to the correct column immediately after clicking (optimistic update)
3. If the API call fails, the card returns to its original column and a toast error shows
4. Each card shows the tender title, issuing org, and deadline (already in the page)
5. No changes to `/api/tenders/save` are required — it already works

### Implementation notes

- Extract cards into `components/tenders/pipeline-card.tsx` as a `'use client'` component
- Use `useOptimistic` (React 19) or local state + router.refresh() for the optimistic update
- Keep the button minimal: for cards not in terminal stages, show a small "→ Next stage" button below the tender info
- The pipeline page becomes a server component that fetches data; each card is a client component
- Match existing dark mode styling: `dark:bg-zinc-900`, `dark:border-zinc-800`

---

## E4 — Weekly Digest Email

**Size:** M

### Context

The weekly digest cron route (`app/api/cron/weekly-digest/route.ts`) and email template (`lib/email.ts → sendWeeklyDigestEmail`) are already fully built. The Vercel cron is configured in `vercel.json` to run every Monday at 04:00 UTC.

The gap: users have no way to opt into or preview the weekly digest from within the app, and there is no way to manually trigger it in development to verify it works end-to-end.

### What to build

**Part 1: Verify existing digest pipeline end-to-end**

Read `app/api/cron/weekly-digest/route.ts` and `lib/email.ts` carefully. Identify any bugs or missing pieces (e.g. the weekly digest skips users without firm profiles — is that intentional? Does it handle the case where `alertPreferences` row doesn't exist for a user yet?). Fix any bugs found.

**Part 2: Add a manual test trigger**

Add a button to `/dashboard/alerts` labelled "Send me a test digest". Clicking it calls a new route `POST /api/cron/weekly-digest/preview` that:
- Only sends to the currently authenticated user (not all subscribers)
- Uses the same matching and email logic as the real digest
- Returns `{ok: true, sent: number}` (sent=0 means no tenders matched)
- Requires auth — not a cron endpoint (no CRON_SECRET check)

**Part 3: Verify the alerts page shows digest opt-in**

The alerts preferences form at `/dashboard/alerts/page.tsx` already has a `weeklyDigest` boolean toggle. Verify it saves correctly via `POST /api/alerts` and that the `weekly-digest` cron respects it.

### Files to touch

- `app/api/cron/weekly-digest/route.ts` — review + fix any bugs
- `app/api/cron/weekly-digest/preview/route.ts` — NEW: manual single-user trigger
- `app/(dashboard)/dashboard/alerts/page.tsx` — add "Send test digest" button
- `lib/email.ts` — read-only reference, do not modify unless fixing a bug

### Acceptance criteria

1. A user with `weeklyDigest = true` and at least one matching tender receives a correctly formatted email when the cron fires
2. A user with `weeklyDigest = false` does NOT receive the digest
3. `POST /api/cron/weekly-digest/preview` (authenticated) sends a test email to the current user and returns `{ok: true, sent: 1}` if tenders were matched
4. The "Send test digest" button on `/dashboard/alerts` calls the preview endpoint and shows a success/empty toast
5. No changes break the existing alerts preferences save flow

### Implementation notes

- The weekly digest currently skips users without a firm profile (sends all recent tenders instead). This is acceptable for MVP — do not change this behavior.
- The preview endpoint should reuse the matching logic from `lib/alerts/match.ts` (`profileMatchesTender`) — do not duplicate it.
- If `RESEND_API_KEY` is not set, both endpoints should return `{ok: true, sent: 0, reason: 'email_not_configured'}` without error.
