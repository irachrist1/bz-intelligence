'use client'

import { FormEvent, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'

type SourceOption = {
  code: string
  name: string
}

export function IngestTenderForm({ sources }: { sources: SourceOption[] }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const defaultSource = useMemo(() => sources[0]?.code || 'rppa', [sources])
  const [sourceValue, setSourceValue] = useState(defaultSource)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setLoading(true)

    const formData = new FormData(event.currentTarget)
    const payload = {
      source: sourceValue,
      title: String(formData.get('title') || '').trim(),
      issuingOrg: String(formData.get('issuingOrg') || '').trim(),
      sourceUrl: String(formData.get('sourceUrl') || '').trim(),
      tenderType: String(formData.get('tenderType') || '').trim() || null,
      fundingSource: String(formData.get('fundingSource') || '').trim() || null,
      description: String(formData.get('description') || '').trim() || null,
      eligibilityNotes: String(formData.get('eligibilityNotes') || '').trim() || null,
      estimatedValueUsd: String(formData.get('estimatedValueUsd') || '').trim() || null,
      datePosted: String(formData.get('datePosted') || '').trim() || null,
      deadlineSubmission: String(formData.get('deadlineSubmission') || '').trim() || null,
      deadlineClarification: String(formData.get('deadlineClarification') || '').trim() || null,
      categoryTags: String(formData.get('categoryTags') || '')
        .split(',')
        .map((item) => item.trim().toLowerCase())
        .filter(Boolean),
    }

    if (!payload.source || !payload.title || !payload.issuingOrg || !payload.sourceUrl) {
      toast.error('Source, title, issuing organization, and source URL are required.')
      setLoading(false)
      return
    }

    try {
      const response = await fetch('/api/admin/tenders/ingest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const result = await response.json().catch(() => null)
        throw new Error(result?.error || 'Ingestion failed')
      }

      toast.success('Tender ingested into review queue.')
      event.currentTarget.reset()
      setSourceValue(defaultSource)
      router.refresh()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Ingestion failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="source">Source</Label>
          <Select value={sourceValue} onValueChange={setSourceValue}>
            <SelectTrigger id="source" className="mt-1.5">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {sources.map((source) => (
                <SelectItem key={source.code} value={source.code}>
                  {source.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="tenderType">Tender type</Label>
          <Input id="tenderType" name="tenderType" placeholder="rfp, rfq, eoi..." />
        </div>
      </div>

      <div>
        <Label htmlFor="title">Title</Label>
        <Input id="title" name="title" required />
      </div>

      <div>
        <Label htmlFor="issuingOrg">Issuing organization</Label>
        <Input id="issuingOrg" name="issuingOrg" required />
      </div>

      <div>
        <Label htmlFor="sourceUrl">Source URL</Label>
        <Input id="sourceUrl" name="sourceUrl" type="url" required />
      </div>

      <div>
        <Label htmlFor="description">Description</Label>
        <Textarea id="description" name="description" className="min-h-[110px]" />
      </div>

      <div>
        <Label htmlFor="eligibilityNotes">Eligibility notes</Label>
        <Textarea id="eligibilityNotes" name="eligibilityNotes" className="min-h-[90px]" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="fundingSource">Funding source</Label>
          <Input id="fundingSource" name="fundingSource" placeholder="gor, world_bank, un..." />
        </div>
        <div>
          <Label htmlFor="estimatedValueUsd">Estimated value (USD)</Label>
          <Input id="estimatedValueUsd" name="estimatedValueUsd" type="number" min={0} step="1" />
        </div>
      </div>

      <div>
        <Label htmlFor="categoryTags">Category tags (comma-separated)</Label>
        <Input id="categoryTags" name="categoryTags" placeholder="it, consulting, training" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <Label htmlFor="datePosted">Date posted</Label>
          <Input id="datePosted" name="datePosted" type="date" />
        </div>
        <div>
          <Label htmlFor="deadlineClarification">Clarification deadline</Label>
          <Input id="deadlineClarification" name="deadlineClarification" type="date" />
        </div>
        <div>
          <Label htmlFor="deadlineSubmission">Submission deadline</Label>
          <Input id="deadlineSubmission" name="deadlineSubmission" type="date" />
        </div>
      </div>

      <div className="pt-2">
        <Button type="submit" disabled={loading}>
          {loading ? 'Ingesting...' : 'Ingest Tender'}
        </Button>
      </div>
    </form>
  )
}
