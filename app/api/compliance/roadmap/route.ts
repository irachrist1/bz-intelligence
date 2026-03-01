import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth/server'
import { db } from '@/lib/db'
import { businessProfiles, complianceSteps, complianceHistory } from '@/lib/db/schema'
import { eq, and, sql } from 'drizzle-orm'
import type { RoadmapEntry } from '@/lib/types'

export async function GET(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const orgId = session.session.activeOrganizationId || session.user.id

  // Get business profile
  const profiles = await db
    .select()
    .from(businessProfiles)
    .where(and(eq(businessProfiles.orgId, orgId), eq(businessProfiles.userId, session.user.id)))
    .limit(1)

  const profile = profiles[0]
  if (!profile) {
    return NextResponse.json({ steps: [], needsOnboarding: true })
  }

  // Fetch all steps that could apply (we filter in-app for flexibility)
  const allSteps = await db
    .select()
    .from(complianceSteps)
    .orderBy(complianceSteps.stepOrder)

  // Filter steps applicable to this business using trigger flags
  const applicableSteps = allSteps.filter((step) => {
    // Biz type filter — mandatory
    if (step.appliesBizType && step.appliesBizType.length > 0) {
      if (!profile.bizType || !step.appliesBizType.includes(profile.bizType)) return false
    }

    // Foreign ownership steps (virtual bizType 'foreign'): show only if foreignOwnership = true
    if (step.appliesBizType?.includes('foreign')) {
      return profile.foreignOwnership === true
    }

    // BNR money-handling steps: show only if the user handles money OR is a fintech
    // (foreign ownership BNR step above is already handled by the 'foreign' flag)
    if (step.regBodyCode === 'BNR') {
      return profile.handlesMoney || profile.sector === 'fintech'
    }

    // RISA data protection step: show if user collects data OR is in a data-heavy sector
    if (step.regBodyCode === 'RISA') {
      const dataHeavySectors = ['fintech', 'healthtech', 'ict']
      return profile.collectsData || (profile.sector ? dataHeavySectors.includes(profile.sector) : false)
    }

    // PAYE: skip if solo founder (no employees to pay)
    if (step.regBodyCode === 'RRA' && step.title.includes('PAYE')) {
      return profile.employeeRange !== '1'
    }

    // RSSB employee registration: skip if solo founder
    if (step.regBodyCode === 'RSSB') {
      return profile.employeeRange !== '1'
    }

    // Sector-based filter for remaining steps
    if (step.appliesSector && step.appliesSector.length > 0) {
      return profile.sector ? step.appliesSector.includes(profile.sector) : false
    }

    return true
  })

  if (applicableSteps.length === 0) {
    return NextResponse.json({ steps: [], profile, needsOnboarding: false })
  }

  // Get completion history for this org
  const stepIds = applicableSteps.map((s) => s.id)
  const history = await db
    .select()
    .from(complianceHistory)
    .where(and(eq(complianceHistory.orgId, orgId)))

  const historyMap = new Map(history.map((h) => [h.stepId, h]))

  // Merge steps with their completion status
  const roadmap = applicableSteps.map((step) => {
    const hist = historyMap.get(step.id)
    return {
      ...step,
      documentsReq: step.documentsReq as RoadmapEntry['documentsReq'],
      status: ((hist?.status as RoadmapEntry['status']) || 'pending') as RoadmapEntry['status'],
      historyId: hist?.id || null,
      notes: hist?.notes || null,
    }
  })

  return NextResponse.json({ steps: roadmap, profile, needsOnboarding: false })
}

export async function PATCH(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const orgId = session.session.activeOrganizationId || session.user.id
  const { stepId, status, notes } = await req.json()

  const existing = await db
    .select()
    .from(complianceHistory)
    .where(and(eq(complianceHistory.orgId, orgId), sql`${complianceHistory.stepId} = ${stepId}`))
    .limit(1)

  if (existing.length > 0) {
    await db
      .update(complianceHistory)
      .set({
        status,
        notes,
        completedAt: status === 'completed' ? new Date() : null,
        updatedAt: new Date(),
      })
      .where(eq(complianceHistory.id, existing[0].id))
  } else {
    await db.insert(complianceHistory).values({
      orgId,
      stepId,
      status,
      notes,
      completedAt: status === 'completed' ? new Date() : null,
    })
  }

  return NextResponse.json({ ok: true })
}
