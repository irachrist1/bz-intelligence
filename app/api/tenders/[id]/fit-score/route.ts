import { NextRequest, NextResponse } from 'next/server'
import { eq } from 'drizzle-orm'
import { getSession } from '@/lib/auth/server'
import { db } from '@/lib/db'
import { firmProfiles, tenders } from '@/lib/db/schema'

// Data flow:
//   GET /api/tenders/[id]/fit-score
//     └─ auth check
//     └─ load tender (PK lookup)
//     └─ load firmProfile (org_id unique index lookup)
//     └─ if no profile → {status:'no_profile'}
//     └─ build prompt → POST to Anthropic Haiku
//     └─ parse JSON response → {score, reasons, gaps}
//     └─ all failures → {status:'error'} (never 500)

const ANTHROPIC_URL = 'https://api.anthropic.com/v1/messages'
const MODEL = 'claude-haiku-4-5-20251001'

type FitScoreResult =
  | { status: 'ok'; score: number; reasons: string[]; gaps: string[] }
  | { status: 'no_profile' }
  | { status: 'error' }

function contractRangeLabel(min: number | null, max: number | null): string {
  if (min === null && max === 50000) return 'Below $50K'
  if (min === 50000 && max === 250000) return '$50K–$250K'
  if (min === 250000 && max === 1000000) return '$250K–$1M'
  if (min === 1000000 && max === null) return 'Above $1M'
  return 'Not specified'
}

