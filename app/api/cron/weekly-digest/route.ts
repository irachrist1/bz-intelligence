import { NextRequest, NextResponse } from 'next/server'
import { and, eq, gte, or } from 'drizzle-orm'
import { db } from '@/lib/db'
import { alertPreferences, firmProfiles, tenders } from '@/lib/db/schema'
import { user } from '@/lib/db/schema'
import { profileMatchesTender, type TenderMatchInput } from '@/lib/alerts/match'
import { sendWeeklyDigestEmail } from '@/lib/email'

function verifyCronSecret(req: NextRequest): boolean {
  const expected = process.env.CRON_SECRET
  if (!expected) return true
  return req.headers.get('authorization') === `Bearer ${expected}`
}

export async function GET(req: NextRequest) {
  if (!verifyCronSecret(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const now = new Date()
  const weekAgo = new Date(now.getTime() - 7 * 86_400_000)
  const weekStart = new Date(now.getTime() - 7 * 86_400_000) // label for digest subject
  let digestsSent = 0

  try {
    // Tenders approved in the last 7 days (open only)
    const recentTenders = await db
      .select({
        id: tenders.id,
        title: tenders.title,
        source: tenders.source,
        issuingOrg: tenders.issuingOrg,
        fundingSource: tenders.fundingSource,
        categoryTags: tenders.categoryTags,
        description: tenders.description,
        aiSummary: tenders.aiSummary,
        estimatedValueUsd: tenders.estimatedValueUsd,
        deadlineSubmission: tenders.deadlineSubmission,
        sourceUrl: tenders.sourceUrl,
      })
      .from(tenders)
      .where(
        and(
          eq(tenders.reviewStatus, 'approved'),
          eq(tenders.status, 'open'),
          gte(tenders.updatedAt, weekAgo)
        )
      )

    if (recentTenders.length === 0) {
      console.log('[weekly-digest] No recent tenders — skipping digest run')
      return NextResponse.json({ ok: true, sent: 0, reason: 'no_recent_tenders' })
    }

    // Users with weekly digest enabled (weekly frequency OR weeklyDigest flag)
    const digestUsers = await db
      .select({
        userId: alertPreferences.userId,
        orgId: alertPreferences.orgId,
        weeklyDigest: alertPreferences.weeklyDigest,
        frequency: alertPreferences.newMatchFrequency,
      })
      .from(alertPreferences)
      .where(
        or(
          eq(alertPreferences.weeklyDigest, true),
          eq(alertPreferences.newMatchFrequency, 'weekly')
        )
      )

    if (digestUsers.length === 0) {
      return NextResponse.json({ ok: true, sent: 0, reason: 'no_digest_subscribers' })
    }

    // Build orgId → profile map (load all profiles, filter in JS)
    const allProfiles = await db
      .select({
        orgId: firmProfiles.orgId,
        serviceCategories: firmProfiles.serviceCategories,
        sectors: firmProfiles.sectors,
        fundingSources: firmProfiles.fundingSources,
        contractSizeMinUsd: firmProfiles.contractSizeMinUsd,
        contractSizeMaxUsd: firmProfiles.contractSizeMaxUsd,
        keywordsInclude: firmProfiles.keywordsInclude,
        keywordsExclude: firmProfiles.keywordsExclude,
      })
      .from(firmProfiles)

    const profileMap = new Map(allProfiles.map((p) => [p.orgId, p]))

    // Load user info for all subscribers
    const users = await db
      .select({ id: user.id, email: user.email, name: user.name })
      .from(user)

    const userMap = new Map(users.map((u) => [u.id, u]))

    // For each digest subscriber, find matching tenders and send
    for (const digestUser of digestUsers) {
      const profile = profileMap.get(digestUser.orgId)
      const userInfo = userMap.get(digestUser.userId)
      if (!userInfo) continue

      // Without a profile, send all recent tenders as a baseline
      const matchingTenders: TenderMatchInput[] = profile
        ? recentTenders.filter((t) => profileMatchesTender(profile, t as TenderMatchInput))
        : (recentTenders as TenderMatchInput[])

      if (matchingTenders.length === 0) continue

      await sendWeeklyDigestEmail({
        email: userInfo.email,
        name: userInfo.name,
        tenders: matchingTenders,
        weekStart,
      }).catch((err) => console.error('[weekly-digest] Send failed for', userInfo.email, err))

      digestsSent++
    }
  } catch (err) {
    console.error('[weekly-digest] Cron failed:', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }

  console.log(`[weekly-digest] Sent ${digestsSent} digest(s)`)
  return NextResponse.json({ ok: true, sent: digestsSent })
}
