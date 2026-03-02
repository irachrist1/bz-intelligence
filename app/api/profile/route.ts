import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth/server'
import { db } from '@/lib/db'
import { businessProfiles, firmProfiles } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'

function normalizeArray(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === 'string').map((item) => item.trim()).filter(Boolean)
    : []
}

function contractRangeFromProfile(min: number | null, max: number | null): string {
  if (min === null && max === 50000) return 'lt_50k'
  if (min === 50000 && max === 250000) return '50k_250k'
  if (min === 250000 && max === 1000000) return '250k_1m'
  if (min === 1000000 && max === null) return 'gt_1m'
  return ''
}

function contractRangeBounds(range: string): { min: number | null; max: number | null } {
  const map: Record<string, { min: number | null; max: number | null }> = {
    lt_50k: { min: null, max: 50000 },
    '50k_250k': { min: 50000, max: 250000 },
    '250k_1m': { min: 250000, max: 1000000 },
    gt_1m: { min: 1000000, max: null },
  }
  return map[range] ?? { min: null, max: null }
}

export async function GET() {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const orgId = session.session.activeOrganizationId || session.user.id

  try {
    const [firmRow] = await db.select().from(firmProfiles).where(eq(firmProfiles.orgId, orgId)).limit(1)
    if (firmRow) {
      return NextResponse.json({
        profile: {
          firmName: firmRow.firmName ?? '',
          legalEntityType: firmRow.legalEntityType ?? '',
          serviceCategories: firmRow.serviceCategories ?? [],
          sectors: firmRow.sectors ?? [],
          contractSizeRange: contractRangeFromProfile(firmRow.contractSizeMinUsd, firmRow.contractSizeMaxUsd),
          fundingSources: firmRow.fundingSources ?? [],
          countries: firmRow.countries ?? [],
          languages: firmRow.languages ?? [],
          keywordsInclude: (firmRow.keywordsInclude ?? []).join(', '),
          keywordsExclude: (firmRow.keywordsExclude ?? []).join(', '),
        },
      })
    }
  } catch {
    // firm_profiles table may not be migrated yet; fallback below.
  }

  const [legacyRow] = await db
    .select()
    .from(businessProfiles)
    .where(and(eq(businessProfiles.orgId, orgId), eq(businessProfiles.userId, session.user.id)))
    .limit(1)

  if (!legacyRow) return NextResponse.json({ profile: null })

  return NextResponse.json({
    profile: {
      firmName: legacyRow.bizName ?? '',
      legalEntityType: legacyRow.bizType ?? '',
      serviceCategories: [],
      sectors: legacyRow.sector ? [legacyRow.sector, ...(legacyRow.subSector ?? [])] : [],
      contractSizeRange: '',
      fundingSources: [],
      countries: legacyRow.operatesProvince ? ['Rwanda', 'Uganda'] : ['Rwanda'],
      languages: ['English'],
      keywordsInclude: '',
      keywordsExclude: '',
    },
  })
}

export async function PUT(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const orgId = session.session.activeOrganizationId || session.user.id
  const body = await req.json()
  const now = new Date()

  const firmName = typeof body.firmName === 'string' ? body.firmName.trim() : ''
  const legalEntityType = typeof body.legalEntityType === 'string' ? body.legalEntityType : null
  const serviceCategories = normalizeArray(body.serviceCategories)
  const sectors = normalizeArray(body.sectors)
  const fundingSources = normalizeArray(body.fundingSources)
  const countries = normalizeArray(body.countries)
  const languages = normalizeArray(body.languages)
  const keywordsInclude = typeof body.keywordsInclude === 'string'
    ? body.keywordsInclude.split(',').map((item: string) => item.trim()).filter(Boolean)
    : normalizeArray(body.keywordsInclude)
  const keywordsExclude = typeof body.keywordsExclude === 'string'
    ? body.keywordsExclude.split(',').map((item: string) => item.trim()).filter(Boolean)
    : normalizeArray(body.keywordsExclude)
  const contractSizeRange = typeof body.contractSizeRange === 'string' ? body.contractSizeRange : ''
  const contractBounds = contractRangeBounds(contractSizeRange)

  try {
    const firmProfileData = {
      firmName: firmName || null,
      legalEntityType,
      serviceCategories,
      sectors,
      contractSizeMinUsd: contractBounds.min,
      contractSizeMaxUsd: contractBounds.max,
      fundingSources,
      countries,
      languages,
      keywordsInclude,
      keywordsExclude,
      updatedAt: now,
    }

    const [existingFirmProfile] = await db.select().from(firmProfiles).where(eq(firmProfiles.orgId, orgId)).limit(1)
    if (!existingFirmProfile) {
      await db.insert(firmProfiles).values({ orgId, ...firmProfileData })
    } else {
      await db
        .update(firmProfiles)
        .set(firmProfileData)
        .where(eq(firmProfiles.id, existingFirmProfile.id))
    }
  } catch {
    // Continue with legacy profile update for compatibility.
  }

  // Keep legacy profile populated for existing features.
  const legacyData = {
    bizName: firmName || null,
    bizType: legalEntityType,
    sector: sectors[0] || null,
    subSector: sectors.slice(1),
    operatesProvince: countries.some((country) => country !== 'Rwanda'),
    updatedAt: now,
  }

  const [existingLegacy] = await db
    .select()
    .from(businessProfiles)
    .where(and(eq(businessProfiles.orgId, orgId), eq(businessProfiles.userId, session.user.id)))
    .limit(1)

  if (!existingLegacy) {
    await db.insert(businessProfiles).values({
      orgId,
      userId: session.user.id,
      handlesMoney: false,
      collectsData: false,
      foreignOwnership: false,
      transactionType: [],
      ...legacyData,
    })
  } else {
    await db.update(businessProfiles).set(legacyData).where(eq(businessProfiles.id, existingLegacy.id))
  }

  return NextResponse.json({ ok: true })
}
