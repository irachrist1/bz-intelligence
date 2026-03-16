# Task List

Product: BZ Intelligence — Tender workflow for law/consulting firms in Rwanda
Sprint 1 goal: Working product a real firm can evaluate. No scrapers. Manual data, AI fit score, onboarding gate.

**Status:** `todo` | `in-progress` | `done`
**Size:** `S` = <2h | `M` = 2–6h | `L` = 6–12h
**Assigned:** `Claude Code` | `Codex` | `Human`

---

## A — AI Fit Score

The core value prop. Tells a firm "this tender is X% relevant to you, here's why."
Model: `claude-haiku-4-5-20251001` · API: `POST https://api.anthropic.com/v1/messages`

| # | Task | Size | Status | Assigned |
|---|------|------|--------|----------|
| A1 | Create `app/api/tenders/[id]/fit-score/route.ts` — GET endpoint. Reads tender + firmProfile, calls Haiku, returns `{status,score,reasons,gaps}`. Never 500s. | M | done | Claude Code |
| A2 | Create `components/tenders/fit-score-card.tsx` — client component. States: loading skeleton, no_profile CTA, error, scored. | S | done | Claude Code |
| A3 | Wire FitScoreCard into tender detail page between eligibility and category sections. | S | done | Claude Code |

---

## B — Onboarding Gate

Ensures new users can't skip onboarding and reach a personalized-but-empty dashboard.

| # | Task | Size | Status | Assigned |
|---|------|------|--------|----------|
| B1 | Create `app/(dashboard)/dashboard/layout.tsx` — checks firmProfile exists; redirects to /onboarding if not. Fails open on DB error. | S | done | Claude Code |

---

## C — Tender Data (data entry, not engineering)

Without real tenders the product is empty. Seed 20+ current, open RPPA tenders by hand using the existing admin ingest form at `/dashboard/admin/ingest`.

| # | Task | Size | Status | Assigned |
|---|------|------|--------|----------|
| C1 | Find 20+ open tenders on rppa.gov.rw relevant to law/consulting/advisory. Copy title, issuing org, deadline, category, description, value, source URL. | M | todo | Human |
| C2 | Enter each tender via `/dashboard/admin/ingest`. Source = `rppa`. Submit → each lands as `pending`. | M | todo | Human |
| C3 | Approve each tender via admin panel. Triggers alert matching + makes tenders visible in feed. | S | todo | Human |

---

## E — Codex parallel tasks (specs in docs/codex-tasks.md)

| # | Task | Size | Status | Assigned |
|---|------|------|--------|----------|
| E1 | RPPA tender scraper — standalone script `scripts/scrape-rppa.ts` (`npm run scrape:rppa`) | L | done | Codex |
| E2 | Tender seed script — `scripts/seed-tenders.ts` seeds 20+ real RPPA tenders (`npm run seed:tenders`) | M | done | Codex |
| E3 | Pipeline tracker UI polish — move tenders between stages from pipeline board, show timestamps | M | done | Codex |
| E4 | Weekly digest email — wire cron to send formatted weekly digest to each subscribed firm | M | done | Codex |

---

## D — QA & Verification

| # | Task | Size | Status | Assigned |
|---|------|------|--------|----------|
| D1 | Run `/qa` after A+B are built. Verify: onboarding gate, fit score loading/scored/no-profile/error states. | S | done | Claude Code |
| D2 | Manually test fit score with 3 real tenders + a firm profile. Verify scores make intuitive sense. | S | done | Claude Code |

---

## Verified — 2026-03-16

| Feature | Result | Notes |
|---------|--------|-------|
| **Build** (`npm run build`) | PASS | Zero errors, 25 routes compiled |
| **E1 RPPA scraper** (`npm run scrape:rppa`) | PASS | 271 tenders fetched, 12 new, 259 skipped (dedup works) |
| **E2 Seed tenders** (`npm run seed:tenders`) | PASS | 0 inserted, 21 updated — fully idempotent on re-run |
| **E3 Pipeline board** | PASS (code-verified) | Drag-and-drop + select, optimistic update with rollback, `updatedAt` persisted from API response, server re-fetch on reload |
| **E4 Weekly digest preview** | PASS (code-verified) | `POST /api/cron/weekly-digest/preview` auth-guarded, sends to current user only, "Send preview to my email" button in alerts UI |
| **B1 Onboarding gate** | PASS (code-verified) | `/dashboard/**` layout redirects to `/onboarding` if no firmProfile, fails open on DB error |
| **A1-A3 AI Fit Score** | **PASS** | Live, end-to-end verified. Prompt tightened. See scores below. |
| **Onboarding + Profile UI** | PASS (code-verified) | Firm name → practice areas → contract size + funding → keywords. PUT `/api/profile` write path confirmed. |

### Fit Score Results (firm: TECHNOLOGIA, service: IT consulting, contract: $50K–$250K)

| Tender | Issuing Org | Score | Key Reasons |
|--------|-------------|-------|-------------|
| Consultancy firm to provide ISO 9001 Certification | Rwanda FDA | **25/100** | Quality management ≠ IT consulting; food/pharma sector expertise required |
| Conducting the baseline survey | CRCSP Climate Project | **35/100** | Agricultural field research; KOICA funding (not World Bank/GoR); domain mismatch |
| Hiring a consultancy firm to conduct an End line evaluation | SPIU MINEMA | **45/100** | World Bank funding ✓; M&E/social research skills absent from IT consulting profile |

**Prompt quality assessment:** Scores are well-differentiated (25/35/45), specific to the firm's stated service category, correctly identify domain mismatches, and surface funding source alignment. Output is useful for a real firm partner. No generic or vague reasons.

---

## Sprint 2 backlog (do not build yet)

| Item | Why deferred |
|---|---|
| Redis caching for fit scores | MVP scale too small to justify |
| Fit score on feed list view | LLM cost at list scale; detail page only |
| Test runner (Vitest/Playwright) | Set up once core product is stable |
| Stripe subscription billing | Not needed until paying users exist |
| World Bank / UNGM / ADB scrapers | After RPPA scraper is validated |
| Fit score stored in DB | Over-engineering; recompute on demand |
---

## MVP Shipped — 2026-03-16

**v0.1.0 shipped — 2026-03-16**

**What is live on `main`:**

- Tender feed with admin ingest + approve flow
- Pipeline tracker (watching → go → in_prep → submitted → won/lost) with inline drag-and-drop stage moves
- AI fit score per tender (claude-haiku-4-5-20251001) — score 0-100, specific reasons, eligibility gaps
- Onboarding gate — new users redirected to /onboarding before dashboard access
- Firm profile setup (4-step onboarding) and edit (/dashboard/profile)
- Alerts preferences — new match, deadline 7d/48h, weekly digest toggle
- Weekly digest cron (Monday 04:00 UTC) + manual preview endpoint
- RPPA scraper (`npm run scrape:rppa`) — 247+ tenders ingested, duplicate detection
- Tender seed script (`npm run seed:tenders`) — 21 real tenders, idempotent

**Known gap:** Scraped tenders are predominantly infrastructure/supply. Approving consulting-category tenders from the admin panel will improve fit score test diversity.
