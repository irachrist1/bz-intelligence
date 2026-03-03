import { readFileSync } from 'fs'
import { resolve } from 'path'
import { eq } from 'drizzle-orm'

process.loadEnvFile(resolve(process.cwd(), '.env.local'))

type RtcSource = {
  sourceUrl?: string
  sourceType?: string
  confidenceScore?: number
  capturedAt?: number | string
}

type RtcCompany = {
  _id?: string
  id?: string
  name: string
  slug: string
  industry?: string
  description?: string
  founded?: number
  foundedYear?: number
  teamSize?: number
  revenue?: number
  revenueRange?: string
  impact?: string
  score?: number
  verified?: boolean
  status?: string
  website?: string
  logoUrl?: string
  createdAt?: number | string
  updatedAt?: number | string
  sources?: RtcSource[]
  timeline?: RtcSource[]
}

type ListResponse = {
  data?: RtcCompany[]
  pagination?: {
    page?: number
    pageSize?: number
    totalPages?: number
    total?: number
  }
}

function normalizeBaseUrl(baseUrl: string): string {
  return baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl
}

function parseTimestamp(value: unknown): Date | undefined {
  if (value === null || value === undefined) return undefined
  if (typeof value === 'number' && Number.isFinite(value)) return new Date(value)
  if (typeof value === 'string' && value.trim()) {
    const parsed = Date.parse(value)
    if (!Number.isNaN(parsed)) return new Date(parsed)
  }
  return undefined
}

function mapRevenueRange(company: RtcCompany): string | null {
  if (company.revenueRange) return company.revenueRange
  const revenue = Number(company.revenue ?? 0)
  if (!Number.isFinite(revenue) || revenue <= 0) return null
  if (revenue < 50_000) return '0-50k'
  if (revenue < 250_000) return '50k-250k'
  if (revenue < 1_000_000) return '250k-1m'
  return '1m+'
}

function mapStatus(company: RtcCompany): 'verified' | 'pending' | 'rejected' {
  if (company.verified === true) return 'verified'
  const raw = String(company.status ?? '').toLowerCase()
  if (raw.includes('reject')) return 'rejected'
  if (raw.includes('approve') || raw.includes('verify') || raw === 'active') return 'verified'
  return 'pending'
}

function pickCompanyArray(payload: unknown): RtcCompany[] {
  if (Array.isArray(payload)) return payload as RtcCompany[]

  if (payload && typeof payload === 'object') {
    const asObj = payload as Record<string, unknown>
    if (Array.isArray(asObj.data)) return asObj.data as RtcCompany[]
    if (Array.isArray(asObj.companies)) return asObj.companies as RtcCompany[]

    const tables = asObj.tables as Record<string, unknown> | undefined
    if (tables && Array.isArray(tables.companies)) return tables.companies as RtcCompany[]
    if (tables && tables.companies && typeof tables.companies === 'object') {
      const docs = (tables.companies as Record<string, unknown>).documents
      if (Array.isArray(docs)) return docs as RtcCompany[]
    }
  }

  return []
}

function pickSourceArray(payload: unknown): Array<Record<string, unknown>> {
  if (!payload || typeof payload !== 'object') return []
  const asObj = payload as Record<string, unknown>

  if (Array.isArray(asObj.sources)) return asObj.sources as Array<Record<string, unknown>>

  const tables = asObj.tables as Record<string, unknown> | undefined
  if (!tables) return []
  if (Array.isArray(tables.sources)) return tables.sources as Array<Record<string, unknown>>

  const sourceTable = tables.sources as Record<string, unknown> | undefined
  if (sourceTable && Array.isArray(sourceTable.documents)) {
    return sourceTable.documents as Array<Record<string, unknown>>
  }

  return []
}

async function fetchCompaniesFromApi(baseUrl: string): Promise<RtcCompany[]> {
  const normalizedBase = normalizeBaseUrl(baseUrl)
  const allRows: RtcCompany[] = []
  let page = 1
  const pageSize = 200

  for (;;) {
    const url = `${normalizedBase}/api/companies?verifiedOnly=true&page=${page}&pageSize=${pageSize}`
    const response = await fetch(url, { headers: { Accept: 'application/json' } })
    if (!response.ok) {
      throw new Error(`Failed to fetch ${url}: ${response.status} ${response.statusText}`)
    }

    const payload = (await response.json()) as ListResponse | RtcCompany[]
    const rows = Array.isArray(payload) ? payload : payload.data ?? []
    if (rows.length === 0) break

    allRows.push(...rows)
    if (Array.isArray(payload)) break

    const totalPages = payload.pagination?.totalPages ?? 0
    if (!totalPages || page >= totalPages) break
    page += 1
  }

  return allRows
}

async function fetchCompanyProfileSources(baseUrl: string, slug: string): Promise<RtcSource[]> {
  const normalizedBase = normalizeBaseUrl(baseUrl)
  const url = `${normalizedBase}/api/companies/profile?slug=${encodeURIComponent(slug)}`
  const response = await fetch(url, { headers: { Accept: 'application/json' } })
  if (!response.ok) return []

  const payload = (await response.json()) as { timeline?: RtcSource[] }
  return Array.isArray(payload.timeline) ? payload.timeline : []
}

