import { getSession } from './server'

function parseAdminEmails(): string[] {
  return (process.env.ADMIN_EMAILS || '')
    .split(',')
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean)
}

export function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false
  const allowList = parseAdminEmails()

  // MVP behavior: if no allowlist configured, allow authenticated users.
  if (allowList.length === 0) return true
  return allowList.includes(email.toLowerCase())
}

export async function getAdminSession() {
  const session = await getSession()
  if (!session) return null
  if (!isAdminEmail(session.user.email)) return null
  return session
}
