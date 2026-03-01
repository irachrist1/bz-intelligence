import { NextRequest } from 'next/server'
import { streamText, tool, stepCountIs, convertToModelMessages, UIMessage, zodSchema, LanguageModel } from 'ai'
import { anthropic } from '@ai-sdk/anthropic'
import { google } from '@ai-sdk/google'
import { z } from 'zod'
import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'
import { getSession } from '@/lib/auth/server'
import { db } from '@/lib/db'
import { businessProfiles } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'
import { searchKnowledgeBase } from '@/lib/rag/search'
import { buildComplianceSystemPrompt, buildIntelligenceSystemPrompt } from '@/lib/rag/prompts'

export const maxDuration = 30

// ── Model resolution ─────────────────────────────────────────────────────────
// Priority: Anthropic (real key) → Google Gemini (env-configurable model)
// GEMINI_MODEL env var lets you pin a specific model (default: gemini-3-flash-preview)
// Get a free Gemini key at: https://aistudio.google.com/app/apikey

export type ModelInfo = {
  provider: 'anthropic' | 'google'
  model: string
  displayName: string
}

const GEMINI_DISPLAY_NAMES: Record<string, string> = {
  'gemini-flash-latest':       'Gemini Flash (Latest)',
  'gemini-pro-latest':         'Gemini Pro (Latest)',
  'gemini-flash-lite-latest':  'Gemini Flash Lite',
  'gemini-3.1-pro-preview':    'Gemini 3.1 Pro',
  'gemini-3-pro-preview':      'Gemini 3 Pro',
  'gemini-3-flash-preview':    'Gemini 3 Flash',
  'gemini-2.5-pro-preview':    'Gemini 2.5 Pro',
  'gemini-2.5-flash':          'Gemini 2.5 Flash',
  'gemini-2.0-flash':          'Gemini 2.0 Flash',
  'gemini-1.5-pro':            'Gemini 1.5 Pro',
  'gemini-1.5-flash':          'Gemini 1.5 Flash',
}

export function resolveModelInfo(): ModelInfo {
  const anthropicKey = process.env.ANTHROPIC_API_KEY || ''
  if (anthropicKey.startsWith('sk-ant-api03-')) {
    return { provider: 'anthropic', model: 'claude-sonnet-4-6', displayName: 'Claude Sonnet 4.6' }
  }
  if (process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
    const model = process.env.GEMINI_MODEL || 'gemini-flash-latest'
    const displayName = GEMINI_DISPLAY_NAMES[model] ?? model
    return { provider: 'google', model, displayName }
  }
  throw new Error('No valid AI API key configured. Set ANTHROPIC_API_KEY (from console.anthropic.com) or GOOGLE_GENERATIVE_AI_API_KEY (free at aistudio.google.com).')
}

const ALLOWED_MODELS: Record<string, 'anthropic' | 'google'> = {
  'claude-sonnet-4-6': 'anthropic',
  'claude-haiku-4-5-20251001': 'anthropic',
  'gemini-flash-latest': 'google',
  'gemini-2.0-flash': 'google',
  'gemini-1.5-pro': 'google',
  'gemini-1.5-flash': 'google',
}

function getModel(override?: string): LanguageModel {
  if (override && ALLOWED_MODELS[override]) {
    const provider = ALLOWED_MODELS[override]
    const hasKey =
      provider === 'anthropic'
        ? process.env.ANTHROPIC_API_KEY?.startsWith('sk-ant-api03-')
        : !!process.env.GOOGLE_GENERATIVE_AI_API_KEY
    if (hasKey) {
      return provider === 'anthropic' ? anthropic(override) : google(override)
    }
  }
  const info = resolveModelInfo()
  return info.provider === 'anthropic' ? anthropic(info.model) : google(info.model)
}

let ratelimit: Ratelimit | null = null
if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
  ratelimit = new Ratelimit({
    redis: new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    }),
    limiter: Ratelimit.slidingWindow(20, '1 h'),
    prefix: 'bz:chat',
  })
}

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session) return new Response('Unauthorized', { status: 401 })

  if (ratelimit) {
    const { success, limit, remaining, reset } = await ratelimit.limit(session.user.id)
    if (!success) {
      return new Response(
        JSON.stringify({ error: 'Rate limit exceeded. You can send 20 messages per hour.' }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'X-RateLimit-Limit': String(limit),
            'X-RateLimit-Remaining': String(remaining),
            'X-RateLimit-Reset': String(reset),
          },
        }
      )
    }
  }

  const body = await req.json()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { messages, mode, modelOverride } = body as { messages: UIMessage[]; mode: string; modelOverride?: string }
  const orgId = session.session.activeOrganizationId || session.user.id

  // Load business profile for compliance mode personalization
  let businessProfile = null
  if (mode === 'compliance') {
    const profiles = await db
      .select()
      .from(businessProfiles)
      .where(and(eq(businessProfiles.orgId, orgId), eq(businessProfiles.userId, session.user.id)))
      .limit(1)
    businessProfile = profiles[0] || null
  }

  const systemPrompt =
    mode === 'compliance'
      ? buildComplianceSystemPrompt(businessProfile)
      : buildIntelligenceSystemPrompt()

  // convertToModelMessages is async in AI SDK v6
  const modelMessages = await convertToModelMessages(messages)

  const searchSchema = z.object({
    query: z.string().describe('The search query'),
    sectorFilter: z.string().optional().describe('Filter by sector e.g. fintech, agritech'),
    docType: z
      .enum(['regulation', 'company_profile', 'sector_report', 'guideline'])
      .optional()
      .describe('Filter by document type'),
  })

  type SearchInput = z.infer<typeof searchSchema>

  const searchTool = tool<SearchInput, object>({
    description: 'Search the verified Rwanda regulatory and business knowledge base. Use this before every answer.',
    inputSchema: zodSchema(searchSchema),
    execute: async (params: SearchInput) => {
      const results = await searchKnowledgeBase(params.query, {
        sectorFilter: params.sectorFilter,
        docType: params.docType,
      })
      if (results.length === 0) {
        // Track knowledge base gaps — queries with no matching content
        console.warn('[KB_GAP]', JSON.stringify({ query: params.query, mode, userId: session.user.id, ts: new Date().toISOString() }))
        return { found: false, message: 'No relevant documents found in the knowledge base.' }
      }
      return {
        found: true,
        results: results.map((r) => ({
          content: r.content,
          source: r.sourceTitle,
          url: r.sourceUrl,
          date: r.sourceDate,
          regBody: r.regBody,
          lastVerified: r.lastVerifiedAt?.toISOString().split('T')[0],
          relevanceScore: r.similarity.toFixed(3),
        })),
      }
    },
  })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const result = streamText({
    model: getModel(modelOverride),
    system: systemPrompt,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    messages: modelMessages as any,
    tools: { searchKnowledgeBase: searchTool },
    stopWhen: stepCountIs(5),
  })

  return result.toTextStreamResponse()
}
