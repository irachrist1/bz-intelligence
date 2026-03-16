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

  const serviceCategories = (profile.serviceCategories ?? []).filter(Boolean)
  const fundingSources = (profile.fundingSources ?? []).filter(Boolean)
  const countries = (profile.countries ?? []).filter(Boolean)
  const keywordsInclude = (profile.keywordsInclude ?? []).filter(Boolean)
  const keywordsExclude = (profile.keywordsExclude ?? []).filter(Boolean)

  const profileContext = [
    serviceCategories.length > 0 ? `Service categories: ${serviceCategories.join(', ')}` : null,
    `Typical contract size: ${contractRangeLabel(profile.contractSizeMinUsd, profile.contractSizeMaxUsd)}`,
    fundingSources.length > 0 ? `Preferred funding sources: ${fundingSources.join(', ')}` : null,
    countries.length > 0 ? `Countries: ${countries.join(', ')}` : null,
    keywordsInclude.length > 0 ? `Must-include keywords: ${cap(keywordsInclude.join(', '), 200)}` : null,
    keywordsExclude.length > 0 ? `Disqualifying keywords: ${cap(keywordsExclude.join(', '), 200)}` : null,
  ].filter(Boolean).join('\n')

  const userMessage = `TENDER:\n${tenderContext}\n\nFIRM PROFILE:\n${profileContext}\n\nScore this tender's fit for the firm and return the JSON evaluation.`

  const systemPrompt = `You are a procurement matching analyst for a business intelligence platform serving law and consulting firms in Rwanda and East Africa.

Given a tender opportunity and a firm profile, score the fit from 0 to 100 and explain the key factors — both what aligns and what doesn't.

Rules:
- Score based on how well the firm's service categories, contract size range, and funding source preferences match the tender's actual requirements.
- If the tender involves work outside the firm's stated services (e.g. civil engineering, construction, agriculture, road works), score below 40.
- If the tender is a strong match to the firm's core services, score above 70.
- reasons: 2-3 specific factors that most influenced the score — could be positive or negative. Name the specific service, skill, or requirement. Not generic phrases like "relevant experience needed."
- gaps: 0-2 concrete eligibility concerns or disqualifying mismatches. Leave empty array if no meaningful gaps.

Respond ONLY with valid JSON — no prose, no markdown, no explanation outside the JSON:
{"score": <integer 0-100>, "reasons": ["...", "...", "..."], "gaps": ["...", "..."]}

Keep each reason/gap under 15 words. Score 80-100 = strong fit, 60-79 = moderate, 40-59 = weak, 0-39 = poor.`

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
