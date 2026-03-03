import { scoreBreakdownFromInputs } from './scoring'

export type TechCompanyRecord = {
  id: string
  name: string
  slug: string
  industry: string
  description: string | null
  foundedYear: number | null
  teamSize: number | null
  revenueRange: string | null
  impactMetric: string | null
  score: number | null
  status: string
  website: string | null
  logoUrl: string | null
  createdAt: Date | null
  updatedAt: Date | null
}

export type CompanySourceRecord = {
  id: string
  companyId: string
  url: string
  sourceType: string
  attributionScore: number | null
  fetchedAt: Date | null
}

export type CompanyScoreSnapshot = ReturnType<typeof deriveCompanyMetrics>

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

function round2(value: number): number {
  return Number(value.toFixed(2))
}

function median(values: number[]): number {
  if (values.length === 0) return 0
  const sorted = [...values].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)
  if (sorted.length % 2 === 0) return (sorted[mid - 1] + sorted[mid]) / 2
  return sorted[mid]
}

function normalize(value: number, min: number, max: number): number {
  if (max === min) return 50
  return ((value - min) / (max - min)) * 100
}

function sourceHost(value: string): string {
  try {
    return new URL(value).hostname.toLowerCase().replace(/^www\./, '')
  } catch {
    return value.toLowerCase()
  }
}

export function revenueRangeToValue(range: string | null): number {
  if (!range) return 0
  const normalized = range.trim().toLowerCase()
  if (normalized === '0-50k') return 25_000
  if (normalized === '50k-250k') return 150_000
  if (normalized === '250k-1m') return 625_000
  if (normalized === '1m+') return 1_500_000

  const cleaned = normalized.replace(/[^0-9.+\-]/g, '')
  if (cleaned.includes('-')) {
    const [a, b] = cleaned.split('-').map((part) => Number(part))
    if (Number.isFinite(a) && Number.isFinite(b)) return (a + b) / 2
  }
  if (cleaned.endsWith('+')) {
    const value = Number(cleaned.slice(0, -1))
    if (Number.isFinite(value)) return value
  }
  const numeric = Number(cleaned)
  return Number.isFinite(numeric) ? numeric : 0
}

export function scoreBand(score: number): string {
  if (score >= 80) return 'High conviction'
  if (score >= 60) return 'Watchlist'
  return 'Needs verification'
}

export function deriveCompanyMetrics(
  company: TechCompanyRecord,
  sources: CompanySourceRecord[],
  maxRevenueValue: number,
  now: number = Date.now()
) {
  const distinctSourceCount = new Set(sources.map((source) => sourceHost(source.url))).size
  const confidenceAverage = sources.length
    ? sources.reduce((sum, source) => sum + Number(source.attributionScore ?? 0), 0) / sources.length
    : 0
  const sourcesRecent180 = sources.filter((source) => {
    if (!source.fetchedAt) return false
    return now - source.fetchedAt.getTime() <= 180 * 86400000
  }).length
  const freshestSourceAt = sources.length
    ? Math.max(...sources.map((source) => (source.fetchedAt ? source.fetchedAt.getTime() : 0)))
    : null

  const verificationQuality =
    clamp(confidenceAverage * 60, 0, 60) +
    clamp((distinctSourceCount / 5) * 25, 0, 25) +
    clamp((sourcesRecent180 / Math.max(1, sources.length)) * 15, 0, 15)
  const growthProxy = clamp((Number(company.teamSize ?? 0) / 300) * 100, 0, 100)
  const revenueValue = revenueRangeToValue(company.revenueRange)
  const revenueTraction =
    maxRevenueValue > 0
      ? clamp((Math.log1p(revenueValue) / Math.log1p(maxRevenueValue)) * 100, 0, 100)
      : 0
  const freshnessDays = freshestSourceAt ? Math.floor((now - freshestSourceAt) / 86400000) : 9999
  const freshness = freshestSourceAt ? clamp(100 - (freshnessDays / 180) * 100, 0, 100) : 0
  const completenessFields = [
    Boolean(company.description?.trim()),
    Boolean(company.website?.trim()),
    Number(company.foundedYear ?? 0) > 0,
    Number(company.teamSize ?? 0) >= 0,
    Boolean(company.revenueRange?.trim()),
    Boolean(company.impactMetric?.trim()),
    Boolean(company.industry?.trim()),
  ]
  const completeness = (completenessFields.filter(Boolean).length / completenessFields.length) * 100
  const breakdown = scoreBreakdownFromInputs({
    verificationQuality,
    growthProxy,
    revenueTraction,
    freshness,
    completeness,
  })

  const score = Number(company.score ?? 0) > 0 ? Number(company.score) : breakdown.total
  return {
    score: round2(score),
    scoreBand: scoreBand(score),
    freshnessDays,
    sourceCount: distinctSourceCount,
    evidenceStrong: distinctSourceCount >= 3 && freshnessDays <= 180,
    scoreBreakdown: breakdown,
  }
}

export type OpportunityMatrixPoint = {
  industry: string
  momentumScore: number
  investabilityScore: number
  companyCount: number
  trend30d: number | null
  trendLabel: string
  growthMedian: number
}

