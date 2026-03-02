import { NextRequest, NextResponse } from 'next/server'
import { and, eq } from 'drizzle-orm'
import { revalidateTag } from 'next/cache'
import { getSession } from '@/lib/auth/server'
import { db } from '@/lib/db'
import { tenderSaves } from '@/lib/db/schema'

const STAGES = new Set(['watching', 'go', 'no_go', 'in_prep', 'submitted', 'won', 'lost'])

type SaveAction = 'save' | 'unsave' | 'update_stage'

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const orgId = session.session.activeOrganizationId || session.user.id
  const body = await req.json()
  const tenderId = typeof body.tenderId === 'string' ? body.tenderId : ''
  const action = body.action as SaveAction
  const stage = typeof body.stage === 'string' ? body.stage : undefined

  if (!tenderId) return NextResponse.json({ error: 'tenderId is required' }, { status: 400 })
  if (!['save', 'unsave', 'update_stage'].includes(action)) {
    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  }

  if (action === 'save') {
    await db
      .insert(tenderSaves)
      .values({
        orgId,
        tenderId,
        stage: 'watching',
      })
      .onConflictDoUpdate({
        target: [tenderSaves.orgId, tenderSaves.tenderId],
        set: {
          stage: 'watching',
          updatedAt: new Date(),
        },
      })
  }

  if (action === 'unsave') {
    await db
      .delete(tenderSaves)
      .where(and(eq(tenderSaves.orgId, orgId), eq(tenderSaves.tenderId, tenderId)))
  }

  if (action === 'update_stage') {
    if (!stage || !STAGES.has(stage)) {
      return NextResponse.json({ error: 'Valid stage is required' }, { status: 400 })
    }

    await db
      .insert(tenderSaves)
      .values({
        orgId,
        tenderId,
        stage,
      })
      .onConflictDoUpdate({
        target: [tenderSaves.orgId, tenderSaves.tenderId],
        set: {
          stage,
          updatedAt: new Date(),
        },
      })
  }

  revalidateTag('tenders', 'default')
  revalidateTag('pipeline', 'default')
  revalidateTag('saved', 'default')

  return NextResponse.json({ ok: true })
}
