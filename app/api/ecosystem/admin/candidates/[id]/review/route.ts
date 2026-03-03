import { NextResponse } from 'next/server'
import { z } from 'zod'
import { getAdminSession } from '@/lib/auth/admin'
import { reviewCandidate } from '@/lib/ecosystem/ingestion'

const bodySchema = z.object({
  decision: z.enum(['verified', 'rejected']),
  reviewerNotes: z.string().optional(),
})

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const adminSession = await getAdminSession()
  if (!adminSession) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { id } = await params
    const body = bodySchema.parse(await req.json())
    const result = await reviewCandidate(id, body.decision, body.reviewerNotes)
    if (!result.ok) {
      return NextResponse.json({ error: result.message || 'Review failed' }, { status: 400 })
    }
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('[ecosystem-review] Failed:', error)
    return NextResponse.json({ error: 'Review failed' }, { status: 500 })
  }
}
