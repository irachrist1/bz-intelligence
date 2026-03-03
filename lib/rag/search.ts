import { embed } from 'ai'
import { voyage } from 'voyage-ai-provider'
import { db } from '@/lib/db'
import { techCompanies } from '@/lib/db/schema'
import { and, eq, ilike, or, sql } from 'drizzle-orm'

export type SearchResult = {
  id: string
  content: string
  sourceTitle: string | null
  sourceUrl: string | null
  sourceDate: string | null
  regBody: string | null
  docType: string | null
  lastVerifiedAt: Date | null
  similarity: number
}

type SearchOptions = {
  sectorFilter?: string
  docType?: string
  limit?: number
  includeEcosystem?: boolean
}

function companySimilarity(query: string, text: string): number {
  const tokens = query
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((token) => token.length > 2)

  if (tokens.length === 0) return 0.55
  const matches = tokens.reduce((sum, token) => sum + (text.includes(token) ? 1 : 0), 0)
  return Math.min(0.99, 0.55 + (matches / tokens.length) * 0.4)
}

async function searchTechCompanies(
  query: string,
  options: Pick<SearchOptions, 'sectorFilter' | 'limit'>
): Promise<SearchResult[]> {
  const tokens = query
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((token) => token.length > 2)

  if (tokens.length === 0) return []

  const textConditions = tokens.flatMap((token) => [
    ilike(techCompanies.name, `%${token}%`),
    ilike(techCompanies.description, `%${token}%`),
    ilike(techCompanies.industry, `%${token}%`),
  ])

  const where = and(
    eq(techCompanies.status, 'verified'),
    options.sectorFilter
      ? ilike(techCompanies.industry, `%${options.sectorFilter}%`)
      : undefined,
    or(...textConditions)!
  )

  const rows = await db
    .select({
      id: techCompanies.id,
      name: techCompanies.name,
      industry: techCompanies.industry,
      description: techCompanies.description,
      score: techCompanies.score,
      website: techCompanies.website,
      updatedAt: techCompanies.updatedAt,
    })
    .from(techCompanies)
    .where(where)
    .limit(Math.max(5, options.limit ?? 10))

  return rows
    .map((row) => {
      const summary = `${row.name} (${row.industry}). ${row.description || 'No description.'} Score ${Number(row.score ?? 0).toFixed(2)}.`
      const similarity = companySimilarity(query, summary.toLowerCase())
      return {
        id: `company-${row.id}`,
        content: summary,
        sourceTitle: `${row.name} profile`,
        sourceUrl: row.website,
        sourceDate: row.updatedAt ? row.updatedAt.toISOString().slice(0, 10) : null,
        regBody: null,
        docType: 'company_profile',
        lastVerifiedAt: row.updatedAt,
        similarity,
      }
    })
    .sort((a, b) => b.similarity - a.similarity)
}

export async function searchKnowledgeBase(
  query: string,
  options: SearchOptions = {}
): Promise<SearchResult[]> {
  const { sectorFilter, docType, limit = 10, includeEcosystem = false } = options
  const merged: SearchResult[] = []

  if (process.env.VOYAGE_API_KEY) {
    const { embedding } = await embed({
      model: voyage.textEmbeddingModel('voyage-3'),
      value: query,
    })

    const embeddingStr = `[${embedding.join(',')}]`
    const baseConditions = sql`is_current = true`
    const docTypeCondition = docType ? sql`AND doc_type = ${docType}` : sql``
    const sectorCondition = sectorFilter
      ? sql`AND (${sectorFilter} = ANY(sector_tags) OR sector_tags IS NULL)`
      : sql``

    const results = await db.execute(sql`
      SELECT
        id,
        content,
        source_title,
        source_url,
        source_date,
        reg_body,
        doc_type,
        last_verified_at,
        1 - (embedding <=> ${embeddingStr}::vector) AS similarity
      FROM knowledge_embeddings
      WHERE ${baseConditions}
        ${docTypeCondition}
        ${sectorCondition}
      ORDER BY embedding <=> ${embeddingStr}::vector
      LIMIT ${limit}
    `)

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const rows: unknown[] = (results as any).rows ?? (results as unknown as unknown[])
    merged.push(
      ...rows.map((row: unknown) => {
        const r = row as Record<string, unknown>
        return {
          id: r.id as string,
          content: r.content as string,
          sourceTitle: r.source_title as string | null,
          sourceUrl: r.source_url as string | null,
          sourceDate: r.source_date as string | null,
          regBody: r.reg_body as string | null,
          docType: r.doc_type as string | null,
          lastVerifiedAt: r.last_verified_at ? new Date(r.last_verified_at as string) : null,
          similarity: r.similarity as number,
        }
      })
    )
  }

  if (includeEcosystem) {
    const companyResults = await searchTechCompanies(query, { sectorFilter, limit })
    merged.push(...companyResults)
  }

  const deduped = new Map<string, SearchResult>()
  for (const item of merged) {
    const key = `${item.sourceTitle ?? item.id}:${item.content.slice(0, 64)}`
    const existing = deduped.get(key)
    if (!existing || item.similarity > existing.similarity) deduped.set(key, item)
  }

  return [...deduped.values()].sort((a, b) => b.similarity - a.similarity).slice(0, limit)
}

export function formatCitations(results: SearchResult[]) {
  return results
    .filter((r) => r.sourceTitle)
    .map((r) => ({
      title: r.sourceTitle,
      url: r.sourceUrl,
      date: r.sourceDate,
      regBody: r.regBody,
      lastVerified: r.lastVerifiedAt?.toISOString().split('T')[0],
    }))
}
