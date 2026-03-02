'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

type SaveTenderButtonProps = {
  tenderId: string
  initiallySaved: boolean
  compact?: boolean
}

export function SaveTenderButton({ tenderId, initiallySaved, compact = false }: SaveTenderButtonProps) {
  const router = useRouter()
  const [isSaved, setIsSaved] = useState(initiallySaved)
  const [pending, startTransition] = useTransition()

  function toggle() {
    startTransition(async () => {
      const action = isSaved ? 'unsave' : 'save'
      const response = await fetch('/api/tenders/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tenderId, action }),
      })

      if (!response.ok) {
        toast.error(isSaved ? 'Could not remove save.' : 'Could not save tender.')
        return
      }

      setIsSaved(!isSaved)
      router.refresh()
    })
  }

  return (
    <Button
      type="button"
      size={compact ? 'sm' : 'default'}
      variant={isSaved ? 'secondary' : 'outline'}
      onClick={(event) => {
        event.preventDefault()
        event.stopPropagation()
        toggle()
      }}
      disabled={pending}
      className={compact ? 'h-7 px-2 text-xs' : undefined}
    >
      {pending ? 'Saving...' : isSaved ? 'Saved' : 'Save'}
    </Button>
  )
}
