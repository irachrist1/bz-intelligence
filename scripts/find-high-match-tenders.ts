import { resolve } from 'path'
import { readFileSync } from 'fs'
try {
  const raw = readFileSync(resolve(process.cwd(), '.env.local'), 'utf8')
  for (const line of raw.split('\n')) {
    const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/)
    if (m) process.env[m[1]] = m[2].trim()
  }
} catch { /* ignore */ }

import { db } from '../lib/db'
import { tenders } from '../lib/db/schema'
import { ilike, or, eq } from 'drizzle-orm'

async function main() {
  // Search all tenders (any review status) for IT-relevant keywords
  const rows = await db.select({
    id: tenders.id,
    title: tenders.title,
    issuingOrg: tenders.issuingOrg,
    reviewStatus: tenders.reviewStatus,
    categoryTags: tenders.categoryTags,
    description: tenders.description,
    tenderType: tenders.tenderType,
    fundingSource: tenders.fundingSource,
    estimatedValueUsd: tenders.estimatedValueUsd,
  }).from(tenders).where(
    or(
      ilike(tenders.title, '%digital%'),
      ilike(tenders.title, '%ICT%'),
      ilike(tenders.title, '%software%'),
      ilike(tenders.title, '%system%'),
      ilike(tenders.title, '%technology%'),
      ilike(tenders.title, '%data%'),
      ilike(tenders.title, '% IT %'),
      ilike(tenders.title, '%information%'),
      ilike(tenders.title, '%network%'),
      ilike(tenders.title, '%cyber%'),
      ilike(tenders.title, '%ERP%'),
      ilike(tenders.title, '%database%'),
      ilike(tenders.title, '%automation%'),
      ilike(tenders.title, '%platform%'),
    )
  ).limit(50)

  console.log(`Found ${rows.length} IT-relevant tenders:`)
  for (const r of rows) {
    console.log(`\n[${r.reviewStatus}] ${r.id}`)
    console.log(`  Title: ${r.title.slice(0, 90)}`)
    console.log(`  Org: ${r.issuingOrg?.slice(0, 60)}`)
    console.log(`  Tags: ${r.categoryTags?.join(', ')} | Funding: ${r.fundingSource || 'N/A'}`)
  }
  process.exit(0)
}
main().catch(console.error)
