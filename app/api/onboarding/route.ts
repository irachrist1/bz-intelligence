import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth/server'
import { db } from '@/lib/db'
import { firmProfiles } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { sendWelcomeEmail } from '@/lib/email'

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { user } = session
  const orgId = session.session.activeOrganizationId || user.id // fallback to userId if no org yet

  const body = await req.json()
  const normalizeArray = (value: unknown) =>
    Array.isArray(value)
      ? value.filter((item): item is string => typeof item === 'string').map((item) => item.trim()).filter(Boolean)
      : []

  const toKeywords = (value: unknown) =>
    typeof value === 'string'
      ? value.split(',').map((item) => item.trim()).filter(Boolean)
      : normalizeArray(value)

  const contractRangeMap: Record<string, { min: number | null; max: number | null }> = {
    lt_50k: { min: null, max: 50000 },
    '50k_250k': { min: 50000, max: 250000 },
    '250k_1m': { min: 250000, max: 1000000 },
    gt_1m: { min: 1000000, max: null },
  }

  const firmName = typeof body.firmName === 'string' ? body.firmName.trim() : ''
  const legalEntityType = typeof body.legalEntityType === 'string' ? body.legalEntityType : null
  const serviceCategories = normalizeArray(body.serviceCategories)
  const sectors = normalizeArray(body.sectors)
  const fundingSources = normalizeArray(body.fundingSources)
  const countries = normalizeArray(body.countries)
  const languages = normalizeArray(body.languages)
  const keywordsInclude = toKeywords(body.keywordsInclude)
  const keywordsExclude = toKeywords(body.keywordsExclude)
  const contractSizeRange = typeof body.contractSizeRange === 'string' ? body.contractSizeRange : ''
  const contractRange = contractRangeMap[contractSizeRange] ?? { min: null, max: null }
  const now = new Date()

  const existingFirmProfile = await db
    .select({ id: firmProfiles.id })
    .from(firmProfiles)
    .where(eq(firmProfiles.orgId, orgId))
    .limit(1)

  const isNewProfile = existingFirmProfile.length === 0
  const firmProfileData = {
    firmName: firmName || null,
    legalEntityType,
    serviceCategories,
    sectors,
    contractSizeMinUsd: contractRange.min,
    contractSizeMaxUsd: contractRange.max,
    fundingSources,
    countries,
    languages,
    keywordsInclude,
    keywordsExclude,
    updatedAt: now,
  }

  if (isNewProfile) {
    await db.insert(firmProfiles).values({ orgId, ...firmProfileData })
  } else {
    await db
      .update(firmProfiles)
      .set(firmProfileData)
      .where(eq(firmProfiles.id, existingFirmProfile[0].id))
  }

  // Send welcome email on first onboarding completion (fire-and-forget, never blocks)
  if (isNewProfile && user.email) {
    sendWelcomeEmail({
      email: user.email,
      name: user.name,
      sector: sectors[0] || null,
      mode: 'tender',
    }).catch((err) => console.error('Welcome email failed (non-blocking):', err))
  }

  return NextResponse.json({ ok: true })
}
