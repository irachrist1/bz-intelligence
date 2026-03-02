import { and, eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth/server'
import { alertPreferences } from '@/lib/db/schema'
import { AlertsForm } from '@/components/alerts/alerts-form'

export default async function AlertsPage() {
  const session = await getSession()
  const orgId = session?.session.activeOrganizationId || session?.user.id
  const userId = session?.user.id

  const fallback = {
    newMatchFrequency: 'realtime',
    deadline7day: true,
    deadline48hr: true,
    tenderUpdate: true,
    weeklyDigest: true,
  }

  const raw = (!orgId || !userId)
    ? null
    : (await db
      .select({
        newMatchFrequency: alertPreferences.newMatchFrequency,
        deadline7day: alertPreferences.deadline7day,
        deadline48hr: alertPreferences.deadline48hr,
        tenderUpdate: alertPreferences.tenderUpdate,
        weeklyDigest: alertPreferences.weeklyDigest,
      })
      .from(alertPreferences)
      .where(and(eq(alertPreferences.orgId, orgId), eq(alertPreferences.userId, userId)))
      .limit(1))[0] ?? null

  const preferences = raw
    ? {
        newMatchFrequency: raw.newMatchFrequency ?? 'realtime',
        deadline7day: raw.deadline7day ?? true,
        deadline48hr: raw.deadline48hr ?? true,
        tenderUpdate: raw.tenderUpdate ?? true,
        weeklyDigest: raw.weeklyDigest ?? true,
      }
    : fallback

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100 mb-1">Alerts</h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Configure how your team gets notified about new tenders and deadlines.
        </p>
      </div>

      <AlertsForm initialState={preferences} />
    </div>
  )
}
