# BZ Intelligence — V2 Engineering Brief

> Written: March 2026
> Purpose: A precise, agent-executable list of every broken thing in the codebase — with the exact file,
> the exact broken code, and the exact fix required. Nothing is abstract.
> Work through these in numbered order. Do not skip ahead.
> Product strategy context: see TENDER_VISION.md.

---

## How to read this document

Each issue entry contains:
- **File** — exact path
- **What is broken** — the exact code that is wrong and why
- **Fix** — exactly what to write instead

Do not modify any table that already exists in the database (auth tables, compliance tables, regulatory_bodies, knowledge_embeddings). Only push the new tables listed in issue 1.

---

## BLOCK 1 — Database: Tables missing from Neon

**This is the root cause of most failures in the app. Fix this first. Everything else depends on it.**

### Issue 1: Five schema tables have never been pushed to the database

**What is broken:**
The following tables are defined in TypeScript schema but do not exist in the live Neon database:
- `tenders` — `lib/db/schema/public.ts`
- `tender_sources` — `lib/db/schema/public.ts`
- `firm_profiles` — `lib/db/schema/private.ts`
- `tender_saves` — `lib/db/schema/private.ts`
- `alert_preferences` — `lib/db/schema/private.ts`

Every page that queries these tables hits a Postgres "relation does not exist" error. The catch blocks in those pages turn this into user-visible warning banners.

**Fix:**
Run with the correct `DATABASE_URL_UNPOOLED` in `.env.local`:
```bash
npx drizzle-kit push
```
Verify all five tables exist:
```sql
SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name;
```
Expected new tables: `alert_preferences`, `firm_profiles`, `tender_saves`, `tender_sources`, `tenders`.

---

## BLOCK 2 — Onboarding: Layout and centering broken

### Issue 2: Sidebar renders during onboarding

**File:** `app/(dashboard)/onboarding/page.tsx`

**What is broken:**
`app/(dashboard)/layout.tsx` wraps ALL children in `DashboardShell`:
```tsx
export default async function DashboardLayout({ children }) {
  const session = await getSession()
  if (!session) redirect('/sign-in')
  return <DashboardShell>{children}</DashboardShell>
}
```
`DashboardShell` renders the full sidebar and top header bar. The user sees the entire navigation interface during onboarding. They can click any nav link and abandon the flow permanently.

**Fix:**
Create `app/(dashboard)/onboarding/layout.tsx`. Next.js App Router applies the nearest layout, so this overrides the parent for all routes under `/onboarding`:
```tsx
// app/(dashboard)/onboarding/layout.tsx — CREATE THIS FILE
import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth/server'

export default async function OnboardingLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession()
  if (!session) redirect('/sign-in')
  return <>{children}</>
}
```

### Issue 3: Onboarding form is not properly centered

**File:** `app/(dashboard)/onboarding/page.tsx`

**What is broken:**
The outer div sets `min-h-screen flex items-center justify-center` but is constrained inside `DashboardShell`'s `<main className="flex-1 overflow-y-auto">`. The `min-h-screen` competes with the shell's height constraint, causing misalignment on smaller viewports. After Issue 2 is fixed the outer div must be self-sufficient.

**Fix — find the current outer return wrapper and change it:**
```tsx
// BEFORE:
<div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950 px-4">
  <div className="w-full max-w-xl">

// AFTER:
<div className="min-h-screen flex flex-col items-center justify-center bg-zinc-50 dark:bg-zinc-950 px-4 py-12">
  <div className="w-full max-w-lg">
```

`flex-col` is required for proper cross-axis centering when content overflows. `py-12` prevents flush edges on very short viewports.

### Issue 4: Onboarding silently saves nothing when `firm_profiles` table is missing

**File:** `app/api/onboarding/route.ts`

**What is broken:**
```typescript
  } catch (error) {
    console.warn('Firm profile upsert skipped (likely missing migration):', error)
  }
```
The route still returns `200 OK` and redirects the user to `/dashboard/tenders`. The user believes they completed onboarding. Their `firm_profiles` row does not exist. Alert matching will never work for them.

**Fix:**
```typescript
// BEFORE:
  } catch (error) {
    console.warn('Firm profile upsert skipped (likely missing migration):', error)
  }

// AFTER:
  } catch (error) {
    console.error('Firm profile upsert failed:', error)
    return NextResponse.json({ error: 'Failed to save firm profile' }, { status: 500 })
  }
```

