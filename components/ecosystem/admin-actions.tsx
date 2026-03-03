'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'

export function CandidateReviewActions({ candidateId }: { candidateId: string }) {
  const router = useRouter()
  const [busy, setBusy] = useState(false)
  const [notes, setNotes] = useState('')

  async function submit(decision: 'verified' | 'rejected') {
    setBusy(true)
    try {
      const response = await fetch(`/api/ecosystem/admin/candidates/${candidateId}/review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ decision, reviewerNotes: notes }),
      })
      if (!response.ok) throw new Error('Review update failed')
      toast.success(`Candidate ${decision === 'verified' ? 'approved' : 'rejected'}.`)
      setNotes('')
      router.refresh()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Action failed')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="space-y-2">
      <Textarea
        value={notes}
        onChange={(event) => setNotes(event.target.value)}
        placeholder="Optional review note..."
        className="min-h-[70px]"
      />
      <div className="flex gap-2">
        <Button size="sm" disabled={busy} onClick={() => submit('verified')}>
          Approve
        </Button>
        <Button size="sm" variant="destructive" disabled={busy} onClick={() => submit('rejected')}>
          Reject
        </Button>
      </div>
    </div>
  )
}

export function FeedToggle({
  feedId,
  enabled,
}: {
  feedId: string
  enabled: boolean
}) {
  const router = useRouter()
  const [busy, setBusy] = useState(false)

  async function onToggle(next: boolean) {
    setBusy(true)
    try {
      const response = await fetch(`/api/ecosystem/admin/feeds/${feedId}/toggle`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: next }),
      })
      if (!response.ok) throw new Error('Could not update feed')
      toast.success(`Feed ${next ? 'enabled' : 'disabled'}.`)
      router.refresh()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Feed update failed')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex items-center gap-2">
      <Switch checked={enabled} onCheckedChange={onToggle} disabled={busy} />
      <span className="text-xs text-zinc-500 dark:text-zinc-400">{enabled ? 'Enabled' : 'Paused'}</span>
    </div>
  )
}

export function TriggerEcosystemIngestion() {
  const router = useRouter()
  const [busy, setBusy] = useState(false)

  async function run() {
    setBusy(true)
    try {
      const response = await fetch('/api/ecosystem/admin/ingest', { method: 'POST' })
      if (!response.ok) throw new Error('Ingestion trigger failed')
      toast.success('Ecosystem ingestion started.')
      router.refresh()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Ingestion trigger failed')
    } finally {
      setBusy(false)
    }
  }

  return (
    <Button onClick={run} disabled={busy}>
      {busy ? 'Running...' : 'Run Ingestion Now'}
    </Button>
  )
}
