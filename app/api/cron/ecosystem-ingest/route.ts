import { NextRequest, NextResponse } from 'next/server'
import { runEcosystemIngestion } from '@/lib/ecosystem/ingestion'
import { getAdminSession } from '@/lib/auth/admin'

function verifyCronSecret(req: NextRequest): boolean {
  const expected = process.env.CRON_SECRET
  if (!expected) return true
  return req.headers.get('authorization') === `Bearer ${expected}`
}

export async function GET(req: NextRequest) {
  if (!verifyCronSecret(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const result = await runEcosystemIngestion('cron')
    return NextResponse.json(result)
  } catch (error) {
    console.error('[ecosystem-ingest] Cron run failed:', error)
    return NextResponse.json({ error: 'Ingestion failed.' }, { status: 500 })
  }
}

export async function POST() {
  const adminSession = await getAdminSession()
  if (!adminSession) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const result = await runEcosystemIngestion('manual')
    return NextResponse.json(result)
  } catch (error) {
    console.error('[ecosystem-ingest] Manual run failed:', error)
    return NextResponse.json({ error: 'Ingestion failed.' }, { status: 500 })
  }
}