### Issue 5: Onboarding route writes dead data to `business_profiles`

**File:** `app/api/onboarding/route.ts`

**What is broken:**
After saving to `firmProfiles`, the route also writes to the legacy `businessProfiles` table with `null` values for all old fields (`handlesMoney`, `collectsData`, `foreignOwnership`, etc.). The legacy compliance features are no longer in the UI or navigation. This dead write adds latency to every onboarding submission.

**Fix:**
Remove the entire legacy `businessProfiles` block. Find the comment `// Keep legacy business profile in sync...` and delete from there through the end of the legacy insert/update block. Keep only the `firmProfiles` upsert and the welcome email send.

---

## BLOCK 3 — Developer messages visible to users

### Issue 6: Landing page shows placeholder text to all visitors

**File:** `app/page.tsx`

**What is broken:**
The bottom section of the landing page contains this literal placeholder rendered in HTML:
```tsx
<section className="mt-8 rounded-2xl border border-dashed border-zinc-300 dark:border-zinc-700 bg-white/80 dark:bg-zinc-900/70 px-6 py-5 text-sm text-zinc-600 dark:text-zinc-400">
  Social proof updates will appear here as pilot metrics go live:
  <span className="font-medium text-zinc-800 dark:text-zinc-200"> firms onboarded</span>,
  <span className="font-medium text-zinc-800 dark:text-zinc-200"> tenders tracked</span>,
  and
  <span className="font-medium text-zinc-800 dark:text-zinc-200"> total contract value surfaced</span>.
</section>
```
Every visitor to the homepage sees this developer note about future metrics.

**Fix:** Remove the entire `<section>` block. Do not replace it with anything until real metrics exist.

### Issue 7: Landing page CTAs are contradictory

**File:** `app/page.tsx`

**What is broken:**
```tsx
<Link href="/sign-up">
  <Button size="lg" className="px-8">Start monitoring</Button>
</Link>
<Link href="/sign-in">
  <Button size="lg" variant="outline" className="px-8">Get early access</Button>
</Link>
```
"Get early access" routes to `/sign-in`. A new visitor clicking it lands on a login form for an account they don't have.

**Fix:**
```tsx
// BEFORE:
<Link href="/sign-in">
  <Button size="lg" variant="outline" className="px-8">Get early access</Button>
</Link>

// AFTER:
<Link href="/sign-in">
  <Button size="lg" variant="outline" className="px-8">Sign in</Button>
</Link>
```

### Issue 8: Tender feed shows database migration warning to users

**File:** `app/(dashboard)/dashboard/tenders/page.tsx`

**What is broken:**
```tsx
{fallbackMode && (
  <div className="mb-4 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 ...">
    <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
    <span>Using legacy `news_items` data until `tenders` table is migrated and populated.</span>
  </div>
)}
```
Internal engineering note shown to end users as their first view of the product.

**Fix after Issue 1 (tables pushed):**
Remove the `fallbackMode` variable, the amber banner JSX, and the entire `catch` block that sets `fallbackMode = true` and queries `newsItems`. Remove the `newsItems` import at the top of the file. The tenders table now exists — no fallback is needed.

### Issue 9: Tender detail page shows "Legacy data fallback" badge

**File:** `app/(dashboard)/dashboard/tenders/[id]/page.tsx`

**What is broken:**
```tsx
{fallbackMode && <Badge variant="outline">Legacy data fallback</Badge>}
```
When loaded from a `newsItems` fallback record, the detail page renders this badge in the article header.

**Fix after Issue 1:**
Same treatment as Issue 8. Remove `fallbackMode`, the fallback catch block that queries `newsItems`, the badge JSX, and the `newsItems` import.

### Issue 10: Alerts page shows migration warning to users

**File:** `app/(dashboard)/dashboard/alerts/page.tsx`

**What is broken:**
```typescript
} catch {
  unavailableReason = 'Alert preferences table is not available yet. Run migrations to enable settings persistence.'
}
// ...
{unavailableReason && (
  <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 ...">
    {unavailableReason}
  </div>
)}
```

**Fix after Issue 1:** Remove `unavailableReason`, the catch block, and the amber banner JSX. The page must also be rebuilt as interactive (see Issue 16).

