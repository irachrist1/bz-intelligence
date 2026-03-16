import { redirect } from 'next/navigation'
import { eq } from 'drizzle-orm'
import { getSession } from '@/lib/auth/server'
import { db } from '@/lib/db'
import { firmProfiles } from '@/lib/db/schema'

// Gate: every /dashboard/** route requires a completed firm profile.
// Users without one are sent to /onboarding to fill it in first.
// Fails open on DB error to avoid blocking everyone on a transient outage.
export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession()
  if (!session) redirect('/sign-in')

  const orgId = session.session.activeOrganizationId || session.user.id

  // Default true so a DB error fails open (user gets through rather than being blocked).
  let hasProfile = true
  try {
    const rows = await db
      .select({ id: firmProfiles.id })
      .from(firmProfiles)
      .where(eq(firmProfiles.orgId, orgId))
      .limit(1)
    hasProfile = rows.length > 0
  } catch {
    console.error('[dashboard/layout] DB error checking firm profile — failing open')
  }

  if (!hasProfile) redirect('/onboarding')

  return <>{children}</>
}
