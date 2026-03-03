import { NextResponse } from 'next/server'
import { resolveModelInfo } from '../chat/route'

export type ModelOption = {
  id: string
  displayName: string
  provider: 'anthropic' | 'google'
}

const ALL_MODELS: ModelOption[] = [
  { id: 'claude-sonnet-4-6', displayName: 'Claude Sonnet 4.6', provider: 'anthropic' },
  { id: 'claude-haiku-4-5-20251001', displayName: 'Claude Haiku 4.5', provider: 'anthropic' },
  { id: 'gemini-flash-latest', displayName: 'Gemini Flash (Latest)', provider: 'google' },
  { id: 'gemini-2.0-flash', displayName: 'Gemini 2.0 Flash', provider: 'google' },
  { id: 'gemini-1.5-pro', displayName: 'Gemini 1.5 Pro', provider: 'google' },
  { id: 'gemini-1.5-flash', displayName: 'Gemini 1.5 Flash', provider: 'google' },
]

export function getAvailableModels(): ModelOption[] {
  const hasAnthropic = process.env.ANTHROPIC_API_KEY?.startsWith('sk-ant-') ?? false
  const hasGoogle = !!process.env.GOOGLE_GENERATIVE_AI_API_KEY
  return ALL_MODELS.filter((m) =>
    (m.provider === 'anthropic' && hasAnthropic) ||
    (m.provider === 'google' && hasGoogle),
  )
}

export async function GET() {
  try {
    const active = resolveModelInfo()
    return NextResponse.json({ active: { ...active, configured: true }, available: getAvailableModels() })
  } catch {
    return NextResponse.json({
      active: { configured: false, provider: null, model: null, displayName: 'No model configured' },
      available: [],
    })
  }
}