### Issue 11: Saved page shows migration warning to users

**File:** `app/(dashboard)/dashboard/saved/page.tsx`

**What is broken:**
```typescript
} catch {
  unavailableReason = 'Saved tender tracking is unavailable until database migrations are applied.'
}
```

**Fix after Issue 1:** Remove `unavailableReason`, the catch block, and the banner. Replace the empty state (when `rows.length === 0`) with:
```tsx
<div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-6 py-10 text-center">
  <p className="font-medium text-zinc-700 dark:text-zinc-300 mb-1">No saved tenders yet</p>
  <p className="text-sm text-zinc-500 dark:text-zinc-400">
    Browse the tender feed and save opportunities your firm wants to track.
  </p>
  <Link href="/dashboard/tenders" className="mt-4 inline-block text-sm text-blue-500 hover:underline">
    Go to tender feed →
  </Link>
</div>
```

### Issue 12: Pipeline page shows migration warning to users

**File:** `app/(dashboard)/dashboard/pipeline/page.tsx`

**What is broken:**
```typescript
} catch {
  unavailableReason = 'Pipeline tables are not available yet. Run database migrations to enable this view.'
  rows = []
}
```

**Fix after Issue 1:** Remove `unavailableReason`, the catch block, and the banner. The kanban columns already show "No tenders" empty states — that is sufficient.

---

## BLOCK 4 — Missing API routes (no write capability exists)

The entire tender-facing product is read-only. There are no routes to write data. These must all be created.

### Issue 13: No route to save a tender or update pipeline stage

**Missing file:** `app/api/tenders/save/route.ts`

No such file exists. There is no way for a user to save a tender to their pipeline or change its stage.

**Create this file:**
```typescript
import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth/server'
import { db } from '@/lib/db'
import { tenderSaves } from '@/lib/db/schema'
import { and, eq } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'

const VALID_STAGES = ['watching', 'go', 'no_go', 'in_prep', 'submitted', 'won', 'lost'] as const
type Stage = (typeof VALID_STAGES)[number]

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const orgId = session.session.activeOrganizationId || session.user.id
  const body = await req.json()
  const { tenderId, action, stage } = body

  if (!tenderId || typeof tenderId !== 'string') {
    return NextResponse.json({ error: 'tenderId required' }, { status: 400 })
  }

  if (action === 'unsave') {
    await db.delete(tenderSaves).where(and(eq(tenderSaves.orgId, orgId), eq(tenderSaves.tenderId, tenderId)))
    revalidatePath('/dashboard/tenders')
    revalidatePath('/dashboard/saved')
    revalidatePath('/dashboard/pipeline')
    return NextResponse.json({ ok: true })
  }

  if (action === 'update_stage') {
    if (!stage || !VALID_STAGES.includes(stage as Stage)) {
      return NextResponse.json({ error: 'Invalid stage' }, { status: 400 })
    }
    await db
      .update(tenderSaves)
      .set({ stage, updatedAt: new Date() })
      .where(and(eq(tenderSaves.orgId, orgId), eq(tenderSaves.tenderId, tenderId)))
    revalidatePath('/dashboard/pipeline')
    revalidatePath(`/dashboard/tenders/${tenderId}`)
    return NextResponse.json({ ok: true })
  }

  // Default: save (upsert with stage 'watching')
  const existing = await db
    .select({ id: tenderSaves.id })
    .from(tenderSaves)
    .where(and(eq(tenderSaves.orgId, orgId), eq(tenderSaves.tenderId, tenderId)))
    .limit(1)

  if (existing.length === 0) {
    await db.insert(tenderSaves).values({
      orgId,
      tenderId,
      stage: (stage as Stage) || 'watching',
      createdAt: new Date(),
      updatedAt: new Date(),
    })
  }

  revalidatePath('/dashboard/tenders')
  revalidatePath('/dashboard/saved')
  revalidatePath('/dashboard/pipeline')
  return NextResponse.json({ ok: true })
}
```

### Issue 14: No route to save alert preferences

**Missing file:** `app/api/alerts/route.ts`

None exists. A user cannot change any alert setting.

