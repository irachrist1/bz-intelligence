import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth/server'
import { db } from '@/lib/db'
import { businessProfiles } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'
import { sendWelcomeEmail } from '@/lib/email'

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { user } = session
  const orgId = session.session.activeOrganizationId || user.id // fallback to userId if no org yet

  const body = await req.json()
  const {
    bizName, bizType, sector, subSector, customerType, currentStatus,
    handlesMoney, collectsData, foreignOwnership, operatesProvince, employeeRange,
    transactionType,
  } = body

  const profileData = {
    bizName: bizName || null,
    bizType: bizType || null,
    sector: sector || null,
    subSector: subSector || [],
    customerType: customerType || null,
    currentStatus: currentStatus || null,
    handlesMoney: handlesMoney ?? false,
    collectsData: collectsData ?? false,
    foreignOwnership: foreignOwnership ?? false,
    operatesProvince: operatesProvince ?? false,
    employeeRange: employeeRange || null,
    transactionType: transactionType || [],
    updatedAt: new Date(),
  }

  // Upsert business profile
  const existing = await db
    .select()
    .from(businessProfiles)
    .where(and(eq(businessProfiles.orgId, orgId), eq(businessProfiles.userId, user.id)))
    .limit(1)

  const isNewProfile = existing.length === 0

  if (isNewProfile) {
    await db.insert(businessProfiles).values({ orgId, userId: user.id, ...profileData })
  } else {
    await db
      .update(businessProfiles)
      .set(profileData)
      .where(eq(businessProfiles.id, existing[0].id))
  }

  // Send welcome email on first onboarding completion (fire-and-forget, never blocks)
  if (isNewProfile && user.email) {
    const appMode = body.appMode || 'compliance'
    sendWelcomeEmail({
      email: user.email,
      name: user.name,
      sector: sector || null,
      mode: appMode,
    }).catch((err) => console.error('Welcome email failed (non-blocking):', err))
  }

  return NextResponse.json({ ok: true })
}
