import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth/server'
import { db } from '@/lib/db'
import { businessProfiles } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'

export async function GET() {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const orgId = session.session.activeOrganizationId || session.user.id
  const rows = await db
    .select()
    .from(businessProfiles)
    .where(and(eq(businessProfiles.orgId, orgId), eq(businessProfiles.userId, session.user.id)))
    .limit(1)

  return NextResponse.json({ profile: rows[0] ?? null })
}
