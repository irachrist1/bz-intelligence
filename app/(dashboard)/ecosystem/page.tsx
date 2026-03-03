import Link from 'next/link'
import { redirect } from 'next/navigation'
import { desc, eq } from 'drizzle-orm'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { getSession } from '@/lib/auth/server'
import { db } from '@/lib/db'
import { companyCandidates, companySources, techCompanies } from '@/lib/db/schema'
import { buildOpportunityMatrix, deriveCompanyMetrics } from '@/lib/ecosystem/analytics'
import { OpportunityMatrixChart } from '@/components/ecosystem/opportunity-matrix-chart'

export const revalidate = 300

export default async function EcosystemOverviewPage() {
  const session = await getSession()
  if (!session) redirect('/sign-in')

  const [companies, candidates, sources] = await Promise.all([
    db.select().from(techCompanies),
    db.select().from(companyCandidates).where(eq(companyCandidates.status, 'pending')),
    db.select().from(companySources),
  ])

  const verifiedCompanies = companies.filter((company) => company.status === 'verified')
  const sourcesByCompany = new Map<string, typeof sources>()
  for (const source of sources) {
    const list = sourcesByCompany.get(source.companyId) ?? []
    list.push(source)
    sourcesByCompany.set(source.companyId, list)
  }

  const maxRevenue = Math.max(
    1,
    ...verifiedCompanies.map((company) => {
      if (!company.revenueRange) return 0
      if (company.revenueRange === '0-50k') return 25_000
      if (company.revenueRange === '50k-250k') return 150_000
      if (company.revenueRange === '250k-1m') return 625_000
      if (company.revenueRange === '1m+') return 1_500_000
      return 0
    })
  )

  const evidenceStrong = verifiedCompanies.filter((company) => {
    const metrics = deriveCompanyMetrics(company, sourcesByCompany.get(company.id) ?? [], maxRevenue)
    return metrics.evidenceStrong
  }).length
  const evidenceCoverage = verifiedCompanies.length
    ? Number(((evidenceStrong / verifiedCompanies.length) * 100).toFixed(1))
    : 0

  const now = Date.now()
  const recent30 = verifiedCompanies.filter((company) => {
    if (!company.updatedAt) return false
    return now - company.updatedAt.getTime() <= 30 * 86400000
  }).length
  const previous30 = verifiedCompanies.filter((company) => {
    if (!company.updatedAt) return false
    const age = now - company.updatedAt.getTime()
    return age > 30 * 86400000 && age <= 60 * 86400000
  }).length
  const growthTrend = previous30 > 0 ? Number((((recent30 - previous30) / previous30) * 100).toFixed(1)) : null

  const sectorCounts = [...verifiedCompanies.reduce((map, row) => {
    const key = row.industry || 'Unclassified'
    map.set(key, (map.get(key) ?? 0) + 1)
    return map
  }, new Map<string, number>()).entries()]
    .sort((a, b) => b[1] - a[1])

  const matrix = buildOpportunityMatrix(companies, sourcesByCompany)
  const recentIngestionRuns = await db.select().from(techCompanies).orderBy(desc(techCompanies.updatedAt)).limit(5)

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100 mb-1">Tech Ecosystem</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Rwanda company intelligence, verification quality, and sector momentum.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary">{verifiedCompanies.length} verified companies</Badge>
          <Link
            href="/ecosystem/explorer"
            className="inline-flex h-9 items-center rounded-md border border-zinc-200 dark:border-zinc-800 px-3 text-sm text-zinc-600 dark:text-zinc-300 hover:border-zinc-400"
          >
            Open Explorer
          </Link>
          <Link
            href="/ecosystem/admin"
            className="inline-flex h-9 items-center rounded-md border border-zinc-200 dark:border-zinc-800 px-3 text-sm text-zinc-600 dark:text-zinc-300 hover:border-zinc-400"
          >
            Admin
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Total Companies</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{companies.length}</p>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">{candidates.length} pending review</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Sector Leader</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{sectorCounts[0]?.[0] ?? 'N/A'}</p>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">{sectorCounts[0]?.[1] ?? 0} companies</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Growth Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">
              {growthTrend === null ? 'Baseline' : `${growthTrend >= 0 ? '+' : ''}${growthTrend}%`}
            </p>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">recent updates vs prior 30 days</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Evidence Coverage</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{evidenceCoverage}%</p>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">strong evidence (3+ fresh sources)</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <div className="xl:col-span-2">
          <h2 className="text-sm font-medium text-zinc-900 dark:text-zinc-100 mb-2">Sector Opportunity Matrix</h2>
          <OpportunityMatrixChart data={matrix} />
        </div>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Latest Updates</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {recentIngestionRuns.length === 0 ? (
              <p className="text-sm text-zinc-500 dark:text-zinc-400">No companies ingested yet.</p>
            ) : (
              recentIngestionRuns.map((company) => (
                <div key={company.id} className="rounded-lg border border-zinc-200 dark:border-zinc-800 p-2.5">
                  <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">{company.name}</p>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                    {company.industry} · Updated{' '}
                    {company.updatedAt
                      ? company.updatedAt.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
                      : 'N/A'}
                  </p>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Sector Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          {sectorCounts.length === 0 ? (
            <p className="text-sm text-zinc-500 dark:text-zinc-400">No verified companies to display.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-2">
              {sectorCounts.map(([industry, count]) => (
                <div
                  key={industry}
                  className="rounded-lg border border-zinc-200 dark:border-zinc-800 px-3 py-2 flex items-center justify-between"
                >
                  <span className="text-sm text-zinc-800 dark:text-zinc-200">{industry}</span>
                  <Badge variant="outline">{count}</Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
