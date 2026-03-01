import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth/server'
import { db } from '@/lib/db'
import { newsReads } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'

// POST /api/newsfeed/read  { newsItemId }
// Marks an article as read for the current user. Idempotent.
export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { newsItemId } = await req.json()
  if (!newsItemId) return NextResponse.json({ error: 'newsItemId required' }, { status: 400 })

  const userId = session.user.id

  try {
    // Check if already read
    const existing = await db
      .select()
      .from(newsReads)
      .where(and(eq(newsReads.userId, userId), eq(newsReads.newsItemId, newsItemId)))
      .limit(1)

    if (existing.length === 0) {
      await db.insert(newsReads).values({ userId, newsItemId })
    }
    return NextResponse.json({ ok: true })
  } catch {
    // Table may not exist yet if db:push hasn't been run — fail silently
    return NextResponse.json({ ok: true })
  }
}

// GET /api/newsfeed/read  returns array of newsItemIds read by current user
export async function GET() {
  const session = await getSession()
  if (!session) return NextResponse.json({ readIds: [] })

  try {
    const rows = await db
      .select({ newsItemId: newsReads.newsItemId })
      .from(newsReads)
      .where(eq(newsReads.userId, session.user.id))
    return NextResponse.json({ readIds: rows.map((r) => r.newsItemId) })
  } catch {
    return NextResponse.json({ readIds: [] })
  }
}
