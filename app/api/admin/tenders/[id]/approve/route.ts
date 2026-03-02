import { NextRequest, NextResponse } from 'next/server'
import { eq } from 'drizzle-orm'
import { revalidateTag } from 'next/cache'
import { db } from '@/lib/db'
import { tenders } from '@/lib/db/schema'
import { getAdminSession } from '@/lib/auth/admin'
import { matchTenderToProfiles } from '@/lib/alerts/match'
import { sendNewTenderMatchEmail } from '@/lib/email'

interface RouteProps {
  params: Promise<{ id: string }>
}

export async function PATCH(_req: NextRequest, { params }: RouteProps) {
  const adminSession = await getAdminSession()
  if (!adminSession) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { id } = await params
  if (!id) return NextResponse.json({ error: 'Tender id is required' }, { status: 400 })

  await db
    .update(tenders)
    .set({ reviewStatus: 'approved', updatedAt: new Date() })
    .where(eq(tenders.id, id))

  revalidateTag('tenders', 'default')

  // Fire-and-forget: match profiles and send real-time alerts without blocking the response.
  void (async () => {
    try {
      const rows = await db
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
        .where(eq(tenders.id, id))
        .limit(1)

      const tender = rows[0]
      if (!tender) return

      const recipients = await matchTenderToProfiles(tender)
      const realtimeRecipients = recipients.filter((r) => r.frequency === 'realtime')

      if (realtimeRecipients.length > 0) {
        await Promise.allSettled(
          realtimeRecipients.map((r) =>
            sendNewTenderMatchEmail({ email: r.email, name: r.name, tenders: [tender] })
          )
        )
      }
    } catch (err) {
      console.error('[approve] Alert dispatch failed:', err)
    }
  })()

  return NextResponse.json({ ok: true })
}
