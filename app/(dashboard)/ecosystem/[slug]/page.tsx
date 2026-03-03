import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { desc, eq } from 'drizzle-orm'
import { ArrowLeft, ExternalLink } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { getSession } from '@/lib/auth/server'
import { db } from '@/lib/db'
import { companySources, techCompanies } from '@/lib/db/schema'
import {
  buildCompanyTrendSeries,
  deriveCompanyMetrics,
  revenueRangeToValue,
} from '@/lib/ecosystem/analytics'
import { CompanyGrowthCharts } from '@/components/ecosystem/company-growth-charts'

export default async function EcosystemCompanyProfilePage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const session = await getSession()
  if (!session) redirect('/sign-in')

  const { slug } = await params
  const [companyRow, allCompanies] = await Promise.all([
    db
      .select()
      .from(techCompanies)
      .where(eq(techCompanies.slug, slug))
      .limit(1),
    db.select({ revenueRange: techCompanies.revenueRange }).from(techCompanies),
  ])
  const company = companyRow[0]
  if (!company) notFound()

  const sources = await db
    .select()
    .from(companySources)
    .where(eq(companySources.companyId, company.id))
    .orderBy(desc(companySources.fetchedAt))

  const maxRevenue = Math.max(1, ...allCompanies.map((row) => revenueRangeToValue(row.revenueRange)))
  const metrics = deriveCompanyMetrics(company, sources, maxRevenue)
  const trend = buildCompanyTrendSeries(company, sources)

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-4">
      <Link
        href="/ecosystem/explorer"
        className="inline-flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to explorer
      </Link>

      <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5">
        <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
          <div>
            <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100">{company.name}</h1>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">{company.description || 'No description available.'}</p>
          </div>
          <div className="flex gap-2">
            <Badge variant="outline">{company.industry}</Badge>
            <Badge variant={company.status === 'verified' ? 'secondary' : 'outline'}>{company.status}</Badge>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 px-3 py-2">
            <p className="text-xs text-zinc-500 dark:text-zinc-400">Score</p>
            <p className="text-lg font-semibold">{metrics.score.toFixed(2)}</p>
          </div>
          <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 px-3 py-2">
            <p className="text-xs text-zinc-500 dark:text-zinc-400">Team Size</p>
            <p className="text-lg font-semibold">{company.teamSize ?? 'N/A'}</p>
          </div>
          <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 px-3 py-2">
            <p className="text-xs text-zinc-500 dark:text-zinc-400">Revenue Range</p>
            <p className="text-lg font-semibold">{company.revenueRange || 'N/A'}</p>
          </div>
          <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 px-3 py-2">
            <p className="text-xs text-zinc-500 dark:text-zinc-400">Sources</p>
            <p className="text-lg font-semibold">{metrics.sourceCount}</p>
          </div>
        </div>

        <div className="mt-4">
          <CompanyGrowthCharts data={trend} />
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Verification Score Breakdown</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex items-center justify-between"><span>Quality (35%)</span><span>{metrics.scoreBreakdown.verificationQuality.toFixed(2)}</span></div>
            <div className="flex items-center justify-between"><span>Growth (25%)</span><span>{metrics.scoreBreakdown.growthProxy.toFixed(2)}</span></div>
            <div className="flex items-center justify-between"><span>Revenue (20%)</span><span>{metrics.scoreBreakdown.revenueTraction.toFixed(2)}</span></div>
            <div className="flex items-center justify-between"><span>Freshness (15%)</span><span>{metrics.scoreBreakdown.freshness.toFixed(2)}</span></div>
            <div className="flex items-center justify-between"><span>Completeness (5%)</span><span>{metrics.scoreBreakdown.completeness.toFixed(2)}</span></div>
            <div className="border-t border-zinc-200 dark:border-zinc-800 pt-2 mt-3 flex items-center justify-between font-medium">
              <span>Total</span>
              <span>{metrics.scoreBreakdown.total.toFixed(2)}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Company Metadata</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p><span className="text-zinc-500 dark:text-zinc-400">Founded Year:</span> {company.foundedYear ?? 'N/A'}</p>
            <p><span className="text-zinc-500 dark:text-zinc-400">Impact Metric:</span> {company.impactMetric || 'N/A'}</p>
            <p><span className="text-zinc-500 dark:text-zinc-400">Evidence Strength:</span> {metrics.evidenceStrong ? 'Strong' : 'Moderate'}</p>
            <p><span className="text-zinc-500 dark:text-zinc-400">Freshness (days):</span> {metrics.freshnessDays}</p>
            <p>
              <span className="text-zinc-500 dark:text-zinc-400">Website:</span>{' '}
              {company.website ? (
                <a href={company.website} target="_blank" rel="noopener noreferrer" className="text-blue-500 inline-flex items-center gap-1">
                  Visit
                  <ExternalLink className="h-3 w-3" />
                </a>
              ) : (
                'N/A'
              )}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Sources</CardTitle>
        </CardHeader>
        <CardContent>
          {sources.length === 0 ? (
            <p className="text-sm text-zinc-500 dark:text-zinc-400">No source records available yet.</p>
          ) : (
            <div className="space-y-2">
              {sources.map((source) => (
                <div
                  key={source.id}
                  className="rounded-lg border border-zinc-200 dark:border-zinc-800 px-3 py-2 flex items-center justify-between gap-3"
                >
                  <div className="min-w-0">
                    <a
                      href={source.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-500 hover:underline line-clamp-1"
                    >
                      {source.url}
                    </a>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">
                      {source.sourceType} · fetched{' '}
                      {source.fetchedAt
                        ? source.fetchedAt.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
                        : 'N/A'}
                    </p>
                  </div>
                  <Badge variant="outline">{Number(source.attributionScore ?? 0).toFixed(2)}</Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
