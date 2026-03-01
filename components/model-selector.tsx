'use client'

import { useEffect, useState, useRef } from 'react'
import { Cpu, ChevronDown, Check } from 'lucide-react'
import { cn } from '@/lib/utils'

type ModelOption = {
  id: string
  displayName: string
  provider: 'anthropic' | 'google'
}

type ModelApiResponse = {
  active: { model: string | null; displayName: string; provider: 'anthropic' | 'google' | null; configured: boolean }
  available: ModelOption[]
}

const STORAGE_KEY = 'bz-selected-model'

export function ModelSelector({ onSelect }: { onSelect?: (modelId: string) => void }) {
  const [available, setAvailable] = useState<ModelOption[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const onSelectRef = useRef(onSelect)
  onSelectRef.current = onSelect

  useEffect(() => {
    fetch('/api/ai/model')
      .then((r) => r.json())
      .then((data: ModelApiResponse) => {
        setAvailable(data.available)
        const stored = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null
        const validStored = stored ? data.available.find((m) => m.id === stored) : null
        const initial = validStored ?? data.available.find((m) => m.id === data.active.model) ?? data.available[0]
        if (initial) {
          setSelectedId(initial.id)
          onSelectRef.current?.(initial.id)
        }
      })
      .catch(() => {})
  }, [])

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const selectedModel = available.find((m) => m.id === selectedId)
  if (!selectedModel) return null

  const providerColor =
    selectedModel.provider === 'anthropic'
      ? 'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950/30 dark:text-orange-300 dark:border-orange-800/40'
      : 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/30 dark:text-blue-300 dark:border-blue-800/40'

  function selectModel(id: string) {
    setSelectedId(id)
    if (typeof window !== 'undefined') localStorage.setItem(STORAGE_KEY, id)
    onSelectRef.current?.(id)
    setOpen(false)
  }

  // Non-interactive badge when only one model available
  if (available.length <= 1) {
    return (
      <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border font-medium ${providerColor}`}>
        <Cpu className="h-3 w-3" />
        {selectedModel.displayName}
      </span>
    )
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className={cn(
          'inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border font-medium transition-opacity hover:opacity-80',
          providerColor,
        )}
        title="Switch AI model"
      >
        <Cpu className="h-3 w-3" />
        {selectedModel.displayName}
        <ChevronDown className={cn('h-2.5 w-2.5 transition-transform', open && 'rotate-180')} />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1 z-50 w-56 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg shadow-lg py-1 overflow-hidden">
          <p className="px-3 py-1.5 text-[10px] font-medium text-zinc-400 uppercase tracking-wider">Select model</p>
          {available.map((m) => (
            <button
              key={m.id}
              onClick={() => selectModel(m.id)}
              className={cn(
                'w-full text-left px-3 py-2 text-sm flex items-center justify-between gap-2 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors',
                m.id === selectedId ? 'text-zinc-900 dark:text-zinc-100' : 'text-zinc-500 dark:text-zinc-400',
              )}
            >
              <span className="flex flex-col gap-0.5">
                <span className="font-medium leading-tight">{m.displayName}</span>
                <span className="text-[10px] text-zinc-400 capitalize">{m.provider}</span>
              </span>
              {m.id === selectedId && <Check className="h-3.5 w-3.5 text-zinc-400 shrink-0" />}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
