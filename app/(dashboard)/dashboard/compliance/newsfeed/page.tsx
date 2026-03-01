import { db } from '@/lib/db'
import { newsItems, businessProfiles, newsReads } from '@/lib/db/schema'
import { eq, desc, and, sql } from 'drizzle-orm'
import { getSession } from '@/lib/auth/server'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { ExternalLink, Circle } from 'lucide-react'

// ── Filter bar ────────────────────────────────────────────────────────────────

const REG_BODIES = [
  { code: 'ALL', label: 'All' },
  { code: 'BNR', label: 'BNR' },
  { code: 'RRA', label: 'RRA' },
  { code: 'RDB', label: 'RDB' },
  { code: 'RISA', label: 'RISA' },
  { code: 'RURA', label: 'RURA' },
  { code: 'RSSB', label: 'RSSB' },
]

function FilterBar({ active }: { active: string }) {
  return (
    <div className="flex items-center gap-2 flex-wrap mb-6">
      {REG_BODIES.map(({ code, label }) => {
        const href = code === 'ALL' ? '/dashboard/compliance/newsfeed' : `/dashboard/compliance/newsfeed?body=${code}`
        const isActive = active === code
        return (
          <Link
            key={code}
            href={href}
            className={[
              'px-3 py-1 rounded-full text-xs font-medium border transition-colors',
              isActive
                ? 'bg-zinc-900 text-white border-zinc-900 dark:bg-zinc-100 dark:text-zinc-900 dark:border-zinc-100'
                : 'bg-white text-zinc-600 border-zinc-200 hover:border-zinc-400 hover:text-zinc-900 dark:bg-zinc-900 dark:text-zinc-400 dark:border-zinc-700 dark:hover:border-zinc-500',
            ].join(' ')}
          >
            {label}
          </Link>
        )
      })}
    </div>
  )
}

// ── Impact badge ──────────────────────────────────────────────────────────────

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

function RegBodyBadge({ code }: { code: string | null }) {
  if (!code) return null
  return <Badge variant="secondary" className="text-xs">{code}</Badge>
}

