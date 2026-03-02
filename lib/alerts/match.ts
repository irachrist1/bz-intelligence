import { and, inArray, ne } from 'drizzle-orm'
import { db } from '@/lib/db'
import { alertPreferences, firmProfiles } from '@/lib/db/schema'
import { user } from '@/lib/db/schema'

export type TenderMatchInput = {
  id: string
  title: string
  source: string
  issuingOrg: string
  fundingSource: string | null
  categoryTags: string[] | null
  description: string | null
  aiSummary: string | null
  estimatedValueUsd: number | null
  deadlineSubmission: Date | null
  sourceUrl: string
}

export type MatchedRecipient = {
  userId: string
  email: string
  name: string
  frequency: string
}

type FirmProfile = {
  orgId: string
  serviceCategories: string[] | null
  sectors: string[] | null
  fundingSources: string[] | null
  contractSizeMinUsd: number | null
  contractSizeMaxUsd: number | null
  keywordsInclude: string[] | null
  keywordsExclude: string[] | null
}

export function profileMatchesTender(profile: FirmProfile, tender: TenderMatchInput): boolean {
  const searchText = [tender.title, tender.description, tender.aiSummary]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()

  // Exclude keywords — any hit disqualifies the tender
  for (const kw of profile.keywordsExclude ?? []) {
    if (kw && searchText.includes(kw.toLowerCase())) return false
  }

  // Include keywords — at least one must be present if any are specified
  const includeKws = (profile.keywordsInclude ?? []).filter(Boolean)
  if (includeKws.length > 0) {
    const anyMatch = includeKws.some((kw) => searchText.includes(kw.toLowerCase()))
    if (!anyMatch) return false
  }

  // Category / sector overlap — only filter when both sides have tags
  const profileTags = [...(profile.serviceCategories ?? []), ...(profile.sectors ?? [])]
    .filter(Boolean)
    .map((t) => t.toLowerCase())
  const tenderTags = (tender.categoryTags ?? []).map((t) => t.toLowerCase())

  if (profileTags.length > 0 && tenderTags.length > 0) {
    const hasOverlap = profileTags.some((pt) =>
      tenderTags.some((tt) => tt.includes(pt) || pt.includes(tt))
    )
    if (!hasOverlap) return false
  }

  // Funding source — skip filter if profile has 'all' or no preferences set
  const fundingSources = (profile.fundingSources ?? []).filter(Boolean).map((f) => f.toLowerCase())
  if (fundingSources.length > 0 && !fundingSources.includes('all') && tender.fundingSource) {
    if (!fundingSources.includes(tender.fundingSource.toLowerCase())) return false
  }

  // Contract size — only filter when both sides have values; apply 50%/200% slack
  if (
    profile.contractSizeMinUsd != null &&
    profile.contractSizeMaxUsd != null &&
    tender.estimatedValueUsd != null
  ) {
    if (
      tender.estimatedValueUsd < profile.contractSizeMinUsd * 0.5 ||
      tender.estimatedValueUsd > profile.contractSizeMaxUsd * 2
    ) {
      return false
    }
  }

  return true
}

/**
 * Given a tender, return the list of users who should receive an alert.
 * Only returns users whose newMatchFrequency is not 'off'.
 */
export async function matchTenderToProfiles(
  tender: TenderMatchInput
): Promise<MatchedRecipient[]> {
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

  const matchingOrgIds = allProfiles
    .filter((p) => profileMatchesTender(p, tender))
    .map((p) => p.orgId)

  if (matchingOrgIds.length === 0) return []

  const prefs = await db
    .select({
      userId: alertPreferences.userId,
      orgId: alertPreferences.orgId,
      frequency: alertPreferences.newMatchFrequency,
    })
    .from(alertPreferences)
    .where(
      and(
        inArray(alertPreferences.orgId, matchingOrgIds),
        ne(alertPreferences.newMatchFrequency, 'off')
      )
    )

  if (prefs.length === 0) return []

  const userIds = [...new Set(prefs.map((p) => p.userId))]
  const users = await db
    .select({ id: user.id, email: user.email, name: user.name })
    .from(user)
    .where(inArray(user.id, userIds))

  const userMap = new Map(users.map((u) => [u.id, u]))

  return prefs
    .map((pref) => {
      const u = userMap.get(pref.userId)
      if (!u) return null
      return {
        userId: u.id,
        email: u.email,
        name: u.name,
        frequency: pref.frequency ?? 'realtime',
      }
    })
    .filter((r): r is MatchedRecipient => r !== null)
}
