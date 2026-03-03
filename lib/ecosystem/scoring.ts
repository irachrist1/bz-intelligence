export const ECOSYSTEM_SCORE_WEIGHTS = {
  verificationQuality: 0.35,
  growthProxy: 0.25,
  revenueTraction: 0.2,
  freshness: 0.15,
  completeness: 0.05,
} as const

export const CONFIDENCE_THRESHOLDS = {
  official: { min: 0.9, max: 1.0 },
  credibleMedia: { min: 0.7, max: 0.89 },
  secondary: { min: 0.5, max: 0.69 },
} as const

export type ConfidenceTier = 'official' | 'credible_media' | 'secondary' | 'unknown'

export type ScoreInputs = {
  verificationQuality: number
  growthProxy: number
  revenueTraction: number
  freshness: number
  completeness: number
}

export type ScoreBreakdown = ScoreInputs & {
  total: number
}

function clampPercent(value: number): number {
  return Math.max(0, Math.min(100, value))
}

function round2(value: number): number {
  return Number(value.toFixed(2))
}

export function scoreBreakdownFromInputs(inputs: ScoreInputs): ScoreBreakdown {
  const normalized = {
    verificationQuality: clampPercent(inputs.verificationQuality),
    growthProxy: clampPercent(inputs.growthProxy),
    revenueTraction: clampPercent(inputs.revenueTraction),
    freshness: clampPercent(inputs.freshness),
    completeness: clampPercent(inputs.completeness),
  }

  const total =
    normalized.verificationQuality * ECOSYSTEM_SCORE_WEIGHTS.verificationQuality +
    normalized.growthProxy * ECOSYSTEM_SCORE_WEIGHTS.growthProxy +
    normalized.revenueTraction * ECOSYSTEM_SCORE_WEIGHTS.revenueTraction +
    normalized.freshness * ECOSYSTEM_SCORE_WEIGHTS.freshness +
    normalized.completeness * ECOSYSTEM_SCORE_WEIGHTS.completeness

  return {
    ...normalized,
    total: round2(total),
  }
}

export function confidenceTierFromScore(score: number): ConfidenceTier {
  if (score >= CONFIDENCE_THRESHOLDS.official.min && score <= CONFIDENCE_THRESHOLDS.official.max) {
    return 'official'
  }
  if (score >= CONFIDENCE_THRESHOLDS.credibleMedia.min && score <= CONFIDENCE_THRESHOLDS.credibleMedia.max) {
    return 'credible_media'
  }
  if (score >= CONFIDENCE_THRESHOLDS.secondary.min && score <= CONFIDENCE_THRESHOLDS.secondary.max) {
    return 'secondary'
  }
  return 'unknown'
}

export const ECOSYSTEM_METHODOLOGY = {
  scoreWeights: {
    verificationQuality: 35,
    growthProxy: 25,
    revenueTraction: 20,
    freshness: 15,
    completeness: 5,
  },
  sourceTiers: [
    { scoreRange: '0.90-1.00', label: 'Official' },
    { scoreRange: '0.70-0.89', label: 'Credible media' },
    { scoreRange: '0.50-0.69', label: 'Secondary' },
  ],
} as const