**Create this file (GET + POST):**
```typescript
import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth/server'
import { db } from '@/lib/db'
import { alertPreferences } from '@/lib/db/schema'
import { and, eq } from 'drizzle-orm'

export async function GET(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const orgId = session.session.activeOrganizationId || session.user.id
  const userId = session.user.id

  const [pref] = await db
    .select()
    .from(alertPreferences)
    .where(and(eq(alertPreferences.orgId, orgId), eq(alertPreferences.userId, userId)))
    .limit(1)

  return NextResponse.json(pref ?? {
    newMatchFrequency: 'realtime',
    deadline7day: true,
    deadline48hr: true,
    tenderUpdate: true,
    weeklyDigest: true,
  })
}

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const orgId = session.session.activeOrganizationId || session.user.id
  const userId = session.user.id
  const body = await req.json()

  const VALID_FREQUENCIES = ['realtime', 'daily', 'weekly', 'off']
  const newMatchFrequency = VALID_FREQUENCIES.includes(body.newMatchFrequency)
    ? body.newMatchFrequency : 'realtime'

  const data = {
    newMatchFrequency,
    deadline7day: body.deadline7day !== false,
    deadline48hr: body.deadline48hr !== false,
    tenderUpdate: body.tenderUpdate !== false,
    weeklyDigest: body.weeklyDigest !== false,
    updatedAt: new Date(),
  }

  const existing = await db
    .select({ id: alertPreferences.id })
    .from(alertPreferences)
    .where(and(eq(alertPreferences.orgId, orgId), eq(alertPreferences.userId, userId)))
    .limit(1)

  if (existing.length === 0) {
    await db.insert(alertPreferences).values({ orgId, userId, ...data, createdAt: new Date() })
  } else {
    await db.update(alertPreferences).set(data).where(eq(alertPreferences.id, existing[0].id))
  }

  return NextResponse.json({ ok: true })
}
```

### Issue 15: No admin panel and no tender ingest route

**Missing files:**
- `app/api/admin/tenders/ingest/route.ts`
- `app/api/admin/tenders/[id]/approve/route.ts`
- `app/api/admin/tenders/[id]/reject/route.ts`
- `app/(dashboard)/dashboard/admin/page.tsx`
- `app/(dashboard)/dashboard/admin/ingest/page.tsx`
- `app/(dashboard)/dashboard/admin/review/page.tsx`

Without these, the only way to get tenders into the system is direct DB manipulation. The feed stays empty forever.

**Admin guard (used by all admin routes and pages):**
```typescript
function isAdmin(email: string): boolean {
  return (process.env.ADMIN_EMAILS || '').split(',').map(e => e.trim().toLowerCase()).includes(email.toLowerCase())
}
```

**Create `app/api/admin/tenders/ingest/route.ts`:**
```typescript
import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth/server'
import { db } from '@/lib/db'
import { tenders } from '@/lib/db/schema'
import { revalidatePath, revalidateTag } from 'next/cache'

function isAdmin(email: string) {
  return (process.env.ADMIN_EMAILS || '').split(',').map(e => e.trim().toLowerCase()).includes(email.toLowerCase())
}

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!isAdmin(session.user.email || '')) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await req.json()
  if (!body.title || !body.issuingOrg || !body.sourceUrl || !body.source) {
    return NextResponse.json({ error: 'title, issuingOrg, sourceUrl, source required' }, { status: 400 })
  }

  const now = new Date()
  const [inserted] = await db.insert(tenders).values({
    source: body.source,
    sourceId: body.sourceId || null,
    title: body.title,
    issuingOrg: body.issuingOrg,
    tenderType: body.tenderType || null,
    fundingSource: body.fundingSource || null,
    categoryTags: Array.isArray(body.categoryTags) ? body.categoryTags : [],
    description: body.description || null,
    aiSummary: body.aiSummary || null,
    eligibilityNotes: body.eligibilityNotes || null,
    estimatedValueUsd: typeof body.estimatedValueUsd === 'number' ? body.estimatedValueUsd : null,
    currency: body.currency || 'USD',
    documents: Array.isArray(body.documents) ? body.documents : [],
    deadlineSubmission: body.deadlineSubmission ? new Date(body.deadlineSubmission) : null,
    datePosted: body.datePosted ? new Date(body.datePosted) : now,
    sourceUrl: body.sourceUrl,
    status: 'open',
    reviewStatus: body.autoApprove === true ? 'approved' : 'pending',
    country: body.country || 'rw',
    createdAt: now,
    updatedAt: now,
  }).returning({ id: tenders.id })

  revalidatePath('/dashboard/tenders')
  revalidateTag('tenders')
  return NextResponse.json({ ok: true, id: inserted.id })
}
```