export function buildOpportunityMatrix(
  companies: TechCompanyRecord[],
  sourcesByCompany: Map<string, CompanySourceRecord[]>,
  now: number = Date.now()
): OpportunityMatrixPoint[] {
  const verifiedCompanies = companies.filter((company) => company.status === 'verified')
  if (verifiedCompanies.length === 0) return []

  const maxRevenue = Math.max(
    1,
    ...verifiedCompanies.map((company) => revenueRangeToValue(company.revenueRange))
  )

  const grouped = new Map<
    string,
    {
      companies: TechCompanyRecord[]
      metrics: CompanyScoreSnapshot[]
      sources: CompanySourceRecord[]
    }
  >()

  for (const company of verifiedCompanies) {
    const key = company.industry || 'Other'
    const entry = grouped.get(key) ?? { companies: [], metrics: [], sources: [] }
    const sources = sourcesByCompany.get(company.id) ?? []
    entry.companies.push(company)
    entry.metrics.push(deriveCompanyMetrics(company, sources, maxRevenue, now))
    entry.sources.push(...sources)
    grouped.set(key, entry)
  }

  const raw = [...grouped.entries()].map(([industry, entry]) => {
    const growthValues = entry.companies.map((company) => Number(company.teamSize ?? 0))
    const sourceEvents180 = entry.sources.filter((source) => {
      if (!source.fetchedAt) return false
      return now - source.fetchedAt.getTime() <= 180 * 86400000
    }).length
    const recent30 = entry.sources.filter((source) => {
      if (!source.fetchedAt) return false
      return now - source.fetchedAt.getTime() <= 30 * 86400000
    }).length
    const previous30 = entry.sources.filter((source) => {
      if (!source.fetchedAt) return false
      const age = now - source.fetchedAt.getTime()
      return age > 30 * 86400000 && age <= 60 * 86400000
    }).length
    const trend30d = previous30 > 0 ? ((recent30 - previous30) / previous30) * 100 : null

    return {
      industry,
      companyCount: entry.companies.length,
      growthMedian: median(growthValues),
      sourceActivity: sourceEvents180,
      investabilityAverage:
        entry.metrics.reduce((sum, metric) => sum + metric.score, 0) /
        Math.max(entry.metrics.length, 1),
      trend30d: trend30d === null ? null : round2(trend30d),
      trendLabel:
        trend30d === null
          ? 'Baseline building'
          : `${trend30d >= 0 ? '+' : ''}${trend30d.toFixed(1)}% vs prior 30d`,
    }
  })

  const growthMin = Math.min(...raw.map((item) => item.growthMedian))
  const growthMax = Math.max(...raw.map((item) => item.growthMedian))
  const densityMin = Math.min(...raw.map((item) => item.companyCount))
  const densityMax = Math.max(...raw.map((item) => item.companyCount))
  const activityMin = Math.min(...raw.map((item) => item.sourceActivity))
  const activityMax = Math.max(...raw.map((item) => item.sourceActivity))

  return raw
    .map((item) => {
      const growthNormalized = normalize(item.growthMedian, growthMin, growthMax)
      const densityNormalized = normalize(item.companyCount, densityMin, densityMax)
      const activityNormalized = normalize(item.sourceActivity, activityMin, activityMax)
      const momentumScore =
        growthNormalized * 0.5 + densityNormalized * 0.3 + activityNormalized * 0.2

      return {
        industry: item.industry,
        momentumScore: round2(momentumScore),
        investabilityScore: round2(item.investabilityAverage),
        companyCount: item.companyCount,
        trend30d: item.trend30d,
        trendLabel: item.trendLabel,
        growthMedian: round2(item.growthMedian),
      }
    })
    .sort((a, b) => b.investabilityScore - a.investabilityScore)
}

export function buildCompanyTrendSeries(
  company: TechCompanyRecord,
  sources: CompanySourceRecord[],
  points: number = 6
) {
  const now = new Date()
  const months = Array.from({ length: points }).map((_, index) => {
    const date = new Date(now.getFullYear(), now.getMonth() - (points - index - 1), 1)
    return {
      key: `${date.getFullYear()}-${date.getMonth()}`,
      label: date.toLocaleDateString('en-US', { month: 'short' }),
      start: date.getTime(),
      end: new Date(date.getFullYear(), date.getMonth() + 1, 1).getTime(),
    }
  })

  const sourceCounts = months.map((month) =>
    sources.filter((source) => {
      if (!source.fetchedAt) return false
      const ts = source.fetchedAt.getTime()
      return ts >= month.start && ts < month.end
    }).length
  )

  const totalEvents = sourceCounts.reduce((sum, value) => sum + value, 0)
  const currentTeam = Math.max(1, Number(company.teamSize ?? 1))
  const currentRevenue = Math.max(1, revenueRangeToValue(company.revenueRange))
  const baseTeam = Math.max(1, Math.round(currentTeam * 0.65))
  const baseRevenue = Math.max(1, Math.round(currentRevenue * 0.6))

  return months.map((month, index) => {
    const ratio = points === 1 ? 1 : index / (points - 1)
    const activityBoost = totalEvents > 0 ? sourceCounts[index] / totalEvents : 0
    return {
      month: month.label,
      teamSize: Math.round(baseTeam + (currentTeam - baseTeam) * ratio + activityBoost * 10),
      revenueUsd: Math.round(
        baseRevenue + (currentRevenue - baseRevenue) * ratio + activityBoost * 25_000
      ),
      sourceEvents: sourceCounts[index],
    }
  })
}
