import { NextRequest, NextResponse } from 'next/server'
import { and, eq } from 'drizzle-orm'
import { revalidateTag } from 'next/cache'
import { getSession } from '@/lib/auth/server'
import { db } from '@/lib/db'
import { alertPreferences } from '@/lib/db/schema'

const FREQUENCIES = new Set(['realtime', 'daily', 'weekly', 'off'])

type AlertBody = {
  newMatchFrequency: string
  deadline7day: boolean
  deadline48hr: boolean
  tenderUpdate: boolean
  weeklyDigest: boolean
}

export async function GET() {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const orgId = session.session.activeOrganizationId || session.user.id
  const userId = session.user.id

  const rows = await db
    .select({
      newMatchFrequency: alertPreferences.newMatchFrequency,
      deadline7day: alertPreferences.deadline7day,
      deadline48hr: alertPreferences.deadline48hr,
      tenderUpdate: alertPreferences.tenderUpdate,
      weeklyDigest: alertPreferences.weeklyDigest,
    })
    .from(alertPreferences)
    .where(and(eq(alertPreferences.orgId, orgId), eq(alertPreferences.userId, userId)))
    .limit(1)

  return NextResponse.json({
    preferences: rows[0] ?? {
      newMatchFrequency: 'realtime',
      deadline7day: true,
      deadline48hr: true,
      tenderUpdate: true,
      weeklyDigest: true,
    },
  })
}

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const orgId = session.session.activeOrganizationId || session.user.id
  const userId = session.user.id
  const body = (await req.json()) as Partial<AlertBody>

  const newMatchFrequency = typeof body.newMatchFrequency === 'string' ? body.newMatchFrequency : 'realtime'
  const deadline7day = Boolean(body.deadline7day)
  const deadline48hr = Boolean(body.deadline48hr)
  const tenderUpdate = Boolean(body.tenderUpdate)
  const weeklyDigest = Boolean(body.weeklyDigest)

  if (!FREQUENCIES.has(newMatchFrequency)) {
    return NextResponse.json({ error: 'Invalid newMatchFrequency' }, { status: 400 })
  }

  const payload = {
    newMatchFrequency,
    deadline7day,
    deadline48hr,
    tenderUpdate,
    weeklyDigest,
    updatedAt: new Date(),
  }

  await db
    .insert(alertPreferences)
    .values({
      orgId,
      userId,
      ...payload,
    })
    .onConflictDoUpdate({
      target: [alertPreferences.orgId, alertPreferences.userId],
      set: payload,
    })

  revalidateTag('alerts', 'default')

  return NextResponse.json({ ok: true, preferences: payload })
}
