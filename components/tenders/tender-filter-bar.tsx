'use client'

import { useRouter } from 'next/navigation'
import { SlidersHorizontal } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

const SOURCE_LABELS: Record<string, string> = {
  all: 'All Sources',
  rppa: 'RPPA',
  world_bank: 'World Bank',
  ungm: 'UNGM',
  adb: 'ADB',
  usaid: 'USAID',
  eu: 'EU',
}

interface TenderFilterBarProps {
  source: string
  query: string
}

export function TenderFilterBar({ source, query }: TenderFilterBarProps) {
  const router = useRouter()

  function navigate(nextSource: string, nextQuery: string) {
    const params = new URLSearchParams()
    if (nextSource !== 'all') params.set('source', nextSource)
    if (nextQuery) params.set('q', nextQuery)
    router.push(`/dashboard/tenders${params.toString() ? `?${params.toString()}` : ''}`)
  }

  function handleSearch(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const q = String(new FormData(event.currentTarget).get('q') || '').trim()
    navigate(source, q)
  }

  function handleSourceChange(value: string) {
    navigate(value, query)
  }

  return (
    <div className="flex flex-col sm:flex-row gap-3">
      <form onSubmit={handleSearch} className="flex-1">
        <Input
          name="q"
          defaultValue={query}
          placeholder="Search title, issuing organization, description..."
        />
      </form>
      <Select value={source} onValueChange={handleSourceChange}>
        <SelectTrigger className="w-full sm:w-[180px]">
          <SlidersHorizontal className="h-3.5 w-3.5 mr-2 shrink-0 text-zinc-500" />
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {Object.entries(SOURCE_LABELS).map(([value, label]) => (
            <SelectItem key={value} value={value}>
              {label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
