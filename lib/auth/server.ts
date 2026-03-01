import { headers } from 'next/headers'
import { auth } from './index'
import { redirect } from 'next/navigation'

export async function getSession() {
  return auth.api.getSession({ headers: await headers() })
}

export async function requireSession() {
  const session = await getSession()
  if (!session) redirect('/sign-in')
  return session
}

export async function requireOrg() {
  const session = await requireSession()
  const orgId = session.session.activeOrganizationId
  if (!orgId) {
    redirect('/onboarding')
  }
  return { session, orgId }
}
