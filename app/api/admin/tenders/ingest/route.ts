import { NextRequest, NextResponse } from 'next/server'
import { revalidateTag } from 'next/cache'
import { db } from '@/lib/db'
import { tenders } from '@/lib/db/schema'
import { getAdminSession } from '@/lib/auth/admin'

function toNullableDate(value: unknown): Date | null {
  if (typeof value !== 'string' || !value.trim()) return null
  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime()) ? null : parsed
}

function toNullableNumber(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string' && value.trim()) {
    const parsed = Number(value)
    if (Number.isFinite(parsed)) return parsed
  }
  return null
}

function normalizeStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  return value.filter((item): item is string => typeof item === 'string').map((item) => item.trim()).filter(Boolean)
}

export async function POST(req: NextRequest) {
  const adminSession = await getAdminSession()
  if (!adminSession) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await req.json()

  const source = typeof body.source === 'string' ? body.source.trim().toLowerCase() : ''
  const title = typeof body.title === 'string' ? body.title.trim() : ''
  const issuingOrg = typeof body.issuingOrg === 'string' ? body.issuingOrg.trim() : ''
  const sourceUrl = typeof body.sourceUrl === 'string' ? body.sourceUrl.trim() : ''

  if (!source || !title || !issuingOrg || !sourceUrl) {
    return NextResponse.json({ error: 'source, title, issuingOrg, and sourceUrl are required' }, { status: 400 })
  }

  const categoryTags = normalizeStringArray(body.categoryTags)
  const documents = Array.isArray(body.documents) ? body.documents : []
  const tenderType = typeof body.tenderType === 'string' ? body.tenderType.trim().toLowerCase() : null
  const fundingSource = typeof body.fundingSource === 'string' ? body.fundingSource.trim().toLowerCase() : null
  const description = typeof body.description === 'string' ? body.description.trim() : null
  const eligibilityNotes = typeof body.eligibilityNotes === 'string' ? body.eligibilityNotes.trim() : null
  const country = typeof body.country === 'string' && body.country.trim() ? body.country.trim().toLowerCase() : 'rw'

  const [inserted] = await db
    .insert(tenders)
    .values({
      source,
      sourceId: typeof body.sourceId === 'string' ? body.sourceId : null,
      title,
      issuingOrg,
      tenderType,
      fundingSource,
      categoryTags,
      description,
      aiSummary: typeof body.aiSummary === 'string' ? body.aiSummary.trim() : null,
      eligibilityNotes,
      estimatedValueUsd: toNullableNumber(body.estimatedValueUsd),
      deadlineSubmission: toNullableDate(body.deadlineSubmission),
      deadlineClarification: toNullableDate(body.deadlineClarification),
      datePosted: toNullableDate(body.datePosted),
      sourceUrl,
      documents,
      country,
      reviewStatus: 'pending',
    })
    .returning({ id: tenders.id })

  revalidateTag('tenders', 'default')

  return NextResponse.json({ ok: true, id: inserted.id })
}
