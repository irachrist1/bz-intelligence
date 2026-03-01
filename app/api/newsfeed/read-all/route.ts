import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth/server'
import { db } from '@/lib/db'
import { newsItems, newsReads } from '@/lib/db/schema'
import { eq, and, notInArray } from 'drizzle-orm'

// POST /api/newsfeed/read-all
// Marks all reviewed news items as read for the current user.
export async function POST() {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const userId = session.user.id

  try {
    // Get all reviewed news item IDs
    const allItems = await db
      .select({ id: newsItems.id })
      .from(newsItems)
      .where(eq(newsItems.isReviewed, true))

    if (allItems.length === 0) return NextResponse.json({ ok: true, marked: 0 })

    // Get already-read IDs for this user
    const alreadyRead = await db
      .select({ newsItemId: newsReads.newsItemId })
      .from(newsReads)
      .where(eq(newsReads.userId, userId))

    const alreadyReadIds = new Set(alreadyRead.map((r) => r.newsItemId))
    const toMark = allItems.filter((item) => !alreadyReadIds.has(item.id))

    if (toMark.length > 0) {
      await db.insert(newsReads).values(
        toMark.map((item) => ({ userId, newsItemId: item.id }))
      )
    }

    return NextResponse.json({ ok: true, marked: toMark.length })
  } catch {
    return NextResponse.json({ error: 'Failed to mark as read' }, { status: 500 })
  }
}
