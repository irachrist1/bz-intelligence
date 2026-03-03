import { NextResponse } from 'next/server'
import { getAdminSession } from '@/lib/auth/admin'
import { runEcosystemIngestion } from '@/lib/ecosystem/ingestion'

export async function POST() {
  const adminSession = await getAdminSession()
  if (!adminSession) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const result = await runEcosystemIngestion('manual')
    return NextResponse.json(result)
  } catch (error) {
    console.error('[ecosystem-admin-ingest] Failed:', error)
    return NextResponse.json({ error: 'Ingestion failed' }, { status: 500 })
  }
}
