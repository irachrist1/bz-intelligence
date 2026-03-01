'use client'

import { useState, useEffect } from 'react'
import { Check, BookOpen } from 'lucide-react'
import { cn } from '@/lib/utils'

export function MarkReadButton({ newsItemId }: { newsItemId: string }) {
  const [marked, setMarked] = useState(false)
  const [loading, setLoading] = useState(false)

  // Auto-mark as read when viewing the article
  useEffect(() => {
    fetch('/api/newsfeed/read', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ newsItemId }),
    })
      .then((r) => r.ok && setMarked(true))
      .catch(() => {})
  }, [newsItemId])

  async function toggle() {
    if (loading) return
    setLoading(true)
    try {
      await fetch('/api/newsfeed/read', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newsItemId }),
      })
      setMarked(true)
    } catch {
      // ignore
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={toggle}
      disabled={loading || marked}
      className={cn(
        'inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border transition-colors',
        marked
          ? 'border-green-200 text-green-600 bg-green-50 dark:border-green-800 dark:text-green-400 dark:bg-green-950/30 cursor-default'
          : 'border-zinc-200 text-zinc-500 hover:border-zinc-400 hover:text-zinc-700 dark:border-zinc-700 dark:text-zinc-400 dark:hover:border-zinc-500',
      )}
    >
      {marked ? (
        <>
          <Check className="h-3.5 w-3.5" />
          Read
        </>
      ) : (
        <>
          <BookOpen className="h-3.5 w-3.5" />
          Mark as read
        </>
      )}
    </button>
  )
}
