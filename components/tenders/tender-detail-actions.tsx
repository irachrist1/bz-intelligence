'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

const STAGE_OPTIONS = [
  { value: 'watching', label: 'Watching' },
  { value: 'go', label: 'Go' },
  { value: 'no_go', label: 'No-Go' },
  { value: 'in_prep', label: 'In Preparation' },
  { value: 'submitted', label: 'Submitted' },
  { value: 'won', label: 'Won' },
  { value: 'lost', label: 'Lost' },
]

type TenderDetailActionsProps = {
  tenderId: string
  initialStage: string | null
  initialSaved: boolean
}

export function TenderDetailActions({ tenderId, initialStage, initialSaved }: TenderDetailActionsProps) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [stage, setStage] = useState<string>(initialStage || 'watching')
  const [saved, setSaved] = useState(initialSaved)

  function callSaveApi(payload: Record<string, string>) {
    return fetch('/api/tenders/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
  }

  function toggleSave() {
    startTransition(async () => {
      const action = saved ? 'unsave' : 'save'
      const response = await callSaveApi({ tenderId, action })

      if (!response.ok) {
        toast.error(saved ? 'Could not unsave tender.' : 'Could not save tender.')
        return
      }

      const nextSaved = !saved
      setSaved(nextSaved)
      if (!nextSaved) {
        setStage('watching')
      }
      router.refresh()
    })
  }

  function updateStage(nextStage: string) {
    setStage(nextStage)
    startTransition(async () => {
      const response = await callSaveApi({
        tenderId,
        action: 'update_stage',
        stage: nextStage,
      })

      if (!response.ok) {
        toast.error('Could not update stage.')
        return
      }

      setSaved(true)
      router.refresh()
    })
  }

  return (
    <div className="flex items-center gap-2">
      <Button type="button" variant={saved ? 'secondary' : 'outline'} onClick={toggleSave} disabled={pending}>
        {pending ? 'Saving...' : saved ? 'Saved' : 'Save tender'}
      </Button>
      <Select value={stage} onValueChange={updateStage} disabled={pending}>
        <SelectTrigger className="w-[160px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {STAGE_OPTIONS.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
