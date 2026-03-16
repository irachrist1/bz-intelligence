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

> **Blocker to activate:** Replace `ANTHROPIC_API_KEY` in `.env.local` with a real REST key (`sk-ant-api...`) from console.anthropic.com. Current key is a Claude Code OAuth token and is rejected by the REST API.

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
| D1 | Run `/qa` after A+B are built. Verify: onboarding gate, fit score loading/scored/no-profile/error states. | S | todo | Claude Code |
| D2 | Manually test fit score with 3 real tenders + a firm profile. Verify scores make intuitive sense. | S | todo | Human |

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
