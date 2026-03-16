export const PIPELINE_STAGE_ORDER = [
  'watching',
  'go',
  'no_go',
  'in_prep',
  'submitted',
  'won',
  'lost',
] as const

export type PipelineStage = (typeof PIPELINE_STAGE_ORDER)[number]

export type PipelineCardRecord = {
  id: string
  tenderId: string
  title: string
  issuingOrg: string
  stage: PipelineStage
  deadlineSubmission: string | null
  updatedAt: string | null
}

export const PIPELINE_STAGE_LABELS: Record<PipelineStage, string> = {
  watching: 'Watching',
  go: 'Go',
  no_go: 'No-Go',
  in_prep: 'In Preparation',
  submitted: 'Submitted',
  won: 'Won',
  lost: 'Lost',
}

export function isPipelineStage(value: string | null | undefined): value is PipelineStage {
  return typeof value === 'string' && PIPELINE_STAGE_ORDER.includes(value as PipelineStage)
}

export function normalizePipelineStage(value: string | null | undefined): PipelineStage {
  return isPipelineStage(value) ? value : 'watching'
}
