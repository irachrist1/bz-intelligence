import Link from 'next/link'
import { and, asc, desc, eq, ilike, inArray, or } from 'drizzle-orm'
import { unstable_cache } from 'next/cache'
import { Badge } from '@/components/ui/badge'
import { Clock3, ExternalLink } from 'lucide-react'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth/server'
import { tenderSaves, tenders } from '@/lib/db/schema'
import { SaveTenderButton } from '@/components/tenders/save-tender-button'
import { TenderFilterBar } from '@/components/tenders/tender-filter-bar'

export const revalidate = 300

type TenderLike = {
  id: string
  title: string
  issuingOrg: string
  source: string
  sourceUrl: string | null
  fundingSource: string | null
  categoryTags: string[] | null
  aiSummary: string | null
  datePosted: Date | null
  deadlineSubmission: Date | null
  estimatedValueUsd: number | null
}

const getCachedTenders = unstable_cache(
  async (source: string, query: string): Promise<TenderLike[]> => {
    const conditions = [eq(tenders.reviewStatus, 'approved'), eq(tenders.status, 'open')]
    if (source !== 'all') conditions.push(eq(tenders.source, source))
    if (query) {
      conditions.push(
        or(
          ilike(tenders.title, `%${query}%`),
          ilike(tenders.description, `%${query}%`),
          ilike(tenders.issuingOrg, `%${query}%`)
        )!
      )
    }

    return db
      .select({
        id: tenders.id,
        title: tenders.title,
        issuingOrg: tenders.issuingOrg,
        source: tenders.source,
        sourceUrl: tenders.sourceUrl,
        fundingSource: tenders.fundingSource,
        categoryTags: tenders.categoryTags,
        aiSummary: tenders.aiSummary,
        datePosted: tenders.datePosted,
        deadlineSubmission: tenders.deadlineSubmission,
        estimatedValueUsd: tenders.estimatedValueUsd,
      })
      .from(tenders)
      .where(and(...conditions))
      .orderBy(asc(tenders.deadlineSubmission), desc(tenders.datePosted))
      .limit(100)
  },
  ['tender-feed'],
  { revalidate: 300, tags: ['tenders'] }
)

function formatDate(value: Date | null): string {
  if (!value) return 'N/A'
  return new Date(value).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

function daysUntil(value: Date | null): number | null {
  if (!value) return null
  const now = new Date()
  const diffMs = new Date(value).getTime() - now.getTime()
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24))
}

function urgencyTone(deadline: Date | null): string {
  const days = daysUntil(deadline)
  if (days === null) return 'text-zinc-500'
  if (days < 0) return 'text-zinc-500'
  if (days < 7) return 'text-red-600 dark:text-red-400'
  if (days <= 21) return 'text-amber-600 dark:text-amber-400'
  return 'text-zinc-600 dark:text-zinc-300'
}

function stageBadge(stage: string | null): { label: string; className: string } {
  switch (stage) {
    case 'go':
      return { label: 'Go', className: 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300' }
    case 'in_prep':
      return { label: 'In Prep', className: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300' }
    case 'submitted':
      return { label: 'Submitted', className: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300' }
    case 'won':
      return { label: 'Won', className: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300' }
    case 'lost':
      return { label: 'Lost', className: 'bg-zinc-200 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300' }
    case 'no_go':
      return { label: 'Passed', className: 'bg-zinc-200 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300' }
    case 'watching':
      return { label: 'Saved', className: 'bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-300' }
    default:
      return { label: 'New', className: 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300' }
  }
}

interface PageProps {
  searchParams: Promise<{ source?: string; q?: string }>
}

export default async function TenderFeedPage({ searchParams }: PageProps) {
  const params = await searchParams
  const source = (params.source ?? 'all').toLowerCase()
  const query = params.q?.trim() ?? ''
  const session = await getSession()
  const orgId = session?.session.activeOrganizationId || session?.user.id || ''

  const items = await getCachedTenders(source, query)

  const ids = items.map((item) => item.id)
  const stageByTenderId = new Map<string, string>()
  if (orgId && ids.length > 0) {
    const saves = await db
      .select({ tenderId: tenderSaves.tenderId, stage: tenderSaves.stage })
      .from(tenderSaves)
      .where(and(eq(tenderSaves.orgId, orgId), inArray(tenderSaves.tenderId, ids)))

    for (const save of saves) stageByTenderId.set(save.tenderId, save.stage || 'watching')
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-6 flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100 mb-1">Tender Feed</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Open procurement opportunities matched to your team.
          </p>
        </div>
        <Badge variant="secondary">{items.length} open</Badge>
      </div>

      <div className="mb-4">
        <TenderFilterBar source={source} query={query} />
      </div>

      {items.length === 0 ? (
        <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-6 py-10 text-center text-zinc-500 dark:text-zinc-400">
          <p className="font-medium text-zinc-700 dark:text-zinc-300 mb-1">No tenders yet</p>
          <p className="text-sm">Use the admin ingest flow to publish your first opportunities.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((item) => {
            const stage = stageByTenderId.get(item.id) ?? null
            const stageMeta = stageBadge(stage)
            const deadlineDays = daysUntil(item.deadlineSubmission)
            return (
              <article
                key={item.id}
                className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 hover:border-zinc-400 dark:hover:border-zinc-600 transition-colors"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <Badge variant="secondary" className="text-xs capitalize">{item.source.replace('_', ' ')}</Badge>
                      <Badge className={`text-xs font-medium border-0 ${stageMeta.className}`}>{stageMeta.label}</Badge>
                      {item.fundingSource && <Badge variant="outline" className="text-xs">{item.fundingSource}</Badge>}
                    </div>
                    <Link href={`/dashboard/tenders/${item.id}`} className="hover:underline">
                      <h2 className="text-sm font-medium text-zinc-900 dark:text-zinc-100 leading-snug">{item.title}</h2>
                    </Link>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">{item.issuingOrg}</p>
                    <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-2 line-clamp-2">
                      {item.aiSummary || 'No summary available yet.'}
                    </p>
                    {item.categoryTags && item.categoryTags.length > 0 && (
                      <div className="mt-2 flex gap-1.5 flex-wrap">
                        {item.categoryTags.slice(0, 5).map((tag) => (
                          <Badge key={`${item.id}-${tag}`} variant="outline" className="text-[11px] capitalize">{tag}</Badge>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="shrink-0 text-right space-y-1.5">
                    <p className="text-xs text-zinc-400">Posted {formatDate(item.datePosted)}</p>
                    <p className={`text-xs font-medium ${urgencyTone(item.deadlineSubmission)}`}>
                      <Clock3 className="h-3 w-3 inline mr-1" />
                      {item.deadlineSubmission
                        ? `Deadline ${formatDate(item.deadlineSubmission)}${deadlineDays !== null && deadlineDays >= 0 ? ` (${deadlineDays}d)` : ''}`
                        : 'Deadline unavailable'}
                    </p>
                    {typeof item.estimatedValueUsd === 'number' && (
                      <p className="text-xs text-zinc-500 dark:text-zinc-400">
                        Est. ${item.estimatedValueUsd.toLocaleString()}
                      </p>
                    )}
                    {item.sourceUrl && (
                      <span className="inline-flex items-center gap-1 text-xs text-blue-500">
                        Source
                        <ExternalLink className="h-3 w-3" />
                      </span>
                    )}
                    <div className="pt-1">
                      <SaveTenderButton tenderId={item.id} initiallySaved={Boolean(stage)} compact />
                    </div>
                  </div>
                </div>
              </article>
            )
          })}
        </div>
      )}
    </div>
  )
}
