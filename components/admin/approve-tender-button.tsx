'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

export function ApproveTenderButton({ tenderId }: { tenderId: string }) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [approved, setApproved] = useState(false)

  function approve() {
    startTransition(async () => {
      const response = await fetch(`/api/admin/tenders/${tenderId}/approve`, {
        method: 'PATCH',
      })

      if (!response.ok) {
        toast.error('Could not approve tender.')
        return
      }

      setApproved(true)
      toast.success('Tender approved.')
      router.refresh()
    })
  }

  return (
    <Button size="sm" onClick={approve} disabled={pending || approved}>
      {pending ? 'Approving...' : approved ? 'Approved' : 'Approve'}
    </Button>
  )
}
