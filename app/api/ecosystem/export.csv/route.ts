import { and, eq, gte, ilike, lte, or } from 'drizzle-orm'
import { getSession } from '@/lib/auth/server'
import { db } from '@/lib/db'
import { techCompanies } from '@/lib/db/schema'

function teamBounds(bucket: string): { min?: number; max?: number } {
  if (bucket === '1-10') return { min: 1, max: 10 }
  if (bucket === '11-50') return { min: 11, max: 50 }
  if (bucket === '51-200') return { min: 51, max: 200 }
  if (bucket === '200+') return { min: 201 }
  return {}
}

function toCsv(rows: typeof techCompanies.$inferSelect[]): string {
  const headers = [
    'name',
    'slug',
    'industry',
    'description',
    'founded_year',
    'team_size',
    'revenue_range',
    'impact_metric',
    'score',
    'status',
    'website',
  ]
  const lines = rows.map((row) =>
    [
      row.name,
      row.slug,
      row.industry,
      row.description || '',
      row.foundedYear ?? '',
      row.teamSize ?? '',
      row.revenueRange || '',
      row.impactMetric || '',
      row.score ?? '',
      row.status,
      row.website || '',
    ]
      .map((value) => `"${String(value).replaceAll('"', '""')}"`)
      .join(',')
  )

  return [headers.join(','), ...lines].join('\n')
}

export async function GET(req: Request) {
  const session = await getSession()
  if (!session) return new Response('Unauthorized', { status: 401 })

  const url = new URL(req.url)
  const q = (url.searchParams.get('q') || '').trim()
  const industry = url.searchParams.get('industry') || 'all'
  const revenue = url.searchParams.get('revenue') || 'all'
  const team = url.searchParams.get('team') || 'all'

  const conditions = []
  if (industry !== 'all') conditions.push(eq(techCompanies.industry, industry))
  if (revenue !== 'all') conditions.push(eq(techCompanies.revenueRange, revenue))
  if (team !== 'all') {
    const bounds = teamBounds(team)
    if (typeof bounds.min === 'number') conditions.push(gte(techCompanies.teamSize, bounds.min))
    if (typeof bounds.max === 'number') conditions.push(lte(techCompanies.teamSize, bounds.max))
  }
  if (q) {
    conditions.push(
      or(ilike(techCompanies.name, `%${q}%`), ilike(techCompanies.description, `%${q}%`))!
    )
  }

  const where = conditions.length > 0 ? and(...conditions) : undefined
  const rows = await db.select().from(techCompanies).where(where)
  const csv = toCsv(rows)

  return new Response(csv, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': 'attachment; filename="tech-ecosystem-companies.csv"',
    },
  })
}
