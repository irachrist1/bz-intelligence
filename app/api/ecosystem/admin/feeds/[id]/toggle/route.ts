import { NextResponse } from 'next/server'
import { eq } from 'drizzle-orm'
import { z } from 'zod'
import { getAdminSession } from '@/lib/auth/admin'
import { db } from '@/lib/db'
import { sourceFeeds } from '@/lib/db/schema'

const bodySchema = z.object({
  enabled: z.boolean(),
})

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const adminSession = await getAdminSession()
  if (!adminSession) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { id } = await params
    const body = bodySchema.parse(await req.json())
    await db
      .update(sourceFeeds)
      .set({ enabled: body.enabled, updatedAt: new Date() })
      .where(eq(sourceFeeds.id, id))
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('[ecosystem-feed-toggle] Failed:', error)
    return NextResponse.json({ error: 'Could not update feed' }, { status: 500 })
  }
}