function formatDate(date: Date | null): string {
  if (!date) return ''
  return new Date(date).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

// ── News card ─────────────────────────────────────────────────────────────────

type NewsItemRow = typeof newsItems.$inferSelect

function NewsCard({ item, isRead }: { item: NewsItemRow; isRead: boolean }) {
  const isHighImpact = item.impactLevel === 'high'
  const isMediumImpact = item.impactLevel === 'medium'

  return (
    <Link
      href={`/dashboard/compliance/newsfeed/${item.id}`}
      className={[
        'block bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 transition-all hover:border-zinc-400 dark:hover:border-zinc-600 hover:shadow-sm',
        isHighImpact ? 'border-l-4 border-l-red-400 dark:border-l-red-600' : '',
        isMediumImpact ? 'border-l-4 border-l-amber-400 dark:border-l-amber-600' : '',
        isRead ? 'opacity-70' : '',
      ].join(' ')}
    >
      <div className="flex items-start gap-3">
        {/* Unread dot */}
        <div className="mt-1 shrink-0">
          {!isRead ? (
            <Circle className="h-2 w-2 fill-blue-500 text-blue-500" />
          ) : (
            <div className="h-2 w-2" /> // spacer to keep alignment
          )}
        </div>

        <div className="flex-1 min-w-0">
          {/* Badge row */}
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <RegBodyBadge code={item.regBodyCode} />
            <ImpactBadge level={item.impactLevel} />
          </div>

          {/* Title */}
          <h3 className={[
            'font-medium text-sm mb-1 leading-snug',
            isRead ? 'text-zinc-500 dark:text-zinc-400' : 'text-zinc-900 dark:text-zinc-100',
          ].join(' ')}>
            {item.title}
          </h3>

          {/* Plain summary */}
          <p className="text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed line-clamp-2">
            {item.plainSummary ?? item.summary}
          </p>

          {/* Source link */}
          {item.sourceUrl && (
            <span
              className="inline-flex items-center gap-1 text-xs text-blue-500 hover:text-blue-600 hover:underline mt-2"
              onClick={(e) => e.preventDefault()} // let the Link handle navigation
            >
              {item.sourceName ?? 'View source'}
              <ExternalLink className="h-3 w-3" />
            </span>
          )}
        </div>

        {/* Date */}
        {item.publishedAt && (
          <span className="text-xs text-zinc-400 dark:text-zinc-500 shrink-0 pt-0.5 whitespace-nowrap">
            {formatDate(item.publishedAt)}
          </span>
        )}
      </div>
    </Link>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

interface PageProps {
  searchParams: Promise<{ body?: string }>
}

export default async function NewsfeedPage({ searchParams }: PageProps) {
  const params = await searchParams
  const bodyFilter = params.body?.toUpperCase() ?? 'ALL'

  const session = await getSession()
  let profile: typeof businessProfiles.$inferSelect | null = null

  if (session?.session.activeOrganizationId) {
    const orgId = session.session.activeOrganizationId
    const rows = await db
      .select()
      .from(businessProfiles)
      .where(eq(businessProfiles.orgId, orgId))
      .limit(1)
    profile = rows[0] ?? null
  }

  // Build news query with sector personalisation
  const reviewed = eq(newsItems.isReviewed, true)
  let news: NewsItemRow[]

  if (profile?.sector) {
    const sectorOverlap = sql<boolean>`(${newsItems.sectorTags} && ARRAY[${profile.sector}]::text[] OR ${newsItems.sectorTags} IS NULL OR array_length(${newsItems.sectorTags}, 1) IS NULL)`
    if (bodyFilter !== 'ALL') {
      news = await db.select().from(newsItems)
        .where(and(reviewed, eq(newsItems.regBodyCode, bodyFilter), sectorOverlap))
        .orderBy(desc(newsItems.publishedAt)).limit(50)
    } else {
      news = await db.select().from(newsItems)
        .where(and(reviewed, sectorOverlap))
        .orderBy(desc(newsItems.publishedAt)).limit(50)
    }
  } else {
    if (bodyFilter !== 'ALL') {
      news = await db.select().from(newsItems)
        .where(and(reviewed, eq(newsItems.regBodyCode, bodyFilter)))
        .orderBy(desc(newsItems.publishedAt)).limit(50)
    } else {
      news = await db.select().from(newsItems)
        .where(reviewed)
        .orderBy(desc(newsItems.publishedAt)).limit(50)
    }
  }

  // Fetch read IDs for the current user (graceful fail if table missing)
  let readSet = new Set<string>()
  if (session?.user.id && news.length > 0) {
    try {
      const reads = await db
        .select({ newsItemId: newsReads.newsItemId })
        .from(newsReads)
        .where(eq(newsReads.userId, session.user.id))
      readSet = new Set(reads.map((r) => r.newsItemId))
    } catch {
      // newsReads table may not exist yet — degrade gracefully
    }
  }

  const unreadCount = news.filter((item) => !readSet.has(item.id)).length

  return (
    <div className="p-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="mb-5">
        <div className="flex items-end justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100 mb-1">
              Regulatory Newsfeed
            </h1>
            <p className="text-zinc-500 dark:text-zinc-400 text-sm">
              Latest regulatory updates affecting businesses in Rwanda
            </p>
          </div>
          {news.length > 0 && unreadCount > 0 && (
            <span className="text-xs text-zinc-400 dark:text-zinc-500">
              {unreadCount} unread
            </span>
          )}
        </div>
      </div>

      {/* Personalisation note */}
      {profile?.sector && (
        <div className="mb-4 flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-lg px-3 py-2">
          <span className="text-zinc-400">&#9679;</span>
          Showing updates relevant to your sector
          {profile.bizName ? ` (${profile.bizName})` : ''}.{' '}
          <Link href="/onboarding" className="text-blue-500 hover:underline">
            Edit profile
          </Link>
        </div>
      )}

      {/* Filter bar */}
      <FilterBar active={bodyFilter} />

      {/* News list */}
      {news.length === 0 ? (
        <div className="text-center py-16 text-zinc-400 dark:text-zinc-600">
          <div className="text-4xl mb-3">&#128240;</div>
          <p className="text-sm font-medium mb-1">No news items found</p>
          <p className="text-xs text-zinc-400 dark:text-zinc-600">
            {bodyFilter !== 'ALL'
              ? `No reviewed updates for ${bodyFilter} yet.`
              : 'No reviewed regulatory updates yet. Check back soon.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {news.map((item) => (
            <NewsCard key={item.id} item={item} isRead={readSet.has(item.id)} />
          ))}
        </div>
      )}
    </div>
  )
}
