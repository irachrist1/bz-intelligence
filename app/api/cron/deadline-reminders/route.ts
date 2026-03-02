import { NextRequest, NextResponse } from 'next/server'
import { and, between, eq, gt } from 'drizzle-orm'
import { db } from '@/lib/db'
import { alertPreferences, tenderSaves, tenders } from '@/lib/db/schema'
import { user } from '@/lib/db/schema'
import { sendDeadlineReminderEmail } from '@/lib/email'

// Vercel Cron calls this with Authorization: Bearer <CRON_SECRET>
function verifyCronSecret(req: NextRequest): boolean {
  const expected = process.env.CRON_SECRET
  if (!expected) return true // allow in development when not set
  return req.headers.get('authorization') === `Bearer ${expected}`
}

export async function GET(req: NextRequest) {
  if (!verifyCronSecret(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const now = new Date()
  const sent: string[] = []

  try {
    // ── 7-day window: deadline between 6 and 8 days from now ──────────────────
    const low7 = new Date(now.getTime() + 6 * 86_400_000)
    const high7 = new Date(now.getTime() + 8 * 86_400_000)

    const upcoming7 = await db
      .select({
        tenderId: tenderSaves.tenderId,
        orgId: tenderSaves.orgId,
        userId: alertPreferences.userId,
        deadline7day: alertPreferences.deadline7day,
        title: tenders.title,
        source: tenders.source,
        issuingOrg: tenders.issuingOrg,
        fundingSource: tenders.fundingSource,
        deadlineSubmission: tenders.deadlineSubmission,
        estimatedValueUsd: tenders.estimatedValueUsd,
        sourceUrl: tenders.sourceUrl,
        userName: user.name,
        userEmail: user.email,
      })
      .from(tenderSaves)
      .innerJoin(
        tenders,
        and(
          eq(tenderSaves.tenderId, tenders.id),
          eq(tenders.status, 'open'),
          between(tenders.deadlineSubmission, low7, high7)
        )
      )
      .innerJoin(
        alertPreferences,
        and(
          eq(tenderSaves.orgId, alertPreferences.orgId),
          eq(alertPreferences.deadline7day, true)
        )
      )
      .innerJoin(user, eq(alertPreferences.userId, user.id))

    for (const row of upcoming7) {
      if (!row.userEmail || !row.deadlineSubmission) continue
      const hoursUntil = (row.deadlineSubmission.getTime() - now.getTime()) / 3_600_000
      await sendDeadlineReminderEmail({
        email: row.userEmail,
        name: row.userName,
        tender: {
          id: row.tenderId,
          title: row.title,
          source: row.source,
          issuingOrg: row.issuingOrg,
          fundingSource: row.fundingSource,
          deadlineSubmission: row.deadlineSubmission,
          estimatedValueUsd: row.estimatedValueUsd,
          sourceUrl: row.sourceUrl,
        },
        hoursUntilDeadline: hoursUntil,
      }).catch((err) => console.error('[deadline-reminders] 7-day send failed:', err))
      sent.push(`7d:${row.tenderId}:${row.userEmail}`)
    }

    // ── 48-hour window: deadline between 24 and 56 hours from now ─────────────
    const low48 = new Date(now.getTime() + 24 * 3_600_000)
    const high48 = new Date(now.getTime() + 56 * 3_600_000)

    const upcoming48 = await db
      .select({
        tenderId: tenderSaves.tenderId,
        orgId: tenderSaves.orgId,
        userId: alertPreferences.userId,
        deadline48hr: alertPreferences.deadline48hr,
        title: tenders.title,
        source: tenders.source,
        issuingOrg: tenders.issuingOrg,
        fundingSource: tenders.fundingSource,
        deadlineSubmission: tenders.deadlineSubmission,
        estimatedValueUsd: tenders.estimatedValueUsd,
        sourceUrl: tenders.sourceUrl,
        userName: user.name,
        userEmail: user.email,
      })
      .from(tenderSaves)
      .innerJoin(
        tenders,
        and(
          eq(tenderSaves.tenderId, tenders.id),
          eq(tenders.status, 'open'),
          between(tenders.deadlineSubmission, low48, high48)
        )
      )
      .innerJoin(
        alertPreferences,
        and(
          eq(tenderSaves.orgId, alertPreferences.orgId),
          eq(alertPreferences.deadline48hr, true)
        )
      )
      .innerJoin(user, eq(alertPreferences.userId, user.id))

    for (const row of upcoming48) {
      if (!row.userEmail || !row.deadlineSubmission) continue
      const hoursUntil = (row.deadlineSubmission.getTime() - now.getTime()) / 3_600_000
      await sendDeadlineReminderEmail({
        email: row.userEmail,
        name: row.userName,
        tender: {
          id: row.tenderId,
          title: row.title,
          source: row.source,
          issuingOrg: row.issuingOrg,
          fundingSource: row.fundingSource,
          deadlineSubmission: row.deadlineSubmission,
          estimatedValueUsd: row.estimatedValueUsd,
          sourceUrl: row.sourceUrl,
        },
        hoursUntilDeadline: hoursUntil,
      }).catch((err) => console.error('[deadline-reminders] 48hr send failed:', err))
      sent.push(`48h:${row.tenderId}:${row.userEmail}`)
    }
  } catch (err) {
    console.error('[deadline-reminders] Cron failed:', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }

  console.log(`[deadline-reminders] Sent ${sent.length} reminder(s)`)
  return NextResponse.json({ ok: true, sent: sent.length })
}
