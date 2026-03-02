import Link from 'next/link'
import { and, desc, eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth/server'
import { tenderSaves, tenders } from '@/lib/db/schema'
import { Badge } from '@/components/ui/badge'

const STAGE_ORDER = ['watching', 'go', 'in_prep', 'submitted', 'won', 'lost'] as const

const STAGE_TITLES: Record<(typeof STAGE_ORDER)[number], string> = {
  watching: 'Watching',
  go: 'Go',
  in_prep: 'In Preparation',
  submitted: 'Submitted',
  won: 'Won',
  lost: 'Lost / Passed',
}

type PipelineRow = {
  id: string
  tenderId: string
  title: string
  issuingOrg: string
  stage: (typeof STAGE_ORDER)[number]
  updatedAt: Date | null
}

function formatDate(value: Date | null): string {
  if (!value) return 'N/A'
  return new Date(value).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}

export default async function PipelinePage() {
  const session = await getSession()
  const orgId = session?.session.activeOrganizationId || session?.user.id

  let rows: PipelineRow[] = []

  if (orgId) {
    const result = await db
      .select({
        id: tenderSaves.id,
        tenderId: tenderSaves.tenderId,
        title: tenders.title,
        issuingOrg: tenders.issuingOrg,
        stage: tenderSaves.stage,
        updatedAt: tenderSaves.updatedAt,
      })
      .from(tenderSaves)
      .leftJoin(tenders, eq(tenderSaves.tenderId, tenders.id))
      .where(and(eq(tenderSaves.orgId, orgId), eq(tenders.reviewStatus, 'approved')))
      .orderBy(desc(tenderSaves.updatedAt))

    rows = result.map((entry) => ({
      id: entry.id,
      tenderId: entry.tenderId,
      title: entry.title || 'Untitled tender',
      issuingOrg: entry.issuingOrg || 'Unknown issuer',
      stage: (entry.stage as PipelineRow['stage']) || 'watching',
      updatedAt: entry.updatedAt,
    }))
  }

  const grouped = Object.fromEntries(
    STAGE_ORDER.map((stage) => [stage, rows.filter((row) => row.stage === stage)])
  ) as Record<(typeof STAGE_ORDER)[number], PipelineRow[]>

  return (
    <div className="p-6 max-w-[1400px] mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100 mb-1">Pipeline</h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Track your tender lifecycle from first review to outcome.
        </p>
      </div>

      <div className="overflow-x-auto pb-3">
        <div className="grid grid-cols-6 gap-4 min-w-[1100px]">
          {STAGE_ORDER.map((stage) => (
            <section
              key={stage}
              className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-3"
            >
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-medium text-zinc-900 dark:text-zinc-100">{STAGE_TITLES[stage]}</h2>
                <Badge variant="secondary" className="text-xs">{grouped[stage].length}</Badge>
              </div>

              <div className="space-y-2">
                {grouped[stage].length === 0 ? (
                  <div className="rounded-lg border border-dashed border-zinc-200 dark:border-zinc-700 px-2 py-3 text-xs text-zinc-400 text-center">
                    No tenders
                  </div>
                ) : (
                  grouped[stage].map((row) => (
                    <Link
                      key={row.id}
                      href={`/dashboard/tenders/${row.tenderId}`}
                      className="block rounded-lg border border-zinc-200 dark:border-zinc-800 px-3 py-2 hover:border-zinc-400 dark:hover:border-zinc-600 transition-colors"
                    >
                      <p className="text-xs font-medium text-zinc-900 dark:text-zinc-100 line-clamp-2">{row.title}</p>
                      <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-1 line-clamp-1">{row.issuingOrg}</p>
                      <p className="text-[11px] text-zinc-400 mt-1">Updated {formatDate(row.updatedAt)}</p>
                    </Link>
                  ))
                )}
              </div>
            </section>
          ))}
        </div>
      </div>
    </div>
  )
}
