import { and, eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import { companyCandidates, ingestionRuns, sourceFeeds, techCompanies } from '@/lib/db/schema'

type FeedStatus = 'success' | 'partial' | 'failed' | 'running'
type TriggerType = 'cron' | 'manual'

type ParsedRssItem = {
  title: string
  link: string
  pubDate: string
  description: string
}

type SourceConfidence = {
  score: number
  sourceType: 'official' | 'credible_media' | 'secondary'
}

const OFFICIAL_HOST_PATTERNS = [
  'gov.rw',
  'bnr.rw',
  'rdb.rw',
  'rra.gov.rw',
  'rura.rw',
  'risa.gov.rw',
  'rssb.rw',
]

const CREDIBLE_HOST_PATTERNS = [
  'newtimes',
  'ktpress',
  'africanews',
  'techcabal',
  'allafrica',
  'bloomberg',
  'reuters',
  'forbes',
]

export const DEFAULT_ECOSYSTEM_FEEDS = [
  {
    url: 'https://news.google.com/rss/search?q=Rwanda+startup&hl=en-US&gl=US&ceid=US:en',
    feedType: 'rss',
    sectorFilter: 'general',
  },
  {
    url: 'https://news.google.com/rss/search?q=Rwanda+fintech&hl=en-US&gl=US&ceid=US:en',
    feedType: 'rss',
    sectorFilter: 'FinTech',
  },
  {
    url: 'https://news.google.com/rss/search?q=Rwanda+healthtech&hl=en-US&gl=US&ceid=US:en',
    feedType: 'rss',
    sectorFilter: 'HealthTech',
  },
  {
    url: 'https://news.google.com/rss/search?q=Rwanda+cleantech&hl=en-US&gl=US&ceid=US:en',
    feedType: 'rss',
    sectorFilter: 'CleanTech',
  },
] as const

function decodeXmlEntities(input: string): string {
  return input
    .replaceAll('&amp;', '&')
    .replaceAll('&lt;', '<')
    .replaceAll('&gt;', '>')
    .replaceAll('&quot;', '"')
    .replaceAll('&#39;', "'")
}

function extractTagValue(block: string, tag: string): string {
  const directRegex = new RegExp(`<${tag}>([\\s\\S]*?)<\\/${tag}>`, 'i')
  const cdataRegex = new RegExp(`<${tag}><!\\[CDATA\\[([\\s\\S]*?)\\]\\]><\\/${tag}>`, 'i')
  const cdataMatch = block.match(cdataRegex)
  if (cdataMatch?.[1]) return decodeXmlEntities(cdataMatch[1].trim())
  const directMatch = block.match(directRegex)
  if (directMatch?.[1]) return decodeXmlEntities(directMatch[1].trim())
  return ''
}

function parseRss(xml: string): ParsedRssItem[] {
  const items = xml.match(/<item[\s\S]*?<\/item>/gi) || []
  return items.map((item) => ({
    title: extractTagValue(item, 'title'),
    link: extractTagValue(item, 'link'),
    pubDate: extractTagValue(item, 'pubDate'),
    description: extractTagValue(item, 'description'),
  }))
}

function inferIndustry(text: string): string {
  const lower = text.toLowerCase()
  if (/(fintech|payment|bank|finance|wallet|insurtech)/.test(lower)) return 'FinTech'
  if (/(agri|farm|agtech|agriculture)/.test(lower)) return 'AgriTech'
  if (/(health|clinic|hospital|medtech|telemedicine)/.test(lower)) return 'HealthTech'
  if (/(edtech|education|school|learning|student)/.test(lower)) return 'EdTech'
  if (/(clean|solar|battery|energy|climate|water)/.test(lower)) return 'CleanTech'
  if (/(transport|mobility|logistics|ev|motorcycle|transit)/.test(lower)) return 'TransportTech'
  return 'FinTech'
}

function guessCompanyName(title: string): string {
  const trimmed = title
    .replace(/\s+-\s+[^-]+$/, '')
    .replace(/^Rwanda\s+/i, '')
    .replace(/\b(startup|start-ups|companies|company|tech)\b/gi, '')
    .replace(/\s{2,}/g, ' ')
    .trim()

  if (!trimmed || trimmed.length < 3) return title.slice(0, 120)
  return trimmed
}

function toSlug(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 120)
}

function classifySourceConfidence(url: string): SourceConfidence {
  const lowerUrl = url.toLowerCase()
  if (OFFICIAL_HOST_PATTERNS.some((host) => lowerUrl.includes(host))) {
    return { score: 0.95, sourceType: 'official' }
  }
  if (CREDIBLE_HOST_PATTERNS.some((host) => lowerUrl.includes(host))) {
    return { score: 0.78, sourceType: 'credible_media' }
  }
  return { score: 0.62, sourceType: 'secondary' }
}

async function markRunComplete(
  runId: string,
  status: FeedStatus,
  itemsFound: number,
  itemsCreated: number,
  errorLog?: string
) {
  await db
    .update(ingestionRuns)
    .set({
      status,
      itemsFound,
      itemsCreated,
      errorLog: errorLog || null,
      completedAt: new Date(),
    })
    .where(eq(ingestionRuns.id, runId))
}

