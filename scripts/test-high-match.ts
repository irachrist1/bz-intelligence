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
import { tenders, firmProfiles } from '../lib/db/schema'
import { eq, inArray } from 'drizzle-orm'

const ANTHROPIC_URL = 'https://api.anthropic.com/v1/messages'
const MODEL = 'claude-haiku-4-5-20251001'

const TARGET_IDS = [
  'f669ff8f-fe75-42fb-8316-61fbb0bc493c', // ELK Licenses — RISA
  '7fba56cd-d3f3-4c2e-a548-45ea9ba88555', // IT equipment — Rwanda Digital Acceleration Project
  'c2968e51-7e56-4932-866f-db2628b6d4f5', // Data collection/M&E — RTDA (consulting + advisory)
]

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

async function main() {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey?.startsWith('sk-ant-api')) {
    console.error('ERROR: Valid Anthropic REST key required. Got:', apiKey?.slice(0, 16))
    process.exit(1)
  }

  const tenderRows = await db.select({
    id: tenders.id, title: tenders.title, issuingOrg: tenders.issuingOrg,
    tenderType: tenders.tenderType, fundingSource: tenders.fundingSource,
    categoryTags: tenders.categoryTags, description: tenders.description,
    aiSummary: tenders.aiSummary, eligibilityNotes: tenders.eligibilityNotes,
    estimatedValueUsd: tenders.estimatedValueUsd, reviewStatus: tenders.reviewStatus,
  }).from(tenders).where(inArray(tenders.id, TARGET_IDS))

  const profileRows = await db.select({
    firmName: firmProfiles.firmName, serviceCategories: firmProfiles.serviceCategories,
    contractSizeMinUsd: firmProfiles.contractSizeMinUsd,
    contractSizeMaxUsd: firmProfiles.contractSizeMaxUsd,
    fundingSources: firmProfiles.fundingSources, countries: firmProfiles.countries,
    keywordsInclude: firmProfiles.keywordsInclude, keywordsExclude: firmProfiles.keywordsExclude,
  }).from(firmProfiles).limit(1)

  if (!profileRows[0]) { console.error('No firm profile found'); process.exit(1) }
  const profile = profileRows[0]

  const serviceCategories = (profile.serviceCategories ?? []).filter(Boolean)
  const fundingSources = (profile.fundingSources ?? []).filter(Boolean)
  const countries = (profile.countries ?? []).filter(Boolean)

  const profileContext = [
    serviceCategories.length > 0 ? `Service categories: ${serviceCategories.join(', ')}` : null,
    `Typical contract size: ${contractRangeLabel(profile.contractSizeMinUsd, profile.contractSizeMaxUsd)}`,
    fundingSources.length > 0 ? `Preferred funding sources: ${fundingSources.join(', ')}` : null,
    countries.length > 0 ? `Countries: ${countries.join(', ')}` : null,
    (profile.keywordsInclude ?? []).filter(Boolean).length > 0
      ? `Must-include keywords: ${(profile.keywordsInclude ?? []).join(', ')}` : null,
    (profile.keywordsExclude ?? []).filter(Boolean).length > 0
      ? `Disqualifying keywords: ${(profile.keywordsExclude ?? []).join(', ')}` : null,
  ].filter(Boolean).join('\n')

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

  console.log(`\nFirm: ${profile.firmName}`)
  console.log(`Profile:\n${profileContext}`)
  console.log(`\nTesting ${tenderRows.length} high-relevance tenders...\n`)

  // Maintain TARGET_IDS order
  const ordered = TARGET_IDS.map(id => tenderRows.find(r => r.id === id)).filter(Boolean)

  for (let i = 0; i < ordered.length; i++) {
    const tender = ordered[i]!
    const tenderContext = [
      `Title: ${tender.title}`,
      `Issuing organisation: ${tender.issuingOrg}`,
      tender.tenderType ? `Tender type: ${tender.tenderType.toUpperCase()}` : null,
      tender.fundingSource ? `Funding source: ${tender.fundingSource}` : null,
      tender.categoryTags?.length ? `Category tags: ${tender.categoryTags.join(', ')}` : null,
      tender.eligibilityNotes ? `Eligibility notes: ${cap(tender.eligibilityNotes, 400)}` : null,
      tender.aiSummary
        ? `Summary: ${cap(tender.aiSummary, 500)}`
        : tender.description ? `Description: ${cap(tender.description, 500)}` : null,
      typeof tender.estimatedValueUsd === 'number'
        ? `Estimated value: $${tender.estimatedValueUsd.toLocaleString()}` : null,
    ].filter(Boolean).join('\n')

    console.log(`\n═══ Tender ${i + 1}: ${tender.title.slice(0, 70)} ═══`)
    console.log(`Org: ${tender.issuingOrg} [${tender.reviewStatus}]`)
    console.log(`Desc preview: ${tender.description?.slice(0, 120) ?? '(none)'}`)

    try {
      const res = await fetch(ANTHROPIC_URL, {
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
          messages: [{ role: 'user', content: `TENDER:\n${tenderContext}\n\nFIRM PROFILE:\n${profileContext}\n\nScore this tender's fit for the firm and return the JSON evaluation.` }],
        }),
        signal: AbortSignal.timeout(20_000),
      })

      const data = await res.json() as { content?: { type: string; text: string }[]; error?: { message: string } }
      if (data.error) { console.log('API ERROR:', data.error.message); continue }

      const rawText = data.content?.find(b => b.type === 'text')?.text?.trim() ?? ''
      const jsonText = rawText.replace(/^```(?:json)?\n?/i, '').replace(/\n?```$/i, '').trim()
      const parsed = JSON.parse(jsonText) as { score: number; reasons: string[]; gaps: string[] }

      console.log(`Score: ${parsed.score}/100`)
      console.log('Reasons:')
      parsed.reasons.forEach((r, j) => console.log(`  ${j + 1}. ${r}`))
      if (parsed.gaps.length > 0) {
        console.log('Gaps:')
        parsed.gaps.forEach((g, j) => console.log(`  ${j + 1}. ${g}`))
      } else {
        console.log('Gaps: none')
      }
    } catch (err) {
      console.log('ERROR:', err instanceof Error ? err.message : String(err))
    }
  }

  process.exit(0)
}
main().catch(console.error)
