'use client'

import { useEffect, useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Cpu } from 'lucide-react'

type ModelInfo = {
  configured: boolean
  provider: 'anthropic' | 'google' | null
  model: string | null
  displayName: string
}

export function ModelBadge() {
  const [info, setInfo] = useState<ModelInfo | null>(null)

  useEffect(() => {
    fetch('/api/ai/model')
      .then((r) => r.json())
      .then(setInfo)
      .catch(() => {})
  }, [])

  if (!info) return null

  const providerColor = info.provider === 'anthropic'
    ? 'bg-orange-50 text-orange-700 border-orange-200'
    : info.provider === 'google'
    ? 'bg-blue-50 text-blue-700 border-blue-200'
    : 'bg-red-50 text-red-600 border-red-200'

  return (
    <span
      className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border font-medium ${providerColor}`}
      title={info.model || 'Not configured'}
    >
      <Cpu className="h-3 w-3" />
      {info.displayName}
    </span>
  )
}
