import { db } from '@/lib/db'
import { newsItems } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, ExternalLink, Calendar, Building2 } from 'lucide-react'
import { MarkReadButton } from './mark-read-button'

function formatDate(date: Date | null): string {
  if (!date) return ''
  return new Date(date).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

function ImpactBadge({ level }: { level: string | null }) {
  if (!level) return null
  const styles: Record<string, string> = {
    high: 'border-red-200 text-red-600 dark:border-red-800 dark:text-red-400',
    medium: 'border-amber-200 text-amber-600 dark:border-amber-800 dark:text-amber-400',
    low: 'border-zinc-200 text-zinc-500 dark:border-zinc-700 dark:text-zinc-400',
  }
  return (
    <Badge variant="outline" className={`text-xs ${styles[level] ?? styles.low}`}>
      {level} impact
    </Badge>
  )
}

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function NewsArticlePage({ params }: PageProps) {
  const { id } = await params

  const rows = await db.select().from(newsItems).where(eq(newsItems.id, id)).limit(1)
  const item = rows[0]
  if (!item) notFound()

  return (
    <div className="p-6 max-w-3xl mx-auto">
      {/* Back link */}
      <Link
        href="/dashboard/compliance/newsfeed"
        className="inline-flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200 mb-6 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to newsfeed
      </Link>

      {/* Article */}
      <article className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden">
        {/* Impact stripe */}
        {item.impactLevel === 'high' && (
          <div className="h-1 w-full bg-red-400 dark:bg-red-600" />
        )}
        {item.impactLevel === 'medium' && (
          <div className="h-1 w-full bg-amber-400 dark:bg-amber-600" />
        )}

        <div className="p-6 sm:p-8">
          {/* Meta row */}
          <div className="flex items-center gap-2 mb-4 flex-wrap">
            {item.regBodyCode && (
              <Badge variant="secondary" className="text-xs">{item.regBodyCode}</Badge>
            )}
            <ImpactBadge level={item.impactLevel} />
            {item.sectorTags && item.sectorTags.length > 0 && (
              <>
                {item.sectorTags.map((tag) => (
                  <Badge key={tag} variant="outline" className="text-xs capitalize">{tag}</Badge>
                ))}
              </>
            )}
          </div>

          {/* Title */}
          <h1 className="text-xl sm:text-2xl font-semibold text-zinc-900 dark:text-zinc-100 mb-4 leading-snug">
            {item.title}
          </h1>

          {/* Date + source meta */}
          <div className="flex items-center gap-4 text-xs text-zinc-400 dark:text-zinc-500 mb-6 flex-wrap">
            {item.publishedAt && (
              <span className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {formatDate(item.publishedAt)}
              </span>
            )}
            {item.sourceName && (
              <span className="flex items-center gap-1">
                <Building2 className="h-3 w-3" />
                {item.sourceName}
              </span>
            )}
          </div>

          {/* Plain language summary */}
          {item.plainSummary && (
            <div className="mb-5">
              <p className="text-xs font-medium text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mb-2">
                Plain language summary
              </p>
              <p className="text-base text-zinc-700 dark:text-zinc-300 leading-relaxed">
                {item.plainSummary}
              </p>
            </div>
          )}

          {/* Original summary */}
          {item.summary !== item.plainSummary && (
            <div className="border-t border-zinc-100 dark:border-zinc-800 pt-5 mb-5">
              <p className="text-xs font-medium text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mb-2">
                Original summary
              </p>
              <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
                {item.summary}
              </p>
            </div>
          )}

          {/* Source link */}
          {item.sourceUrl && (
            <div className="border-t border-zinc-100 dark:border-zinc-800 pt-5 flex items-center justify-between flex-wrap gap-3">
              <a
                href={item.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-sm text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300 hover:underline transition-colors"
              >
                View original source
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
              <MarkReadButton newsItemId={item.id} />
            </div>
          )}
          {!item.sourceUrl && (
            <div className="border-t border-zinc-100 dark:border-zinc-800 pt-5 flex justify-end">
              <MarkReadButton newsItemId={item.id} />
            </div>
          )}
        </div>
      </article>
    </div>
  )
}
