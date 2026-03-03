import Link from 'next/link'
import { redirect } from 'next/navigation'
import { and, desc, eq, gte, ilike, lte, or, sql } from 'drizzle-orm'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { getSession } from '@/lib/auth/server'
import { db } from '@/lib/db'
import { techCompanies } from '@/lib/db/schema'

const PAGE_SIZE = 20

type ExplorerSearchParams = {
  industry?: string
  revenue?: string
  team?: string
  q?: string
  page?: string
}

function teamBounds(bucket: string): { min?: number; max?: number } {
  if (bucket === '1-10') return { min: 1, max: 10 }
  if (bucket === '11-50') return { min: 11, max: 50 }
  if (bucket === '51-200') return { min: 51, max: 200 }
  if (bucket === '200+') return { min: 201 }
  return {}
}

function makeQueryString(params: ExplorerSearchParams): string {
  const query = new URLSearchParams()
  if (params.industry) query.set('industry', params.industry)
  if (params.revenue) query.set('revenue', params.revenue)
  if (params.team) query.set('team', params.team)
  if (params.q) query.set('q', params.q)
  if (params.page) query.set('page', params.page)
  const output = query.toString()
  return output ? `?${output}` : ''
}

export default async function EcosystemExplorerPage({
  searchParams,
}: {
  searchParams: Promise<ExplorerSearchParams>
}) {
  const session = await getSession()
  if (!session) redirect('/sign-in')

  const params = await searchParams
  const page = Math.max(1, Number(params.page || 1) || 1)
  const q = params.q?.trim() ?? ''
  const conditions = []

  if (params.industry && params.industry !== 'all') {
    conditions.push(eq(techCompanies.industry, params.industry))
  }
  if (params.revenue && params.revenue !== 'all') {
    conditions.push(eq(techCompanies.revenueRange, params.revenue))
  }
  if (params.team && params.team !== 'all') {
    const bounds = teamBounds(params.team)
    if (typeof bounds.min === 'number') conditions.push(gte(techCompanies.teamSize, bounds.min))
    if (typeof bounds.max === 'number') conditions.push(lte(techCompanies.teamSize, bounds.max))
  }
  if (q) {
    conditions.push(
      or(ilike(techCompanies.name, `%${q}%`), ilike(techCompanies.description, `%${q}%`))!
    )
  }

  const where = conditions.length > 0 ? and(...conditions) : undefined
  const [rows, countRows] = await Promise.all([
    db
      .select()
      .from(techCompanies)
      .where(where)
      .orderBy(desc(techCompanies.score), desc(techCompanies.updatedAt))
      .limit(PAGE_SIZE)
      .offset((page - 1) * PAGE_SIZE),
    db
      .select({ count: sql<number>`count(*)` })
      .from(techCompanies)
      .where(where),
  ])

  const total = Number(countRows[0]?.count ?? 0)
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))
  const currentParams: ExplorerSearchParams = {
    industry: params.industry,
    revenue: params.revenue,
    team: params.team,
    q,
  }

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-4">
      <div className="flex items-end justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100 mb-1">Company Explorer</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">Filter and export Rwanda tech company records.</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary">{total} companies</Badge>
          <Link
            href={`/api/ecosystem/export.csv${makeQueryString(currentParams)}`}
            className="inline-flex h-9 items-center rounded-md border border-zinc-200 dark:border-zinc-800 px-3 text-sm text-zinc-600 dark:text-zinc-300 hover:border-zinc-400"
          >
            Export CSV
          </Link>
        </div>
      </div>

      <form className="grid grid-cols-1 md:grid-cols-5 gap-2">
        <div className="md:col-span-2">
          <Input name="q" defaultValue={q} placeholder="Search name or description..." />
        </div>
        <select
          name="industry"
          defaultValue={params.industry || 'all'}
          className="h-10 rounded-md border border-zinc-200 dark:border-zinc-800 bg-transparent px-3 text-sm"
        >
          <option value="all">All industries</option>
          <option value="FinTech">FinTech</option>
          <option value="AgriTech">AgriTech</option>
          <option value="HealthTech">HealthTech</option>
          <option value="EdTech">EdTech</option>
          <option value="CleanTech">CleanTech</option>
          <option value="TransportTech">TransportTech</option>
        </select>
        <select
          name="revenue"
          defaultValue={params.revenue || 'all'}
          className="h-10 rounded-md border border-zinc-200 dark:border-zinc-800 bg-transparent px-3 text-sm"
        >
          <option value="all">All revenue</option>
          <option value="0-50k">0-50k</option>
          <option value="50k-250k">50k-250k</option>
          <option value="250k-1m">250k-1m</option>
          <option value="1m+">1m+</option>
        </select>
        <select
          name="team"
          defaultValue={params.team || 'all'}
          className="h-10 rounded-md border border-zinc-200 dark:border-zinc-800 bg-transparent px-3 text-sm"
        >
          <option value="all">All team sizes</option>
          <option value="1-10">1-10</option>
          <option value="11-50">11-50</option>
          <option value="51-200">51-200</option>
          <option value="200+">200+</option>
        </select>
        <button
          type="submit"
          className="h-10 rounded-md bg-zinc-900 text-white text-sm font-medium hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
        >
          Apply Filters
        </button>
      </form>

      <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-x-auto bg-white dark:bg-zinc-900">
        <table className="w-full text-sm">
          <thead className="bg-zinc-50 dark:bg-zinc-950/40">
            <tr className="text-left">
              <th className="px-3 py-2 font-medium">Company</th>
              <th className="px-3 py-2 font-medium">Industry</th>
              <th className="px-3 py-2 font-medium">Revenue</th>
              <th className="px-3 py-2 font-medium">Team</th>
              <th className="px-3 py-2 font-medium">Score</th>
              <th className="px-3 py-2 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td className="px-3 py-6 text-zinc-500 dark:text-zinc-400" colSpan={6}>
                  No companies match the current filters.
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr key={row.id} className="border-t border-zinc-100 dark:border-zinc-800">
                  <td className="px-3 py-2.5">
                    <Link href={`/ecosystem/${row.slug}`} className="font-medium hover:underline">
                      {row.name}
                    </Link>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 line-clamp-1">
                      {row.description || 'No description'}
                    </p>
                  </td>
                  <td className="px-3 py-2.5">{row.industry}</td>
                  <td className="px-3 py-2.5">{row.revenueRange || 'N/A'}</td>
                  <td className="px-3 py-2.5">{row.teamSize ?? 'N/A'}</td>
                  <td className="px-3 py-2.5">{Number(row.score ?? 0).toFixed(2)}</td>
                  <td className="px-3 py-2.5">
                    <Badge variant={row.status === 'verified' ? 'secondary' : 'outline'}>{row.status}</Badge>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between">
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          Page {page} of {totalPages}
        </p>
        <div className="flex gap-2">
          <Link
            href={makeQueryString({ ...currentParams, page: String(Math.max(page - 1, 1)) })}
            className="inline-flex h-8 items-center rounded-md border border-zinc-200 dark:border-zinc-800 px-3 text-xs"
          >
            Previous
          </Link>
          <Link
            href={makeQueryString({ ...currentParams, page: String(Math.min(page + 1, totalPages)) })}
            className="inline-flex h-8 items-center rounded-md border border-zinc-200 dark:border-zinc-800 px-3 text-xs"
          >
            Next
          </Link>
        </div>
      </div>
    </div>
  )
}
