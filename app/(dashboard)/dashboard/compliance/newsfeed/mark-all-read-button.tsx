'use client'

import { useState } from 'react'
import { CheckCheck } from 'lucide-react'
import { useRouter } from 'next/navigation'

export function MarkAllReadButton({ unreadCount }: { unreadCount: number }) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  if (unreadCount === 0) return null

  async function markAll() {
    if (loading) return
    setLoading(true)
    try {
      await fetch('/api/newsfeed/read-all', { method: 'POST' })
      router.refresh()
    } catch {
      // ignore
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={markAll}
      disabled={loading}
      className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 text-zinc-500 dark:text-zinc-400 hover:border-zinc-400 dark:hover:border-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors disabled:opacity-50"
    >
      <CheckCheck className="h-3.5 w-3.5" />
      {loading ? 'Marking...' : 'Mark all read'}
    </button>
  )
}
