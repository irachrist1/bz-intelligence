import { NextResponse } from 'next/server'
import { asc } from 'drizzle-orm'
import { db } from '@/lib/db'
import { tenderSources } from '@/lib/db/schema'
import { getAdminSession } from '@/lib/auth/admin'

export async function GET() {
  const adminSession = await getAdminSession()
  if (!adminSession) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const sources = await db
    .select()
    .from(tenderSources)
    .orderBy(asc(tenderSources.name))

  return NextResponse.json({ sources })
}
