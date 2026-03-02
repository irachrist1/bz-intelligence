import { asc } from 'drizzle-orm'
import { redirect } from 'next/navigation'
import { Badge } from '@/components/ui/badge'
import { getAdminSession } from '@/lib/auth/admin'
import { db } from '@/lib/db'
import { tenderSources } from '@/lib/db/schema'

function statusTone(status: string | null): string {
  switch (status) {
    case 'active':
      return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
    case 'failing':
      return 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300'
    case 'paused':
      return 'bg-zinc-200 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300'
    default:
      return 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
  }
}

export default async function AdminSourcesPage() {
  const adminSession = await getAdminSession()
  if (!adminSession) redirect('/dashboard/tenders')

  const sources = await db
    .select()
    .from(tenderSources)
    .orderBy(asc(tenderSources.name))

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100 mb-1">Tender Sources</h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Registry of monitored source systems and scraper states.
        </p>
      </div>

      {sources.length === 0 ? (
        <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-6 py-10 text-center text-zinc-500 dark:text-zinc-400">
          No sources configured yet.
        </div>
      ) : (
        <div className="space-y-3">
          {sources.map((source) => (
            <article
              key={source.id}
              className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4"
            >
              <div className="flex items-center justify-between gap-3 mb-1">
                <h2 className="text-sm font-medium text-zinc-900 dark:text-zinc-100">{source.name}</h2>
                <Badge className={`capitalize border-0 ${statusTone(source.scraperStatus)}`}>
                  {source.scraperStatus || 'manual'}
                </Badge>
              </div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">{source.code}</p>
              {source.url && (
                <a
                  href={source.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block mt-2 text-xs text-blue-500 hover:underline"
                >
                  {source.url}
                </a>
              )}
            </article>
          ))}
        </div>
      )}
    </div>
  )
}
