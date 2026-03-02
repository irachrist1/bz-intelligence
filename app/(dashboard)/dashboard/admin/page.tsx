import Link from 'next/link'
import { and, desc, eq } from 'drizzle-orm'
import { redirect } from 'next/navigation'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { getAdminSession } from '@/lib/auth/admin'
import { db } from '@/lib/db'
import { tenders } from '@/lib/db/schema'
import { ApproveTenderButton } from '@/components/admin/approve-tender-button'

export default async function AdminPage() {
  const adminSession = await getAdminSession()
  if (!adminSession) redirect('/dashboard/tenders')

  const pending = await db
    .select({
      id: tenders.id,
      title: tenders.title,
      source: tenders.source,
      issuingOrg: tenders.issuingOrg,
      createdAt: tenders.createdAt,
    })
    .from(tenders)
    .where(and(eq(tenders.reviewStatus, 'pending'), eq(tenders.status, 'open')))
    .orderBy(desc(tenders.createdAt))
    .limit(20)

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100 mb-1">Admin</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Manual ingestion and review workspace.
          </p>
        </div>
        <Badge variant="secondary">{pending.length} pending</Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <Link href="/dashboard/admin/ingest" className="block rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 hover:border-zinc-400 transition-colors">
          <h2 className="text-sm font-medium text-zinc-900 dark:text-zinc-100 mb-1">Ingest Tender</h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">Create a new tender entry in the review queue.</p>
        </Link>
        <Link href="/dashboard/admin/sources" className="block rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 hover:border-zinc-400 transition-colors">
          <h2 className="text-sm font-medium text-zinc-900 dark:text-zinc-100 mb-1">Source Registry</h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">Inspect configured tender sources and statuses.</p>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Pending Review</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {pending.length === 0 ? (
            <div className="text-sm text-zinc-500 dark:text-zinc-400">No pending tenders.</div>
          ) : (
            pending.map((row) => (
              <div key={row.id} className="rounded-lg border border-zinc-200 dark:border-zinc-800 px-3 py-2 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100 line-clamp-1">{row.title}</p>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                    {row.issuingOrg} · {row.source}
                  </p>
                </div>
                <ApproveTenderButton tenderId={row.id} />
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  )
}