function cap(text: string | null | undefined, maxLen: number): string {
  if (!text) return ''
  return text.length > maxLen ? text.slice(0, maxLen) + '…' : text
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<FitScoreResult>> {
  const session = await getSession()
  if (!session) return NextResponse.json({ status: 'error' }, { status: 401 })

  const { id } = await params
  if (!id) return NextResponse.json({ status: 'error' }, { status: 400 })

  const orgId = session.session.activeOrganizationId || session.user.id

  // Load tender + firm profile in parallel
  const [tenderRows, profileRows] = await Promise.all([
    db.select({
      title: tenders.title,
      issuingOrg: tenders.issuingOrg,
      tenderType: tenders.tenderType,
      fundingSource: tenders.fundingSource,
      categoryTags: tenders.categoryTags,
      description: tenders.description,
      aiSummary: tenders.aiSummary,
      eligibilityNotes: tenders.eligibilityNotes,
      estimatedValueUsd: tenders.estimatedValueUsd,
    }).from(tenders).where(eq(tenders.id, id)).limit(1),
    db.select({
      serviceCategories: firmProfiles.serviceCategories,
      sectors: firmProfiles.sectors,
      contractSizeMinUsd: firmProfiles.contractSizeMinUsd,
      contractSizeMaxUsd: firmProfiles.contractSizeMaxUsd,
      fundingSources: firmProfiles.fundingSources,
      countries: firmProfiles.countries,
      keywordsInclude: firmProfiles.keywordsInclude,
      keywordsExclude: firmProfiles.keywordsExclude,
    }).from(firmProfiles).where(eq(firmProfiles.orgId, orgId)).limit(1),
  ])

  const tender = tenderRows[0]
  if (!tender) return NextResponse.json({ status: 'error' }, { status: 404 })

  const profile = profileRows[0]
  if (!profile) return NextResponse.json({ status: 'no_profile' })

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) return NextResponse.json({ status: 'error' })

  // Build prompt
  const tenderContext = [
    `Title: ${tender.title}`,
    `Issuing organisation: ${tender.issuingOrg}`,
    tender.tenderType ? `Tender type: ${tender.tenderType.toUpperCase()}` : null,
    tender.fundingSource ? `Funding source: ${tender.fundingSource}` : null,
    tender.categoryTags?.length ? `Category tags: ${tender.categoryTags.join(', ')}` : null,
    tender.eligibilityNotes ? `Eligibility notes: ${cap(tender.eligibilityNotes, 400)}` : null,
    tender.aiSummary ? `Summary: ${cap(tender.aiSummary, 500)}` : (tender.description ? `Description: ${cap(tender.description, 500)}` : null),
    typeof tender.estimatedValueUsd === 'number' ? `Estimated value: $${tender.estimatedValueUsd.toLocaleString()}` : null,
  ].filter(Boolean).join('\n')

  const profileContext = [
    `Service categories: ${(profile.serviceCategories ?? []).join(', ') || 'Not specified'}`,
    `Sectors: ${(profile.sectors ?? []).join(', ') || 'Not specified'}`,
    `Typical contract size: ${contractRangeLabel(profile.contractSizeMinUsd, profile.contractSizeMaxUsd)}`,
    `Preferred funding sources: ${(profile.fundingSources ?? []).join(', ') || 'Any'}`,
    `Countries: ${(profile.countries ?? []).join(', ') || 'Not specified'}`,
    (profile.keywordsInclude ?? []).length > 0
      ? `Must-include keywords: ${cap((profile.keywordsInclude ?? []).join(', '), 200)}`
      : null,
    (profile.keywordsExclude ?? []).length > 0
      ? `Disqualifying keywords: ${cap((profile.keywordsExclude ?? []).join(', '), 200)}`
      : null,
  ].filter(Boolean).join('\n')

  const userMessage = `TENDER:\n${tenderContext}\n\nFIRM PROFILE:\n${profileContext}\n\nEvaluate how well this firm's capabilities match this tender and return the JSON fit evaluation.`

  const systemPrompt = `You are a procurement matching analyst for a business intelligence platform serving law and consulting firms in Rwanda and East Africa.

Given a tender opportunity and a firm's profile, evaluate fit with precision. Consider: service category alignment, sector relevance, contract size fit, funding source preference, and any keyword matches or disqualifications.

Respond ONLY with valid JSON matching this exact schema — no prose, no markdown, no explanation outside the JSON:
{"score": <integer 0-100>, "reasons": [<2-3 short strings explaining why it's a good match>], "gaps": [<0-2 short strings flagging specific eligibility concerns or mismatches>]}

Score guide: 80-100 = strong fit, 60-79 = moderate fit, 40-59 = weak fit, 0-39 = poor fit.
Keep each reason and gap under 15 words. Be specific, not generic.`

  try {
    const response = await fetch(ANTHROPIC_URL, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 256,
        system: systemPrompt,
        messages: [{ role: 'user', content: userMessage }],
      }),
      signal: AbortSignal.timeout(15_000),
    })

    if (!response.ok) {
      console.error('[fit-score] Anthropic API error:', response.status)
      return NextResponse.json({ status: 'error' })
    }

    const data = await response.json() as { content?: { type: string; text: string }[] }
    const rawText = data.content?.find((b) => b.type === 'text')?.text?.trim() ?? ''

    // Strip any accidental markdown fences
    const jsonText = rawText.replace(/^```(?:json)?\n?/i, '').replace(/\n?```$/i, '').trim()
    const parsed = JSON.parse(jsonText) as { score?: unknown; reasons?: unknown; gaps?: unknown }

    const score = typeof parsed.score === 'number' && parsed.score >= 0 && parsed.score <= 100
      ? Math.round(parsed.score)
      : null

    if (score === null) {
      console.error('[fit-score] Invalid score in response:', rawText)
      return NextResponse.json({ status: 'error' })
    }

    const reasons = Array.isArray(parsed.reasons)
      ? (parsed.reasons as unknown[]).filter((r): r is string => typeof r === 'string').slice(0, 3)
      : []

    const gaps = Array.isArray(parsed.gaps)
      ? (parsed.gaps as unknown[]).filter((g): g is string => typeof g === 'string').slice(0, 2)
      : []

    return NextResponse.json({ status: 'ok', score, reasons, gaps })
  } catch (err) {
    console.error('[fit-score] Request failed:', err)
    return NextResponse.json({ status: 'error' })
  }
}
