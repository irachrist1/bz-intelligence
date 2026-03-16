import { and, eq, gte } from 'drizzle-orm'
import { profileMatchesTender, type TenderMatchInput } from '@/lib/alerts/match'
import { db } from '@/lib/db'
import { alertPreferences, firmProfiles, member, tenders, user } from '@/lib/db/schema'
import { sendWeeklyDigestEmail } from '@/lib/email'

const WEEK_MS = 7 * 86_400_000

type WeeklyDigestProfile = {
  orgId: string
  serviceCategories: string[] | null
  sectors: string[] | null
  fundingSources: string[] | null
  contractSizeMinUsd: number | null
  contractSizeMaxUsd: number | null
  keywordsInclude: string[] | null
  keywordsExclude: string[] | null
}

type WeeklyDigestPreference = {
  userId: string
  orgId: string
  weeklyDigest: boolean | null
  newMatchFrequency: string | null
}

export type WeeklyDigestRecipient = {
  userId: string
  orgId: string
  email: string
  name: string
}

export type WeeklyDigestSendResult = {
  sent: boolean
  matchedCount: number
  reason?: 'email_not_configured' | 'no_matches'
}

export function isWeeklyDigestEmailConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY)
}

export function getWeeklyDigestWindow(now = new Date()) {
  const weekAgo = new Date(now.getTime() - WEEK_MS)

  return {
    weekAgo,
    weekStart: weekAgo,
  }
}

export async function getRecentWeeklyDigestTenders(now = new Date()): Promise<TenderMatchInput[]> {
  const { weekAgo } = getWeeklyDigestWindow(now)

  return db
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
}

export async function getWeeklyDigestProfileMap(): Promise<Map<string, WeeklyDigestProfile>> {
  const profiles = await db
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

  return new Map(profiles.map((profile) => [profile.orgId, profile]))
}

function shouldReceiveWeeklyDigest(preference?: WeeklyDigestPreference): boolean {
  if (!preference) return true

  return preference.weeklyDigest === true || preference.newMatchFrequency === 'weekly'
}

export async function listWeeklyDigestRecipients(): Promise<WeeklyDigestRecipient[]> {
  const [users, memberships, preferences, profiles] = await Promise.all([
    db.select({ id: user.id, email: user.email, name: user.name }).from(user),
    db.select({ userId: member.userId, orgId: member.organizationId }).from(member),
    db
      .select({
        userId: alertPreferences.userId,
        orgId: alertPreferences.orgId,
        weeklyDigest: alertPreferences.weeklyDigest,
        newMatchFrequency: alertPreferences.newMatchFrequency,
      })
      .from(alertPreferences),
    db.select({ orgId: firmProfiles.orgId }).from(firmProfiles),
  ])

  const userMap = new Map(users.map((row) => [row.id, row]))
  const recipientMap = new Map<string, WeeklyDigestRecipient>()
  const membershipCounts = new Map<string, number>()
  const standaloneProfileOrgIds = new Set(profiles.map((profile) => profile.orgId))
  const preferenceKeys = new Set<string>()

  for (const membership of memberships) {
    membershipCounts.set(
      membership.userId,
      (membershipCounts.get(membership.userId) ?? 0) + 1
    )
  }

  for (const preference of preferences) {
    const key = `${preference.orgId}:${preference.userId}`
    preferenceKeys.add(key)

    if (!shouldReceiveWeeklyDigest(preference)) continue

    const recipient = userMap.get(preference.userId)
    if (!recipient) continue

    recipientMap.set(key, {
      userId: preference.userId,
      orgId: preference.orgId,
      email: recipient.email,
      name: recipient.name,
    })
  }

  for (const membership of memberships) {
    const key = `${membership.orgId}:${membership.userId}`

    if (preferenceKeys.has(key)) continue

    const recipient = userMap.get(membership.userId)
    if (!recipient) continue

    recipientMap.set(key, {
      userId: membership.userId,
      orgId: membership.orgId,
      email: recipient.email,
      name: recipient.name,
    })
  }

  for (const recipient of users) {
    if ((membershipCounts.get(recipient.id) ?? 0) > 0) continue
    if (!standaloneProfileOrgIds.has(recipient.id)) continue

    const key = `${recipient.id}:${recipient.id}`
    if (preferenceKeys.has(key)) continue

    recipientMap.set(key, {
      userId: recipient.id,
      orgId: recipient.id,
      email: recipient.email,
      name: recipient.name,
    })
  }

  return Array.from(recipientMap.values())
}

export function getWeeklyDigestMatchesForOrg(
  orgId: string,
  recentTenders: TenderMatchInput[],
  profileMap: Map<string, WeeklyDigestProfile>
): TenderMatchInput[] {
  const profile = profileMap.get(orgId)

  return profile
    ? recentTenders.filter((tender) => profileMatchesTender(profile, tender))
    : recentTenders
}

export async function sendWeeklyDigestToRecipient(opts: {
  recipient: WeeklyDigestRecipient
  recentTenders: TenderMatchInput[]
  profileMap: Map<string, WeeklyDigestProfile>
  weekStart: Date
}): Promise<WeeklyDigestSendResult> {
  if (!isWeeklyDigestEmailConfigured()) {
    return { sent: false, matchedCount: 0, reason: 'email_not_configured' }
  }

  const matchingTenders = getWeeklyDigestMatchesForOrg(
    opts.recipient.orgId,
    opts.recentTenders,
    opts.profileMap
  )

  if (matchingTenders.length === 0) {
    return { sent: false, matchedCount: 0, reason: 'no_matches' }
  }

  await sendWeeklyDigestEmail({
    email: opts.recipient.email,
    name: opts.recipient.name,
    tenders: matchingTenders,
    weekStart: opts.weekStart,
  })

  return { sent: true, matchedCount: matchingTenders.length }
}