**Create `app/api/admin/tenders/[id]/approve/route.ts`:**
```typescript
import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth/server'
import { db } from '@/lib/db'
import { tenders } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { revalidatePath, revalidateTag } from 'next/cache'

function isAdmin(email: string) {
  return (process.env.ADMIN_EMAILS || '').split(',').map(e => e.trim().toLowerCase()).includes(email.toLowerCase())
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!isAdmin(session.user.email || '')) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const { id } = await params
  await db.update(tenders).set({ reviewStatus: 'approved', updatedAt: new Date() }).where(eq(tenders.id, id))
  revalidatePath('/dashboard/tenders')
  revalidatePath('/dashboard/admin/review')
  revalidateTag('tenders')
  return NextResponse.json({ ok: true })
}
```

**Create `app/api/admin/tenders/[id]/reject/route.ts`:**
Identical to approve but sets `reviewStatus: 'rejected'` and does not call `revalidateTag('tenders')`.

**Create `app/(dashboard)/dashboard/admin/page.tsx`:**
Server component. Guard with `isAdmin(session.user.email)` — redirect to `/dashboard/tenders` if not admin. Query count totals: all tenders, pending, approved. Render three stat cards. Two button links: "Add tender manually" → `/dashboard/admin/ingest` and "Review pending tenders" → `/dashboard/admin/review`.

**Create `app/(dashboard)/dashboard/admin/ingest/page.tsx`:**
Client component with a form. Fields: source (select: rppa, world_bank, ungm, adb, usaid, eu, manual), title, issuingOrg, description (textarea), tenderType (select: rfp, rfq, eoi, framework, direct), fundingSource, estimatedValueUsd (number), deadlineSubmission (date), datePosted (date), sourceUrl (required), categoryTags (comma-separated text — split on submit), eligibilityNotes (textarea), country, autoApprove (checkbox — if checked, uses `reviewStatus: 'approved'` so tender publishes immediately). POST to `/api/admin/tenders/ingest`. On success: show toast, reset form.

**Create `app/(dashboard)/dashboard/admin/review/page.tsx`:**
Server component. Queries `tenders WHERE review_status = 'pending' ORDER BY created_at DESC`. For each tender: show title, issuingOrg, source, deadline. Two form buttons per row: "Approve" → POST `/api/admin/tenders/{id}/approve`, "Reject" → POST `/api/admin/tenders/{id}/reject`.

---

## BLOCK 5 — Pages that are read-only and need interactivity

### Issue 16: Alerts page has no form controls

**File:** `app/(dashboard)/dashboard/alerts/page.tsx`

**What is broken:**
The current page is a server component that renders `<Badge>` and `<p>` text for each preference. There are no toggles, no selects, no save button. A user cannot change any alert setting.

**Fix:**
Convert the entire page to a client component (`'use client'`). Load initial values via `useEffect` calling `GET /api/alerts`. Replace read-only elements with:
- `newMatchFrequency` → `<Select>` with options: Realtime, Daily, Weekly, Off
- `deadline7day` → `<Switch>` toggle
- `deadline48hr` → `<Switch>` toggle
- `tenderUpdate` → `<Switch>` toggle
- `weeklyDigest` → `<Switch>` toggle
- "Save preferences" `<Button>` at the bottom — calls `POST /api/alerts`, shows success toast via `toast()` from sonner

If `Switch` is not in `components/ui/`: `npx shadcn@latest add switch`

### Issue 17: Tender detail page stage is read-only

**File:** `app/(dashboard)/dashboard/tenders/[id]/page.tsx`

**What is broken:**
```tsx
<span className="inline-flex items-center gap-1 text-xs text-zinc-500 dark:text-zinc-400">
  <Landmark className="h-3.5 w-3.5" />
  Current status: {stageLabel(saveRow?.stage ?? null)}
</span>
```
Plain text. No way to save the tender or change its stage.

