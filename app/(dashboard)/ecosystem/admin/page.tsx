import { desc, eq } from 'drizzle-orm'
import { redirect } from 'next/navigation'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { CandidateReviewActions, FeedToggle, TriggerEcosystemIngestion } from '@/components/ecosystem/admin-actions'
import { getAdminSession } from '@/lib/auth/admin'
import { db } from '@/lib/db'
import { companyCandidates, ingestionRuns, sourceFeeds } from '@/lib/db/schema'

export default async function EcosystemAdminPage() {
  const adminSession = await getAdminSession()
  if (!adminSession) redirect('/ecosystem')

  const [pendingCandidates, feeds, runs] = await Promise.all([
    db
      .select()
      .from(companyCandidates)
      .where(eq(companyCandidates.status, 'pending'))
      .orderBy(desc(companyCandidates.updatedAt))
      .limit(30),
    db.select().from(sourceFeeds).orderBy(desc(sourceFeeds.updatedAt)),
    db.select().from(ingestionRuns).orderBy(desc(ingestionRuns.startedAt)).limit(20),
  ])

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100 mb-1">Ecosystem Admin</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">Candidate review, feed control, and ingestion logs.</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary">{pendingCandidates.length} pending</Badge>
          <TriggerEcosystemIngestion />
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Candidate Review Queue</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {pendingCandidates.length === 0 ? (
            <p className="text-sm text-zinc-500 dark:text-zinc-400">No pending candidates.</p>
          ) : (
            pendingCandidates.map((candidate) => (
              <div
                key={candidate.id}
                className="rounded-xl border border-zinc-200 dark:border-zinc-800 p-3 grid grid-cols-1 xl:grid-cols-3 gap-3"
              >
                <div className="xl:col-span-2">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">{candidate.name}</p>
                    <Badge variant="outline">{candidate.industry}</Badge>
                    <Badge variant="outline">confidence {Number(candidate.confidenceScore ?? 0).toFixed(2)}</Badge>
                  </div>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 line-clamp-2">
                    {candidate.description || 'No description'}
                  </p>
                  {candidate.sourceUrl && (
                    <a
                      href={candidate.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-block mt-1 text-xs text-blue-500 hover:underline"
                    >
                      {candidate.sourceUrl}
                    </a>
                  )}
                </div>
                <CandidateReviewActions candidateId={candidate.id} />
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Source Feeds</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {feeds.length === 0 ? (
              <p className="text-sm text-zinc-500 dark:text-zinc-400">No feeds configured yet.</p>
            ) : (
              feeds.map((feed) => (
                <div key={feed.id} className="rounded-lg border border-zinc-200 dark:border-zinc-800 px-3 py-2">
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-medium line-clamp-1">{feed.url}</p>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400">
                        {feed.feedType} {feed.sectorFilter ? `· ${feed.sectorFilter}` : ''}
                      </p>
                    </div>
                    <FeedToggle feedId={feed.id} enabled={Boolean(feed.enabled)} />
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Ingestion Run Logs</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {runs.length === 0 ? (
              <p className="text-sm text-zinc-500 dark:text-zinc-400">No ingestion runs yet.</p>
            ) : (
              runs.map((run) => (
                <div
                  key={run.id}
                  className="rounded-lg border border-zinc-200 dark:border-zinc-800 px-3 py-2 flex items-center justify-between gap-3"
                >
                  <div>
                    <p className="text-sm font-medium capitalize">{run.status}</p>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">
                      found {run.itemsFound} · created {run.itemsCreated}
                    </p>
                  </div>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    {run.startedAt.toLocaleDateString('en-GB', {
                      day: 'numeric',
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
