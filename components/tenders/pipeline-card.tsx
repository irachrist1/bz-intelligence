'use client'

import Link from 'next/link'
import { GripVertical } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { cn } from '@/lib/utils'
import {
  PIPELINE_STAGE_LABELS,
  PIPELINE_STAGE_ORDER,
  type PipelineCardRecord,
  type PipelineStage,
} from '@/lib/tenders/pipeline'

type PipelineCardProps = {
  row: PipelineCardRecord
  pending?: boolean
  isDragging?: boolean
  onStageChange: (nextStage: PipelineStage) => void
  onDragStart: (tenderId: string) => void
  onDragEnd: () => void
}

const deadlineFormatter = new Intl.DateTimeFormat('en-GB', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
})

const timestampFormatter = new Intl.DateTimeFormat('en-GB', {
  day: 'numeric',
  month: 'short',
  hour: '2-digit',
  minute: '2-digit',
})

function formatDeadline(value: string | null): string {
  if (!value) return 'No deadline set'
  return deadlineFormatter.format(new Date(value))
}

function formatTimestamp(value: string | null): string {
  if (!value) return 'Just now'
  return timestampFormatter.format(new Date(value))
}

export function PipelineCard({
  row,
  pending = false,
  isDragging = false,
  onStageChange,
  onDragStart,
  onDragEnd,
}: PipelineCardProps) {
  return (
    <article
      className={cn(
        'rounded-xl border border-zinc-200 bg-white p-3 shadow-sm transition dark:border-zinc-800 dark:bg-zinc-900',
        pending && 'opacity-70',
        isDragging && 'border-blue-400 shadow-md dark:border-blue-500'
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-start gap-2">
            <button
              type="button"
              draggable={!pending}
              onDragStart={(event) => {
                event.dataTransfer.effectAllowed = 'move'
                event.dataTransfer.setData('text/plain', row.tenderId)
                onDragStart(row.tenderId)
              }}
              onDragEnd={onDragEnd}
              disabled={pending}
              aria-label={`Drag ${row.title}`}
              className="mt-0.5 flex h-6 w-6 shrink-0 cursor-grab items-center justify-center rounded-md border border-zinc-200 text-zinc-400 transition hover:border-zinc-300 hover:text-zinc-600 disabled:cursor-not-allowed dark:border-zinc-700 dark:hover:border-zinc-600 dark:hover:text-zinc-200"
            >
              <GripVertical className="size-3.5" />
            </button>
            <div className="min-w-0">
              <Link
                href={`/dashboard/tenders/${row.tenderId}`}
                className="line-clamp-2 text-sm font-medium text-zinc-900 transition hover:text-blue-600 dark:text-zinc-100 dark:hover:text-blue-400"
              >
                {row.title}
              </Link>
              <p className="mt-1 line-clamp-1 text-xs text-zinc-500 dark:text-zinc-400">{row.issuingOrg}</p>
            </div>
          </div>
        </div>
        <Badge variant="outline" className="shrink-0 text-[10px]">
          {PIPELINE_STAGE_LABELS[row.stage]}
        </Badge>
      </div>

      <div className="mt-3 space-y-1 text-[11px] text-zinc-500 dark:text-zinc-400">
        <p>Deadline {formatDeadline(row.deadlineSubmission)}</p>
        <p>Moved {formatTimestamp(row.updatedAt)}</p>
      </div>

      <div className="mt-3">
        <Select value={row.stage} onValueChange={(value) => onStageChange(value as PipelineStage)} disabled={pending}>
          <SelectTrigger size="sm" className="w-full text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {PIPELINE_STAGE_ORDER.map((stage) => (
              <SelectItem key={stage} value={stage}>
                {PIPELINE_STAGE_LABELS[stage]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </article>
  )
}