async function loadRtcData(): Promise<{
  companies: RtcCompany[]
  sourceRows: Array<Record<string, unknown>>
}> {
  const exportPath = process.env.RTC_EXPORT_PATH
  if (exportPath) {
    const raw = readFileSync(resolve(process.cwd(), exportPath), 'utf8')
    const payload = JSON.parse(raw) as unknown
    return {
      companies: pickCompanyArray(payload),
      sourceRows: pickSourceArray(payload),
    }
  }

  const baseUrl = process.env.CONVEX_BASE_URL || process.env.CONVEX_SITE_URL
  if (!baseUrl) {
    throw new Error('Set either RTC_EXPORT_PATH or CONVEX_BASE_URL (or CONVEX_SITE_URL) in your environment.')
  }

  return {
    companies: await fetchCompaniesFromApi(baseUrl),
    sourceRows: [],
  }
}

function sourceRowsByCompanyId(sourceRows: Array<Record<string, unknown>>) {
  const map = new Map<string, RtcSource[]>()
  for (const source of sourceRows) {
    const companyId = String(source.companyId ?? '')
    if (!companyId) continue
    const current = map.get(companyId) ?? []
    current.push({
      sourceUrl: String(source.sourceUrl ?? ''),
      sourceType: String(source.sourceType ?? 'news'),
      confidenceScore: Number(source.confidenceScore ?? 0),
      capturedAt: Number(source.createdAt ?? Date.now()),
    })
    map.set(companyId, current)
  }
  return map
}

async function main() {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is required.')
  }

  const [{ db }, { companySources, techCompanies }] = await Promise.all([
    import('@/lib/db'),
    import('@/lib/db/schema'),
  ])

  const { companies, sourceRows } = await loadRtcData()
  const byCompanyId = sourceRowsByCompanyId(sourceRows)
  const baseUrl = process.env.CONVEX_BASE_URL
  const fetchProfiles = String(process.env.RTC_FETCH_PROFILES ?? 'true').toLowerCase() !== 'false'

  console.log(`Starting RTC migration for ${companies.length} companies...`)

  let migrated = 0
  let skipped = 0

  for (const company of companies) {
    if (!company.name || !company.slug) {
      skipped += 1
      continue
    }

    const insertValues = {
      name: company.name,
      slug: company.slug,
      industry: company.industry ?? 'FinTech',
      description: company.description ?? null,
      foundedYear: company.foundedYear ?? company.founded ?? null,
      teamSize: company.teamSize ?? null,
      revenueRange: mapRevenueRange(company),
      impactMetric: company.impact ?? null,
      score: company.score ?? 0,
      status: mapStatus(company),
      website: company.website ?? null,
      logoUrl: company.logoUrl ?? null,
      createdAt: parseTimestamp(company.createdAt),
      updatedAt: parseTimestamp(company.updatedAt) ?? new Date(),
    }

    const result = await db
      .insert(techCompanies)
      .values(insertValues)
      .onConflictDoUpdate({
        target: techCompanies.slug,
        set: {
          name: insertValues.name,
          industry: insertValues.industry,
          description: insertValues.description,
          foundedYear: insertValues.foundedYear,
          teamSize: insertValues.teamSize,
          revenueRange: insertValues.revenueRange,
          impactMetric: insertValues.impactMetric,
          score: insertValues.score,
          status: insertValues.status,
          website: insertValues.website,
          logoUrl: insertValues.logoUrl,
          updatedAt: new Date(),
        },
      })
      .returning({ id: techCompanies.id })

    const companyId = result[0]?.id
    if (!companyId) {
      skipped += 1
      continue
    }

    let sources: RtcSource[] = []
    if (Array.isArray(company.sources)) sources = company.sources
    else if (Array.isArray(company.timeline)) sources = company.timeline
    else if (company._id) sources = byCompanyId.get(company._id) ?? []

    if (sources.length === 0 && baseUrl && fetchProfiles) {
      sources = await fetchCompanyProfileSources(baseUrl, company.slug)
    }

    await db.delete(companySources).where(eq(companySources.companyId, companyId))
    if (sources.length > 0) {
      await db.insert(companySources).values(
        sources
          .filter((source) => source.sourceUrl)
          .map((source) => ({
            companyId,
            url: String(source.sourceUrl),
            sourceType: String(source.sourceType ?? 'news'),
            attributionScore: Number(source.confidenceScore ?? 0),
            fetchedAt: parseTimestamp(source.capturedAt) ?? new Date(),
          }))
      )
    }

    migrated += 1
  }

  console.log(`RTC migration complete. Migrated: ${migrated}, skipped: ${skipped}`)
}

main().catch((error) => {
  console.error('RTC migration failed:', error)
  process.exit(1)
})
