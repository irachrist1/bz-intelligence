import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth/server'
import { db } from '@/lib/db'
import { orgDocuments } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'

function requireOrg(session: Awaited<ReturnType<typeof getSession>>) {
  if (!session) return null
  const orgId = session.session.activeOrganizationId
  if (!orgId) return null
  return { orgId, userId: session.user.id }
}

// GET /api/compliance/documents — list all documents for the org
export async function GET() {
  const session = await getSession()
  const ctx = requireOrg(session)
  if (!ctx) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const docs = await db
    .select()
    .from(orgDocuments)
    .where(eq(orgDocuments.orgId, ctx.orgId))
    .orderBy(orgDocuments.uploadedAt)

  return NextResponse.json({ documents: docs })
}

// DELETE /api/compliance/documents?id=<docId> — remove a document record
export async function DELETE(req: NextRequest) {
  const session = await getSession()
  const ctx = requireOrg(session)
  if (!ctx) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const id = req.nextUrl.searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

  await db
    .delete(orgDocuments)
    .where(and(eq(orgDocuments.id, id), eq(orgDocuments.orgId, ctx.orgId)))

  return NextResponse.json({ ok: true })
}