**Fix:**
Create client component `TenderActions` (new file in same directory or `components/tender-actions.tsx`):
```tsx
'use client'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'

const STAGES = [
  { value: 'watching', label: 'Watching' },
  { value: 'go', label: 'Go' },
  { value: 'no_go', label: 'No Go' },
  { value: 'in_prep', label: 'In Prep' },
  { value: 'submitted', label: 'Submitted' },
  { value: 'won', label: 'Won' },
  { value: 'lost', label: 'Lost' },
]

export function TenderActions({ tenderId, initialStage, initialSaved }: {
  tenderId: string
  initialStage: string | null
  initialSaved: boolean
}) {
  const [saved, setSaved] = useState(initialSaved)
  const [stage, setStage] = useState(initialStage || 'watching')
  const [loading, setLoading] = useState(false)

  async function save() {
    setLoading(true)
    const res = await fetch('/api/tenders/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tenderId, action: 'save', stage: 'watching' }),
    })
    if (res.ok) { setSaved(true); toast.success('Saved to pipeline') }
    setLoading(false)
  }

  async function unsave() {
    setLoading(true)
    const res = await fetch('/api/tenders/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tenderId, action: 'unsave' }),
    })
    if (res.ok) { setSaved(false); toast.success('Removed from pipeline') }
    setLoading(false)
  }

  async function updateStage(newStage: string) {
    setStage(newStage)
    await fetch('/api/tenders/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tenderId, action: 'update_stage', stage: newStage }),
    })
    toast.success('Stage updated')
  }

  if (!saved) {
    return <Button size="sm" onClick={save} disabled={loading}>Save to pipeline</Button>
  }

  return (
    <div className="flex items-center gap-3 mt-4">
      <Select value={stage} onValueChange={updateStage}>
        <SelectTrigger className="w-36 h-9 text-sm"><SelectValue /></SelectTrigger>
        <SelectContent>
          {STAGES.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
        </SelectContent>
      </Select>
      <Button size="sm" variant="outline" onClick={unsave} disabled={loading}>Remove</Button>
    </div>
  )
}
```
Import and render in the tender detail server component:
```tsx
<TenderActions
  tenderId={tender.id}
  initialStage={saveRow?.stage ?? null}
  initialSaved={!!saveRow}
/>
```

### Issue 18: Tender feed cards have no save action

**File:** `app/(dashboard)/dashboard/tenders/page.tsx`

**What is broken:**
Each card is a `<Link>` only. To save a tender the user must navigate into the detail page (which also had no save button).

**Fix:**
First, in the server component, fetch the current org's saved tender IDs alongside the tender list:
```typescript
const saveRows = session ? await db
  .select({ tenderId: tenderSaves.tenderId })
  .from(tenderSaves)
  .where(eq(tenderSaves.orgId, session.session.activeOrganizationId || session.user.id))
  : []
const savedIds = new Set(saveRows.map(r => r.tenderId))
```

Then add a form-based save button to each card (works without JS):
```tsx
<form action="/api/tenders/save" method="POST">
  <input type="hidden" name="tenderId" value={item.id} />
  <input type="hidden" name="action" value={savedIds.has(item.id) ? 'unsave' : 'save'} />
  <button type="submit" className="text-xs px-2 py-1 rounded border border-zinc-200 dark:border-zinc-700 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 bg-white dark:bg-zinc-900 transition-colors">
    {savedIds.has(item.id) ? 'Saved ✓' : 'Save'}
  </button>
</form>
```
Note: Issue 13 must be done first.

### Issue 19: Tender feed search has no submit button

**File:** `app/(dashboard)/dashboard/tenders/page.tsx`

**What is broken:**
```tsx
<form action="/dashboard/tenders" className="flex-1">
  <Input name="q" defaultValue={query} placeholder="Search title, issuing organization, description..." />
</form>
```
No submit button. Users must press Enter. No affordance on mobile.

**Fix:**
```tsx
<form action="/dashboard/tenders" className="flex-1 flex gap-2">
  <Input name="q" defaultValue={query} placeholder="Search tenders..." className="flex-1" />
  <Button type="submit" variant="outline" size="sm">Search</Button>
</form>
```

---

## BLOCK 6 — Performance

### Issue 20: `getSession()` is not memoized — duplicate auth DB calls per page

**File:** `lib/auth/server.ts`

