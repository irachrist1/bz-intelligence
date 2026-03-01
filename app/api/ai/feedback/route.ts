import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth/server'

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { messageId, rating, query, mode } = await req.json()

  // Log feedback — in production this surfaces in server logs / Sentry
  // Replace with a DB insert when an ai_feedback table is added
  console.log('[AI_FEEDBACK]', JSON.stringify({
    rating,       // 'up' | 'down'
    messageId,
    query,        // the user query that preceded this response
    mode,         // 'compliance' | 'intelligence'
    userId: session.user.id,
    ts: new Date().toISOString(),
  }))

  return NextResponse.json({ ok: true })
}
