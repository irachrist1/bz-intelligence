import { headers } from 'next/headers'
import { auth } from './index'
import { redirect } from 'next/navigation'
import { cache } from 'react'

export const getSession = cache(async () => {
  return auth.api.getSession({ headers: await headers() })
})

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