export async function bootstrapEcosystemFeeds() {
  for (const feed of DEFAULT_ECOSYSTEM_FEEDS) {
    await db.insert(sourceFeeds).values(feed).onConflictDoNothing()
  }
}

async function ingestFeed(feed: typeof sourceFeeds.$inferSelect) {
  const run = await db
    .insert(ingestionRuns)
    .values({
      feedId: feed.id,
      status: 'running',
      itemsFound: 0,
      itemsCreated: 0,
      startedAt: new Date(),
    })
    .returning({ id: ingestionRuns.id })
  const runId = run[0]?.id
  if (!runId) throw new Error('Could not create ingestion run record.')

  try {
    const response = await fetch(feed.url)
    if (!response.ok) throw new Error(`Feed fetch failed: ${response.status} ${response.statusText}`)
    const xml = await response.text()
    const records = parseRss(xml).slice(0, 80)
    let created = 0

    for (const record of records) {
      if (!record.title || !record.link) continue
      const companyName = guessCompanyName(record.title)
      const slug = toSlug(companyName)
      const industry = inferIndustry(`${record.title} ${record.description} ${feed.sectorFilter ?? ''}`)
      const confidence = classifySourceConfidence(record.link)

      const existing = await db
        .select({ id: companyCandidates.id, confidenceScore: companyCandidates.confidenceScore })
        .from(companyCandidates)
        .where(eq(companyCandidates.slug, slug))
        .limit(1)

      if (existing.length > 0) {
        await db
          .update(companyCandidates)
          .set({
            name: companyName,
            industry,
            description: record.description || record.title,
            confidenceScore: Math.max(Number(existing[0].confidenceScore ?? 0), confidence.score),
            sourceUrl: record.link,
            sourceType: confidence.sourceType,
            updatedAt: new Date(),
          })
          .where(eq(companyCandidates.id, existing[0].id))
      } else {
        await db.insert(companyCandidates).values({
          name: companyName,
          slug,
          industry,
          description: record.description || record.title,
          confidenceScore: confidence.score,
          sourceUrl: record.link,
          sourceType: confidence.sourceType,
          status: 'pending',
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        created += 1
      }
    }

    await markRunComplete(runId, 'success', records.length, created)
    await db
      .update(sourceFeeds)
      .set({ lastFetchedAt: new Date(), updatedAt: new Date() })
      .where(eq(sourceFeeds.id, feed.id))

    return { itemsFound: records.length, itemsCreated: created, failed: false }
  } catch (error) {
    await markRunComplete(runId, 'failed', 0, 0, error instanceof Error ? error.message : 'Unknown error')
    await db
      .update(sourceFeeds)
      .set({ lastFetchedAt: new Date(), updatedAt: new Date() })
      .where(eq(sourceFeeds.id, feed.id))
    return { itemsFound: 0, itemsCreated: 0, failed: true }
  }
}

export async function runEcosystemIngestion(trigger: TriggerType = 'manual') {
  await bootstrapEcosystemFeeds()
  const feeds = await db.select().from(sourceFeeds).where(eq(sourceFeeds.enabled, true))

  let itemsFound = 0
  let itemsCreated = 0
  let failedFeeds = 0

  for (const feed of feeds) {
    const result = await ingestFeed(feed)
    itemsFound += result.itemsFound
    itemsCreated += result.itemsCreated
    if (result.failed) failedFeeds += 1
  }

  const status: FeedStatus =
    failedFeeds === 0 ? 'success' : failedFeeds < feeds.length ? 'partial' : 'failed'

  return {
    ok: status !== 'failed',
    trigger,
    status,
    feedsProcessed: feeds.length,
    itemsFound,
    itemsCreated,
    failedFeeds,
  }
}

export async function reviewCandidate(
  candidateId: string,
  decision: 'verified' | 'rejected',
  reviewerNotes?: string
) {
  const rows = await db
    .select()
    .from(companyCandidates)
    .where(and(eq(companyCandidates.id, candidateId), eq(companyCandidates.status, 'pending')))
    .limit(1)
  const candidate = rows[0]
  if (!candidate) return { ok: false, message: 'Candidate not found.' }

  await db
    .update(companyCandidates)
    .set({
      status: decision,
      reviewerNotes: reviewerNotes || null,
      reviewedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(companyCandidates.id, candidate.id))

  if (decision === 'verified') {
    await db
      .insert(techCompanies)
      .values({
        name: candidate.name,
        slug: candidate.slug,
        industry: candidate.industry,
        description: candidate.description,
        foundedYear: candidate.foundedYear,
        teamSize: candidate.teamSize,
        revenueRange: candidate.revenueRange,
        impactMetric: candidate.impactMetric,
        score: candidate.score,
        status: 'verified',
        website: candidate.website,
        logoUrl: candidate.logoUrl,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: techCompanies.slug,
        set: {
          name: candidate.name,
          industry: candidate.industry,
          description: candidate.description,
          foundedYear: candidate.foundedYear,
          teamSize: candidate.teamSize,
          revenueRange: candidate.revenueRange,
          impactMetric: candidate.impactMetric,
          score: candidate.score,
          website: candidate.website,
          logoUrl: candidate.logoUrl,
          status: 'verified',
          updatedAt: new Date(),
        },
      })
  }

  return { ok: true }
}