**What is broken:**
```typescript
export async function getSession() {
  return auth.api.getSession({ headers: await headers() })
}
```
Plain `async function`. Every server component that calls it makes an independent auth fetch. Dashboard layout calls it once, the page component calls it again — minimum 2 DB round-trips per page render.

**Fix:**
```typescript
import { cache } from 'react'

export const getSession = cache(async () => {
  return auth.api.getSession({ headers: await headers() })
})
```
`cache()` from React deduplicates calls within the same server render tree. First call runs; all subsequent calls in the same request return the cached result instantly.

### Issue 21: No query caching on tender feed

**File:** `app/(dashboard)/dashboard/tenders/page.tsx`

**What is broken:**
Full `db.select()` runs on every navigation with zero caching. At scale (100+ tenders, dozens of concurrent users) this means repeated identical queries to Neon on every request.

**Fix:**
Wrap the tender fetch in `unstable_cache`:
```typescript
import { unstable_cache } from 'next/cache'

const fetchApprovedTenders = unstable_cache(
  async (source: string, query: string) => {
    // move the existing DB query block here unchanged
  },
  ['tender-feed'],
  { revalidate: 300, tags: ['tenders'] } // 5-min cache, cleared on revalidateTag('tenders')
)
```
The admin ingest and approve routes call `revalidateTag('tenders')` when tenders are published, so the cache clears exactly when new data arrives.

### Issue 22: Missing database indexes on hot query columns

**Files:** `lib/db/schema/public.ts`, `lib/db/schema/private.ts`

**What is broken:**
No index on:
- `tenders.reviewStatus` — every feed query: `WHERE review_status = 'approved'`
- `tenders.status` — every feed query: `WHERE status = 'open'`
- `tender_saves.orgId` — every pipeline/saved query: `WHERE org_id = ?`

**Fix in `lib/db/schema/public.ts`** — add to the tenders table index array:
```typescript
index('tenders_review_status_idx').on(table.reviewStatus),
index('tenders_status_idx').on(table.status),
```

**Fix in `lib/db/schema/private.ts`** — change tenderSaves index array to:
```typescript
(table) => [
  uniqueIndex('tender_saves_org_tender_uniq').on(table.orgId, table.tenderId),
  index('tender_saves_org_idx').on(table.orgId),
]
```
After schema changes, run `npx drizzle-kit push` again.

---

## BLOCK 7 — Seed data and environment

### Issue 23: `tender_sources` table is empty

**What is broken:** No rows after migration. Admin panel has nothing to show. Future scraper health monitoring has no reference data.

**Create `scripts/seed-tender-sources.ts`:**
```typescript
import { db } from '@/lib/db'
import { tenderSources } from '@/lib/db/schema'

const sources = [
  { code: 'rppa', name: 'Rwanda Public Procurement Authority', url: 'https://www.rppa.gov.rw', scraperType: 'html', scraperStatus: 'manual', country: 'rw', active: true },
  { code: 'world_bank', name: 'World Bank STEP', url: 'https://step.worldbank.org', scraperType: 'api', scraperStatus: 'manual', country: 'rw', active: true },
  { code: 'ungm', name: 'UN Global Marketplace', url: 'https://www.ungm.org', scraperType: 'html', scraperStatus: 'manual', country: 'multi', active: true },
  { code: 'adb', name: 'African Development Bank', url: 'https://www.afdb.org/en/projects-and-operations/procurement', scraperType: 'html', scraperStatus: 'manual', country: 'multi', active: true },
  { code: 'usaid', name: 'USAID Rwanda', url: 'https://www.usaid.gov/rwanda', scraperType: 'html', scraperStatus: 'manual', country: 'rw', active: true },
  { code: 'eu', name: 'EU Delegations (EuropeAid)', url: 'https://webgate.ec.europa.eu/europeaid/online-services/index.cfm', scraperType: 'html', scraperStatus: 'manual', country: 'multi', active: true },
  { code: 'giz', name: 'GIZ Rwanda', url: 'https://www.giz.de/en/worldwide/363.html', scraperType: 'html', scraperStatus: 'manual', country: 'rw', active: true },
  { code: 'kigali_city', name: 'City of Kigali Procurement', url: 'https://www.kigalicity.gov.rw', scraperType: 'html', scraperStatus: 'manual', country: 'rw', active: true },
]

async function seed() {
  for (const source of sources) {
    await db.insert(tenderSources).values(source).onConflictDoNothing()
  }
  console.log('Tender sources seeded.')
  process.exit(0)
}

seed().catch(err => { console.error(err); process.exit(1) })
```

