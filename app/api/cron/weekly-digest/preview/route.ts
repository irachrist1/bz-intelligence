import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth/server'
import {
  getRecentWeeklyDigestTenders,
  getWeeklyDigestProfileMap,
  getWeeklyDigestWindow,
  isWeeklyDigestEmailConfigured,
  sendWeeklyDigestToRecipient,
} from '@/lib/alerts/weekly-digest'

export async function POST() {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!isWeeklyDigestEmailConfigured()) {
    return NextResponse.json({ ok: true, sent: 0, reason: 'email_not_configured' })
  }

  try {
    const now = new Date()
    const orgId = session.session.activeOrganizationId || session.user.id
    const { weekStart } = getWeeklyDigestWindow(now)
    const [recentTenders, profileMap] = await Promise.all([
      getRecentWeeklyDigestTenders(now),
      getWeeklyDigestProfileMap(),
    ])

    if (recentTenders.length === 0) {
      return NextResponse.json({ ok: true, sent: 0, reason: 'no_recent_tenders' })
    }

    const result = await sendWeeklyDigestToRecipient({
      recipient: {
        userId: session.user.id,
        orgId,
        email: session.user.email,
        name: session.user.name,
      },
      recentTenders,
      profileMap,
      weekStart,
    })

    return NextResponse.json({
      ok: true,
      sent: result.sent ? 1 : 0,
      ...(result.reason ? { reason: result.reason } : {}),
    })
  } catch (error) {
    console.error('[weekly-digest-preview] Preview failed:', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
