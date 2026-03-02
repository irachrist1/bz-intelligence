import { redirect } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { getAdminSession } from '@/lib/auth/admin'
import { db } from '@/lib/db'
import { tenderSources } from '@/lib/db/schema'
import { asc } from 'drizzle-orm'
import { IngestTenderForm } from '@/components/admin/ingest-tender-form'

export default async function AdminIngestPage() {
  const adminSession = await getAdminSession()
  if (!adminSession) redirect('/dashboard/tenders')

  const sources = await db
    .select({ code: tenderSources.code, name: tenderSources.name })
    .from(tenderSources)
    .orderBy(asc(tenderSources.name))

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100 mb-1">Manual Ingest</h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Add a tender to the review queue for approval.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Ingest Tender</CardTitle>
        </CardHeader>
        <CardContent>
          <IngestTenderForm sources={sources} />
        </CardContent>
      </Card>
    </div>
  )
}