Add to `package.json` scripts: `"seed:sources": "npx tsx scripts/seed-tender-sources.ts"`

### Issue 24: `ADMIN_EMAILS` env var not set

**File:** `.env.local`

The admin pages guard with `process.env.ADMIN_EMAILS`. Without it, `isAdmin()` always returns `false` and the admin panel is inaccessible to everyone.

**Fix — add to `.env.local`:**
```
ADMIN_EMAILS=your-admin-email@example.com
```
Multiple admins: comma-separated. Must match the email address used to sign up.

---

## BLOCK 8 — Navigation

### Issue 25: Admin panel link missing from sidebar

**File:** `components/sidebar.tsx`

No link to `/dashboard/admin` exists. Admins must type the URL manually after the admin panel is built.

**Fix:**
Add `Settings2` to the lucide-react import and add to the nav array at the bottom:
```typescript
import { ..., Settings2 } from 'lucide-react'

// In the nav array:
{ href: '/dashboard/admin', label: 'Admin', icon: Settings2 }
```
The admin page itself redirects non-admins to the feed, so showing the link to all users is acceptable for MVP.

---

## Execution order

Work in this exact sequence. Do not skip ahead.

**Block 1 — Do first (everything else blocked by missing tables):**
1. Run `npx drizzle-kit push`
2. Confirm all five tables exist in Neon

**Block 2 — Onboarding:**
3. Create `app/(dashboard)/onboarding/layout.tsx` (Issue 2)
4. Fix onboarding outer wrapper CSS (Issue 3)
5. Fix silent catch in onboarding API route (Issue 4)
6. Remove dead `businessProfiles` write from onboarding route (Issue 5)

**Block 3 — Remove developer messages:**
7. Remove landing page placeholder section (Issue 6)
8. Fix landing page CTA routing (Issue 7)
9. Remove `fallbackMode` warning + `newsItems` fallback from tender feed (Issue 8)
10. Remove `fallbackMode` badge + `newsItems` fallback from tender detail (Issue 9)
11. Remove migration warning from alerts page (Issue 10)
12. Remove migration warning + add proper empty state on saved page (Issue 11)
13. Remove migration warning from pipeline page (Issue 12)

**Block 4 — Create missing API routes + admin panel:**
14. Create `app/api/tenders/save/route.ts` (Issue 13)
15. Create `app/api/alerts/route.ts` with GET and POST (Issue 14)
16. Create `app/api/admin/tenders/ingest/route.ts` (Issue 15)
17. Create `app/api/admin/tenders/[id]/approve/route.ts` (Issue 15)
18. Create `app/api/admin/tenders/[id]/reject/route.ts` (Issue 15)
19. Create `app/(dashboard)/dashboard/admin/page.tsx` (Issue 15)
20. Create `app/(dashboard)/dashboard/admin/ingest/page.tsx` (Issue 15)
21. Create `app/(dashboard)/dashboard/admin/review/page.tsx` (Issue 15)

**Block 5 — Make pages interactive (requires Block 4):**
22. Rebuild alerts page as interactive form (Issue 16)
23. Add `TenderActions` client component to tender detail (Issue 17)
24. Add save form buttons to tender feed cards (Issue 18)
25. Add search submit button to tender feed (Issue 19)
26. Add admin link to sidebar (Issue 25)

**Block 6 — Performance:**
27. Wrap `getSession` with `cache()` (Issue 20)
28. Wrap tender feed query with `unstable_cache` (Issue 21)
29. Add missing DB indexes to schema (Issue 22)
30. Run `npx drizzle-kit push` again for index changes

**Block 7 — Seed data:**
31. Create `scripts/seed-tender-sources.ts` (Issue 23)
32. Add `ADMIN_EMAILS` to `.env.local` (Issue 24)
33. Run `npm run seed:sources`

**After all blocks complete:**
34. Use admin ingest panel to add 10–20 real tenders from RPPA and World Bank
35. Approve them via the review panel
36. Verify they appear in the tender feed
37. Test saving a tender, changing its stage, viewing pipeline and saved pages
38. Test alert preferences saving and persisting across sessions

---

*Last updated: March 2026*
