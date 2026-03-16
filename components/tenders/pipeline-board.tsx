'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import {
  PIPELINE_STAGE_LABELS,
  PIPELINE_STAGE_ORDER,
  type PipelineCardRecord,
  type PipelineStage,
} from '@/lib/tenders/pipeline'
import { PipelineCard } from '@/components/tenders/pipeline-card'

type PipelineBoardProps = {
  initialRows: PipelineCardRecord[]
}

function sortByUpdatedAt(rows: PipelineCardRecord[]) {
  return [...rows].sort((left, right) => {
    const leftTime = left.updatedAt ? new Date(left.updatedAt).getTime() : 0
    const rightTime = right.updatedAt ? new Date(right.updatedAt).getTime() : 0
    return rightTime - leftTime
  })
}

function moveCard(
  rows: PipelineCardRecord[],
  tenderId: string,
  nextStage: PipelineStage,
  updatedAt: string | null
) {
  return rows.map((row) =>
    row.tenderId === tenderId
      ? {
          ...row,
          stage: nextStage,
          updatedAt,
        }
      : row
  )
}

export function PipelineBoard({ initialRows }: PipelineBoardProps) {
  const [rows, setRows] = useState(() => sortByUpdatedAt(initialRows))
  const [pendingTenderIds, setPendingTenderIds] = useState<string[]>([])
  const [draggingTenderId, setDraggingTenderId] = useState<string | null>(null)
  const [hoverStage, setHoverStage] = useState<PipelineStage | null>(null)

  async function persistStageChange(tenderId: string, nextStage: PipelineStage) {
    if (pendingTenderIds.includes(tenderId)) return

    const currentRow = rows.find((row) => row.tenderId === tenderId)
    if (!currentRow || currentRow.stage === nextStage) return

    const optimisticUpdatedAt = new Date().toISOString()

    setPendingTenderIds((current) => (current.includes(tenderId) ? current : [...current, tenderId]))
    setRows((current) => sortByUpdatedAt(moveCard(current, tenderId, nextStage, optimisticUpdatedAt)))

    try {
      const response = await fetch('/api/tenders/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenderId,
          action: 'update_stage',
          stage: nextStage,
        }),
      })

      const payload = await response.json().catch(() => ({}))

      if (!response.ok) {
        throw new Error(typeof payload.error === 'string' ? payload.error : 'Could not update stage.')
      }

      const persistedUpdatedAt =
        typeof payload.updatedAt === 'string' ? payload.updatedAt : optimisticUpdatedAt

      setRows((current) => sortByUpdatedAt(moveCard(current, tenderId, nextStage, persistedUpdatedAt)))
    } catch (error) {
      setRows((current) =>
        sortByUpdatedAt(moveCard(current, tenderId, currentRow.stage, currentRow.updatedAt))
      )
      toast.error(error instanceof Error ? error.message : 'Could not update stage.')
    } finally {
      setPendingTenderIds((current) => current.filter((id) => id !== tenderId))
      setDraggingTenderId((current) => (current === tenderId ? null : current))
      setHoverStage(null)
    }
  }

  const grouped = Object.fromEntries(
    PIPELINE_STAGE_ORDER.map((stage) => [stage, rows.filter((row) => row.stage === stage)])
  ) as Record<PipelineStage, PipelineCardRecord[]>

  return (
    <div className="overflow-x-auto pb-3">
      <div className="grid min-w-[1240px] grid-cols-7 gap-4">
        {PIPELINE_STAGE_ORDER.map((stage) => (
          <section
            key={stage}
            onDragOver={(event) => {
              event.preventDefault()
              if (hoverStage !== stage) setHoverStage(stage)
            }}
            onDragLeave={() => {
              if (hoverStage === stage) setHoverStage(null)
            }}
            onDrop={(event) => {
              event.preventDefault()
              const tenderId = event.dataTransfer.getData('text/plain')
              setHoverStage(null)
              if (tenderId) {
                void persistStageChange(tenderId, stage)
              }
            }}
            className={cn(
              'rounded-xl border border-zinc-200 bg-white p-3 transition dark:border-zinc-800 dark:bg-zinc-900',
              hoverStage === stage && 'border-blue-400 bg-blue-50/60 dark:border-blue-500 dark:bg-blue-950/20'
            )}
          >
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                {PIPELINE_STAGE_LABELS[stage]}
              </h2>
              <Badge variant="secondary" className="text-xs">
                {grouped[stage].length}
              </Badge>
            </div>

            <div className="space-y-3">
              {grouped[stage].length === 0 ? (
                <div className="rounded-lg border border-dashed border-zinc-200 px-2 py-3 text-center text-xs text-zinc-400 dark:border-zinc-700">
                  Drop a tender here
                </div>
              ) : (
                grouped[stage].map((row) => (
                  <PipelineCard
                    key={row.id}
                    row={row}
                    pending={pendingTenderIds.includes(row.tenderId)}
                    isDragging={draggingTenderId === row.tenderId}
                    onStageChange={(nextStage) => {
                      void persistStageChange(row.tenderId, nextStage)
                    }}
                    onDragStart={setDraggingTenderId}
                    onDragEnd={() => {
                      setDraggingTenderId(null)
                      setHoverStage(null)
                    }}
                  />
                ))
              )}
            </div>
          </section>
        ))}
      </div>
    </div>
  )
}
