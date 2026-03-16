import { NextRequest, NextResponse } from 'next/server'
import {
  getRecentWeeklyDigestTenders,
  getWeeklyDigestProfileMap,
  getWeeklyDigestWindow,
  isWeeklyDigestEmailConfigured,
  listWeeklyDigestRecipients,
  sendWeeklyDigestToRecipient,
} from '@/lib/alerts/weekly-digest'

function verifyCronSecret(req: NextRequest): boolean {
  const expected = process.env.CRON_SECRET
  if (!expected) return true
  return req.headers.get('authorization') === `Bearer ${expected}`
}

export async function GET(req: NextRequest) {
  if (!verifyCronSecret(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!isWeeklyDigestEmailConfigured()) {
    return NextResponse.json({ ok: true, sent: 0, reason: 'email_not_configured' })
  }

  try {
    const now = new Date()
    const { weekStart } = getWeeklyDigestWindow(now)
    const [recentTenders, recipients, profileMap] = await Promise.all([
      getRecentWeeklyDigestTenders(now),
      listWeeklyDigestRecipients(),
      getWeeklyDigestProfileMap(),
    ])

    if (recentTenders.length === 0) {
      console.log('[weekly-digest] No recent tenders - skipping digest run')
      return NextResponse.json({ ok: true, sent: 0, reason: 'no_recent_tenders' })
    }

    if (recipients.length === 0) {
      return NextResponse.json({ ok: true, sent: 0, reason: 'no_digest_subscribers' })
    }

    let digestsSent = 0

    for (const recipient of recipients) {
      try {
        const result = await sendWeeklyDigestToRecipient({
          recipient,
          recentTenders,
          profileMap,
          weekStart,
        })

        if (result.sent) {
          digestsSent++
        }
      } catch (error) {
        console.error('[weekly-digest] Send failed for', recipient.email, error)
      }
    }

    console.log(`[weekly-digest] Sent ${digestsSent} digest(s)`)
    return NextResponse.json({ ok: true, sent: digestsSent })
  } catch (error) {
    console.error('[weekly-digest] Cron failed:', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
