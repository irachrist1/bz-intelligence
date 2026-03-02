import Link from 'next/link'
import { notFound } from 'next/navigation'
import { and, eq } from 'drizzle-orm'
import { ArrowLeft, Calendar, ExternalLink, Wallet } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth/server'
import { tenderSaves, tenders } from '@/lib/db/schema'
import { TenderDetailActions } from '@/components/tenders/tender-detail-actions'

type TenderDetails = {
  id: string
  title: string
  issuingOrg: string
  source: string
  sourceUrl: string | null
  tenderType: string | null
  fundingSource: string | null
  categoryTags: string[] | null
  description: string | null
  aiSummary: string | null
  eligibilityNotes: string | null
  estimatedValueUsd: number | null
  deadlineSubmission: Date | null
  deadlineClarification: Date | null
  datePosted: Date | null
  documents: unknown
}

interface PageProps {
  params: Promise<{ id: string }>
}

function formatDate(value: Date | null): string {
  if (!value) return 'N/A'
  return new Date(value).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

function stageLabel(stage: string | null): string {
  switch (stage) {
    case 'go':
      return 'Go'
    case 'in_prep':
      return 'In Preparation'
    case 'submitted':
      return 'Submitted'
    case 'won':
      return 'Won'
    case 'lost':
      return 'Lost'
    case 'no_go':
      return 'No-Go'
    case 'watching':
      return 'Watching'
    default:
      return 'New'
  }
}

function normalizeDocuments(value: unknown): { name?: string; url?: string; type?: string }[] {
  if (!Array.isArray(value)) return []
  return value.filter((item): item is { name?: string; url?: string; type?: string } => typeof item === 'object' && item !== null)
}

export default async function TenderDetailPage({ params }: PageProps) {
  const { id } = await params
  const session = await getSession()
  const orgId = session?.session.activeOrganizationId || session?.user.id || null

  let item: TenderDetails | null = null

  const rows = await db
    .select({
      id: tenders.id,
      title: tenders.title,
      issuingOrg: tenders.issuingOrg,
      source: tenders.source,
      sourceUrl: tenders.sourceUrl,
      tenderType: tenders.tenderType,
      fundingSource: tenders.fundingSource,
      categoryTags: tenders.categoryTags,
      description: tenders.description,
      aiSummary: tenders.aiSummary,
      eligibilityNotes: tenders.eligibilityNotes,
      estimatedValueUsd: tenders.estimatedValueUsd,
      deadlineSubmission: tenders.deadlineSubmission,
      deadlineClarification: tenders.deadlineClarification,
      datePosted: tenders.datePosted,
      documents: tenders.documents,
    })
    .from(tenders)
    .where(eq(tenders.id, id))
    .limit(1)

  item = rows[0] ?? null

  if (!item) notFound()

  let saveRow: { stage: string | null; notes: string | null; assignedTo: string | null } | null = null
  if (orgId) {
    try {
      const saveRows = await db
        .select({
          stage: tenderSaves.stage,
          notes: tenderSaves.notes,
          assignedTo: tenderSaves.assignedTo,
        })
        .from(tenderSaves)
        .where(and(eq(tenderSaves.orgId, orgId), eq(tenderSaves.tenderId, id)))
        .limit(1)
      saveRow = saveRows[0] ?? null
    } catch {
      saveRow = null
    }
  }

  const documents = normalizeDocuments(item.documents)

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <Link
        href="/dashboard/tenders"
        className="inline-flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200 mb-6 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to tender feed
      </Link>

      <article className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden">
        <div className="p-6 sm:p-8">
          <div className="flex items-center gap-2 mb-3 flex-wrap">
            <Badge variant="secondary" className="capitalize">{item.source.replace('_', ' ')}</Badge>
            <Badge variant="outline">{stageLabel(saveRow?.stage ?? null)}</Badge>
            {item.fundingSource && <Badge variant="outline">{item.fundingSource}</Badge>}
            {item.tenderType && <Badge variant="outline" className="uppercase">{item.tenderType}</Badge>}
          </div>

          <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100 mb-2 leading-snug">{item.title}</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-6">{item.issuingOrg}</p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
            <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 p-3">
              <p className="text-xs text-zinc-400 mb-1">Posted</p>
              <p className="text-sm text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5" />
                {formatDate(item.datePosted)}
              </p>
            </div>
            <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 p-3">
              <p className="text-xs text-zinc-400 mb-1">Submission deadline</p>
              <p className="text-sm text-zinc-700 dark:text-zinc-300">{formatDate(item.deadlineSubmission)}</p>
            </div>
            <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 p-3">
              <p className="text-xs text-zinc-400 mb-1">Estimated value</p>
              <p className="text-sm text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
                <Wallet className="h-3.5 w-3.5" />
                {typeof item.estimatedValueUsd === 'number' ? `$${item.estimatedValueUsd.toLocaleString()}` : 'N/A'}
              </p>
            </div>
          </div>

          <section className="mb-6">
            <h2 className="text-sm font-medium text-zinc-900 dark:text-zinc-100 mb-2">Summary</h2>
            <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
              {item.aiSummary || item.description || 'No summary available yet.'}
            </p>
          </section>

          <section className="mb-6">
            <h2 className="text-sm font-medium text-zinc-900 dark:text-zinc-100 mb-2">Eligibility Snapshot</h2>
            <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
              {item.eligibilityNotes || 'Eligibility extraction not yet available for this tender.'}
            </p>
          </section>

          {item.categoryTags && item.categoryTags.length > 0 && (
            <section className="mb-6">
              <h2 className="text-sm font-medium text-zinc-900 dark:text-zinc-100 mb-2">Category tags</h2>
              <div className="flex gap-1.5 flex-wrap">
                {item.categoryTags.map((tag) => (
                  <Badge key={tag} variant="outline" className="capitalize">{tag}</Badge>
                ))}
              </div>
            </section>
          )}

          <section className="mb-6">
            <h2 className="text-sm font-medium text-zinc-900 dark:text-zinc-100 mb-2">Timeline</h2>
            <div className="text-sm text-zinc-600 dark:text-zinc-400 space-y-1">
              <p>Posted: {formatDate(item.datePosted)}</p>
              <p>Clarification deadline: {formatDate(item.deadlineClarification)}</p>
              <p>Submission deadline: {formatDate(item.deadlineSubmission)}</p>
            </div>
          </section>

          {saveRow?.notes && (
            <section className="mb-6">
              <h2 className="text-sm font-medium text-zinc-900 dark:text-zinc-100 mb-2">Internal notes</h2>
              <p className="text-sm text-zinc-600 dark:text-zinc-400 whitespace-pre-wrap">{saveRow.notes}</p>
            </section>
          )}

          <section className="border-t border-zinc-100 dark:border-zinc-800 pt-5 flex items-center justify-between flex-wrap gap-3">
            {item.sourceUrl ? (
              <a
                href={item.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-sm text-blue-500 hover:underline"
              >
                View original source
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            ) : (
              <span className="text-sm text-zinc-500 dark:text-zinc-400">No source link available</span>
            )}
            <TenderDetailActions
              tenderId={item.id}
              initialStage={saveRow?.stage ?? null}
              initialSaved={!!saveRow}
            />
          </section>

          {documents.length > 0 && (
            <section className="mt-6 border-t border-zinc-100 dark:border-zinc-800 pt-5">
              <h2 className="text-sm font-medium text-zinc-900 dark:text-zinc-100 mb-2">Documents</h2>
              <div className="space-y-2">
                {documents.map((doc, index) => (
                  <a
                    key={`${doc.url ?? 'doc'}-${index}`}
                    href={doc.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block rounded-lg border border-zinc-200 dark:border-zinc-800 px-3 py-2 text-sm text-zinc-600 dark:text-zinc-300 hover:border-zinc-400"
                  >
                    {doc.name || `Document ${index + 1}`}
                  </a>
                ))}
              </div>
            </section>
          )}
        </div>
      </article>
    </div>
  )
}
