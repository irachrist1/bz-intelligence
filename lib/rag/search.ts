import { embed } from 'ai'
import { voyage } from 'voyage-ai-provider'
import { db } from '@/lib/db'
import { knowledgeEmbeddings } from '@/lib/db/schema'
import { sql, eq } from 'drizzle-orm'

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
}

export async function searchKnowledgeBase(
  query: string,
  options: SearchOptions = {}
): Promise<SearchResult[]> {
  if (!process.env.VOYAGE_API_KEY) {
    return []
  }

  const { sectorFilter, docType, limit = 10 } = options

  // 1. Embed the query
  const { embedding } = await embed({
    model: voyage.textEmbeddingModel('voyage-3'),
    value: query,
  })

  // 2. Vector similarity search with pgvector
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
  return rows.map((row: unknown) => {
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
