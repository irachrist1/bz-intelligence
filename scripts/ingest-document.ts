/**
 * Knowledge base ingestion script.
 * Run with: npx tsx scripts/ingest-document.ts
 * Re-embed from scratch: npx tsx scripts/ingest-document.ts --clear
 *
 * Reads documents from scripts/knowledge-base-seed.ts, chunks them,
 * embeds via Voyage AI, and inserts into knowledge_embeddings.
 */

import { readFileSync } from 'fs'
import { join } from 'path'

// Load .env.local before anything else
try {
  const envFile = readFileSync(join(process.cwd(), '.env.local'), 'utf8')
  for (const line of envFile.split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eqIdx = trimmed.indexOf('=')
    if (eqIdx === -1) continue
    const key = trimmed.slice(0, eqIdx).trim()
    const val = trimmed.slice(eqIdx + 1).trim()
    if (key && !(key in process.env)) process.env[key] = val
  }
} catch {}

import { neon } from '@neondatabase/serverless'
import { embed } from 'ai'
import { voyage } from 'voyage-ai-provider'

export type DocType = 'regulation' | 'company_profile' | 'sector_report' | 'guideline'

export type DocumentInput = {
  title: string
  sourceUrl: string
  sourceDate: string // YYYY-MM-DD
  regBody: string   // 'RDB' | 'RRA' | 'BNR' | 'RURA' | 'RISA' | 'RSSB'
  docType: DocType
  sectorTags: string[]
  content: string   // full text, will be chunked
}

// ── Chunking ──────────────────────────────────────────────────────────────

function chunkText(text: string, chunkWords = 300, overlapWords = 50): string[] {
  const words = text.split(/\s+/).filter(Boolean)
  const chunks: string[] = []
  let i = 0
  while (i < words.length) {
    const chunk = words.slice(i, i + chunkWords).join(' ')
    if (chunk.trim()) chunks.push(chunk.trim())
    i += chunkWords - overlapWords
  }
  return chunks
}

// ── Main ──────────────────────────────────────────────────────────────────

async function embedWithRetry(text: string, maxAttempts = 5): Promise<number[]> {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const { embedding } = await embed({
        model: voyage.textEmbeddingModel('voyage-3'),
        value: text,
      })
      return embedding
    } catch (err: unknown) {
      const isRateLimit =
        (err as Error)?.message?.includes('Too Many Requests') ||
        (err as Error)?.message?.includes('429') ||
        (err as Error)?.message?.includes('rate')
      if (isRateLimit && attempt < maxAttempts) {
        const delay = 2000 * attempt
        process.stdout.write(` rate limited, retrying in ${delay / 1000}s...`)
        await new Promise((r) => setTimeout(r, delay))
      } else {
        throw err
      }
    }
  }
  throw new Error('Max retry attempts exceeded')
}

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error('❌  DATABASE_URL not set')
    process.exit(1)
  }
  if (!process.env.VOYAGE_API_KEY) {
    console.error('❌  VOYAGE_API_KEY not set')
    process.exit(1)
  }

  const sql = neon(process.env.DATABASE_URL)

  if (process.argv.includes('--clear')) {
    console.log('Clearing existing knowledge base...')
    await sql`DELETE FROM knowledge_embeddings`
    console.log('Cleared.\n')
  }

  const { DOCUMENTS } = await import('./knowledge-base-seed')
  const now = new Date().toISOString()
  let totalChunks = 0

  for (const doc of DOCUMENTS) {
    const chunks = chunkText(doc.content)
    console.log(`\n📄  ${doc.title}`)
    console.log(`    ${chunks.length} chunks, reg body: ${doc.regBody}`)

    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i]
      process.stdout.write(`    [${i + 1}/${chunks.length}] embedding...`)

      const embedding = await embedWithRetry(chunk)
      const embeddingStr = `[${embedding.join(',')}]`

      await sql`
        INSERT INTO knowledge_embeddings
          (content, embedding, source_title, source_url, source_date, reg_body, doc_type, sector_tags, is_current, last_verified_at)
        VALUES
          (${chunk}, ${embeddingStr}::vector, ${doc.title}, ${doc.sourceUrl}, ${doc.sourceDate},
           ${doc.regBody}, ${doc.docType}, ${doc.sectorTags}, true, ${now}::timestamptz)
      `

      process.stdout.write(' ✓\n')
      // Respect Voyage AI free tier rate limits (1 req/sec)
      await new Promise((r) => setTimeout(r, 1100))
    }

    totalChunks += chunks.length
  }

  console.log(`\n✅  Done. ${DOCUMENTS.length} documents, ${totalChunks} chunks ingested.`)
  process.exit(0)
}

main().catch((err) => {
  console.error('\n❌  Ingestion failed:', err.message || err)
  process.exit(1)
})
