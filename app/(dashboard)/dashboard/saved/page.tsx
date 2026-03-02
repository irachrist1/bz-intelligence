import Link from 'next/link'
import { and, desc, eq } from 'drizzle-orm'
import { Badge } from '@/components/ui/badge'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth/server'
import { tenderSaves, tenders } from '@/lib/db/schema'

type SavedTenderRow = {
  id: string
  tenderId: string
  title: string
  issuingOrg: string
  stage: string | null
  deadlineSubmission: Date | null
  updatedAt: Date | null
}

function formatDate(value: Date | null): string {
  if (!value) return 'N/A'
  return new Date(value).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

export default async function SavedTendersPage() {
  const session = await getSession()
  const orgId = session?.session.activeOrganizationId || session?.user.id

  let rows: SavedTenderRow[] = []

  if (orgId) {
    const result = await db
      .select({
        id: tenderSaves.id,
        tenderId: tenderSaves.tenderId,
        title: tenders.title,
        issuingOrg: tenders.issuingOrg,
        stage: tenderSaves.stage,
        deadlineSubmission: tenders.deadlineSubmission,
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
      stage: entry.stage,
      deadlineSubmission: entry.deadlineSubmission,
      updatedAt: entry.updatedAt,
    }))
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100 mb-1">Saved Tenders</h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Opportunities your team bookmarked for review and pipeline tracking.
        </p>
      </div>

      {rows.length === 0 ? (
        <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-6 py-10 text-center text-zinc-500 dark:text-zinc-400">
          <p className="font-medium text-zinc-700 dark:text-zinc-300 mb-1">No saved tenders yet</p>
          <p className="text-sm">
            Browse the <Link href="/dashboard/tenders" className="text-blue-500 hover:underline">feed</Link> and save opportunities your firm wants to track.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {rows.map((row) => (
            <Link
              key={row.id}
              href={`/dashboard/tenders/${row.tenderId}`}
              className="block rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 hover:border-zinc-400 transition-colors"
            >
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h2 className="text-sm font-medium text-zinc-900 dark:text-zinc-100">{row.title}</h2>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">{row.issuingOrg}</p>
                </div>
                <div className="text-right">
                  <Badge variant="outline" className="capitalize">{row.stage || 'watching'}</Badge>
                  <p className="text-xs text-zinc-500 mt-1">Deadline {formatDate(row.deadlineSubmission)}</p>
                  <p className="text-xs text-zinc-400">Updated {formatDate(row.updatedAt)}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
