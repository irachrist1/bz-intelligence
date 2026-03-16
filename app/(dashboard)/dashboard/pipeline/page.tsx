import { and, desc, eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth/server'
import { tenderSaves, tenders } from '@/lib/db/schema'
import { PipelineBoard } from '@/components/tenders/pipeline-board'
import { normalizePipelineStage, type PipelineCardRecord } from '@/lib/tenders/pipeline'

export default async function PipelinePage() {
  const session = await getSession()
  const orgId = session?.session.activeOrganizationId || session?.user.id

  let rows: PipelineCardRecord[] = []

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
      stage: normalizePipelineStage(entry.stage),
      deadlineSubmission: entry.deadlineSubmission ? entry.deadlineSubmission.toISOString() : null,
      updatedAt: entry.updatedAt ? entry.updatedAt.toISOString() : null,
    }))
  }

  return (
    <div className="p-6 max-w-[1400px] mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100 mb-1">Pipeline</h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Track your tender lifecycle from first review to outcome.
        </p>
      </div>

      <PipelineBoard initialRows={rows} />
    </div>
  )
}
