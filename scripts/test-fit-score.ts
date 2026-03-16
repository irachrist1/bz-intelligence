/**
 * End-to-end fit score test. Run with: npx tsx scripts/test-fit-score.ts
 * Tests the first 3 approved tenders against the first firm profile in the DB.
 */
import { resolve } from 'path'
import { readFileSync } from 'fs'
// Force-override env vars from .env.local (process.loadEnvFile skips already-set vars)
try {
  const raw = readFileSync(resolve(process.cwd(), '.env.local'), 'utf8')
  for (const line of raw.split('\n')) {
    const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/)
    if (m) process.env[m[1]] = m[2].trim()
  }
} catch { /* ignore if not found */ }

import { db } from '../lib/db'
import { tenders, firmProfiles } from '../lib/db/schema'
import { eq, desc } from 'drizzle-orm'

const ANTHROPIC_URL = 'https://api.anthropic.com/v1/messages'
const MODEL = 'claude-haiku-4-5-20251001'

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
  if (!apiKey) { console.error('ANTHROPIC_API_KEY not set'); process.exit(1) }
  if (apiKey.startsWith('sk-ant-oat')) {
    console.error('ERROR: ANTHROPIC_API_KEY is a Claude Code OAuth token, not a REST API key.')
    console.error('Get a real key from console.anthropic.com → API Keys → Create Key')
    process.exit(1)
  }

  const tenderRows = await db.select({
    id: tenders.id, title: tenders.title, issuingOrg: tenders.issuingOrg,
    tenderType: tenders.tenderType, fundingSource: tenders.fundingSource,
    categoryTags: tenders.categoryTags, description: tenders.description,
    aiSummary: tenders.aiSummary, eligibilityNotes: tenders.eligibilityNotes,
    estimatedValueUsd: tenders.estimatedValueUsd,
  }).from(tenders).where(eq(tenders.reviewStatus, 'approved')).orderBy(desc(tenders.datePosted)).limit(3)

  if (tenderRows.length === 0) { console.error('No approved tenders found.'); process.exit(1) }

  const profileRows = await db.select({
    firmName: firmProfiles.firmName, serviceCategories: firmProfiles.serviceCategories,
    sectors: firmProfiles.sectors, contractSizeMinUsd: firmProfiles.contractSizeMinUsd,
    contractSizeMaxUsd: firmProfiles.contractSizeMaxUsd, fundingSources: firmProfiles.fundingSources,
    countries: firmProfiles.countries, keywordsInclude: firmProfiles.keywordsInclude,
    keywordsExclude: firmProfiles.keywordsExclude,
  }).from(firmProfiles).limit(1)

  if (profileRows.length === 0) { console.error('No firm profile found.'); process.exit(1) }

  const profile = profileRows[0]
  const serviceCategories = (profile.serviceCategories ?? []).filter(Boolean)
  const fundingSources = (profile.fundingSources ?? []).filter(Boolean)
  const countries = (profile.countries ?? []).filter(Boolean)

  const profileContext = [
    serviceCategories.length > 0 ? `Service categories: ${serviceCategories.join(', ')}` : null,
    `Typical contract size: ${contractRangeLabel(profile.contractSizeMinUsd, profile.contractSizeMaxUsd)}`,
    fundingSources.length > 0 ? `Preferred funding sources: ${fundingSources.join(', ')}` : null,
    countries.length > 0 ? `Countries: ${countries.join(', ')}` : null,
  ].filter(Boolean).join('\n')

  console.log(`\nFirm: ${profile.firmName}`)
  console.log(`Profile:\n${profileContext}`)
  console.log(`\nTesting ${tenderRows.length} tenders...\n`)

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

  for (let i = 0; i < tenderRows.length; i++) {
    const tender = tenderRows[i]
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

    const userMessage = `TENDER:\n${tenderContext}\n\nFIRM PROFILE:\n${profileContext}\n\nScore this tender's fit for the firm and return the JSON evaluation.`

    console.log(`\n═══ Tender ${i + 1}: ${tender.title.slice(0, 70)} ═══`)
    console.log(`Org: ${tender.issuingOrg}`)

    try {
      const res = await fetch(ANTHROPIC_URL, {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' },
        body: JSON.stringify({ model: MODEL, max_tokens: 256, system: systemPrompt, messages: [{ role: 'user', content: userMessage }] }),
        signal: AbortSignal.timeout(20_000),
      })

      const data = await res.json() as { content?: { type: string; text: string }[]; error?: { message: string } }
      if (data.error) { console.log('API ERROR:', data.error.message); continue }

      const rawText = data.content?.find((b) => b.type === 'text')?.text?.trim() ?? ''
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
