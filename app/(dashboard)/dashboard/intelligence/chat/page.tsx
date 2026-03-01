'use client'

import { useChat } from '@ai-sdk/react'
import { TextStreamChatTransport, isTextUIPart, UIMessage } from 'ai'
import { useRef, useEffect, useState, useMemo, useCallback } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Send, BarChart2, User, AlertCircle, Copy, Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import { ModelSelector } from '@/components/model-selector'

// ── Sector definitions ────────────────────────────────────────────────────────

const SECTORS = [
  { id: 'all', label: 'All sectors' },
  { id: 'fintech', label: 'Fintech' },
  { id: 'agritech', label: 'Agritech' },
  { id: 'ict', label: 'ICT / Tech' },
  { id: 'healthtech', label: 'Healthtech' },
  { id: 'logistics', label: 'Logistics' },
]

const SECTOR_EXAMPLES: Record<string, string[]> = {
  all: [
    'Which fintech companies in Rwanda offer digital lending?',
    "Who are the active investors in Rwanda's startup ecosystem?",
    'What sub-sectors of ICT are underrepresented in Rwanda?',
    'How many companies have a BNR Payment Service Provider license?',
  ],
  fintech: [
    'How many active BNR-licensed PSPs are there in Rwanda?',
    'Which fintechs have raised Series A or above?',
    'What fintech sub-sectors are most crowded?',
    'Who are the foreign investors active in Rwanda fintech?',
  ],
  agritech: [
    'What agritech companies are operating in Rwanda?',
    'Which investors are focused on Rwanda agritech?',
    'What technology is most used in Rwanda agricultural supply chains?',
    'Are there agritech companies addressing smallholder financing?',
  ],
  ict: [
    'Which ICT companies have RURA licenses?',
    'What is the state of cloud services providers in Rwanda?',
    'Which companies are working on e-government services?',
    "Who are the dominant players in Rwanda's SaaS market?",
  ],
  healthtech: [
    'What healthtech startups are operating in Rwanda?',
    'Which health insurance platforms are RSSB-integrated?',
    'What digital health infrastructure exists in Rwanda?',
    'Are there telemedicine companies operating at scale?',
  ],
  logistics: [
    'What last-mile logistics companies operate in Rwanda?',
    'Which companies are addressing cross-border EAC trade?',
    'How is the Rwanda cold chain logistics sector structured?',
    'Which logistics companies are venture-backed?',
  ],
}

// ── Shared helpers ────────────────────────────────────────────────────────────

const THINKING_LABELS = ['', 'Thinking...', 'Searching knowledge base...', 'Reviewing sources...', 'Composing response...']

function parseResponse(text: string): { mainContent: string; sources: string[] } {
  const match = text.match(/\n+(?:#{1,3}\s*\*{0,2}Sources?\*{0,2}|Sources?:)\s*\n+([\s\S]*)$/i)
  if (!match) return { mainContent: text, sources: [] }
  const mainContent = text.slice(0, text.length - match[0].length).trim()
  const sources = match[1].split('\n').map((l) => l.replace(/^[-*•\d.]\s*/, '').trim()).filter((l) => l.length > 5)
  return { mainContent, sources }
}

const markdownComponents = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  p: ({ children }: any) => <p className="mb-2 last:mb-0">{children}</p>,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ul: ({ children }: any) => <ul className="mb-2 ml-4 list-disc space-y-0.5">{children}</ul>,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ol: ({ children }: any) => <ol className="mb-2 ml-4 list-decimal space-y-0.5">{children}</ol>,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  li: ({ children }: any) => <li className="leading-relaxed">{children}</li>,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  strong: ({ children }: any) => <strong className="font-semibold">{children}</strong>,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  h1: ({ children }: any) => <h1 className="text-base font-semibold mb-1 mt-3 first:mt-0">{children}</h1>,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  h2: ({ children }: any) => <h2 className="text-sm font-semibold mb-1 mt-3 first:mt-0">{children}</h2>,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  h3: ({ children }: any) => <h3 className="text-sm font-medium mb-1 mt-2 first:mt-0">{children}</h3>,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  code: ({ children }: any) => <code className="bg-amber-50 dark:bg-amber-950/40 px-1 py-0.5 rounded text-xs font-mono">{children}</code>,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  blockquote: ({ children }: any) => <blockquote className="border-l-2 border-amber-200 dark:border-amber-800 pl-3 text-zinc-500 italic mb-2">{children}</blockquote>,
}

// ── ChatArea ─────────────────────────────────────────────────────────────────

function ChatArea({ sector, onModelSelect }: { sector: string; onModelSelect: (id: string) => void }) {
  const storageKey = `bz-chat-intelligence-${sector}`
  const sectorLabel = SECTORS.find((s) => s.id === sector)?.label ?? sector

  const [input, setInput] = useState('')
  const [copied, setCopied] = useState<Record<string, boolean>>({})
  const [thinkingStage, setThinkingStage] = useState(0)
  const bottomRef = useRef<HTMLDivElement>(null)

  const transportBody = useRef<Record<string, unknown>>({ mode: 'intelligence' })
  const transport = useMemo(() => new TextStreamChatTransport({ api: '/api/ai/chat', body: transportBody.current }), [])

  const handleModelSelect = useCallback((modelId: string) => {
    transportBody.current.modelOverride = modelId
    onModelSelect(modelId)
  }, [onModelSelect])

  const [initialMessages] = useState<UIMessage[]>(() => {
    if (typeof window === 'undefined') return []
    try { return JSON.parse(localStorage.getItem(storageKey) || '[]') } catch { return [] }
  })

  const { messages, sendMessage, status, error } = useChat({ transport, messages: initialMessages })
  const isLoading = status === 'submitted' || status === 'streaming'

  useEffect(() => {
    if (messages.length > 0) localStorage.setItem(storageKey, JSON.stringify(messages))
  }, [messages, storageKey])

  useEffect(() => {
    if (status !== 'submitted') { setThinkingStage(0); return }
    setThinkingStage(1)
    const t1 = setTimeout(() => setThinkingStage(2), 1500)
    const t2 = setTimeout(() => setThinkingStage(3), 7000)
    const t3 = setTimeout(() => setThinkingStage(4), 18000)
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3) }
  }, [status])

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages, thinkingStage])

  async function copyMessage(messageId: string, text: string) {
    await navigator.clipboard.writeText(text).catch(() => {})
    setCopied((prev) => ({ ...prev, [messageId]: true }))
    setTimeout(() => setCopied((prev) => ({ ...prev, [messageId]: false })), 2000)
  }

  function handleSubmit(e?: React.FormEvent) {
    e?.preventDefault()
    if (!input.trim() || isLoading) return
    const prefix = sector !== 'all' ? `[Research context: Focus on the ${sectorLabel} sector]\n\n` : ''
    sendMessage({ text: prefix + input })
    setInput('')
  }

  const examples = SECTOR_EXAMPLES[sector] ?? SECTOR_EXAMPLES.all

  return (
    <div className="flex flex-col flex-1 min-w-0 min-h-0">
      {/* Header */}
      <div className="px-3 py-3 md:px-6 md:py-4 border-b border-amber-100 bg-amber-50/60 dark:bg-amber-950/20 dark:border-amber-900/40 shrink-0">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <div className="h-8 w-8 md:h-9 md:w-9 rounded-lg bg-amber-500 dark:bg-amber-600 text-white flex items-center justify-center shrink-0">
              <BarChart2 className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <h1 className="font-semibold text-sm md:text-base text-zinc-900 dark:text-zinc-100 leading-tight">Market Analyst</h1>
              <p className="text-xs text-zinc-500 mt-0.5 hidden sm:block truncate">Rwanda ecosystem intelligence</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <ModelSelector onSelect={handleModelSelect} />
            {messages.length > 0 && (
              <button
                onClick={() => { localStorage.removeItem(storageKey); window.location.reload() }}
                className="text-xs text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 px-2 py-1 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {sector !== 'all' && (
          <div className="mt-2 flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400">
            <span className="text-zinc-400">Focused on:</span>
            <span className="px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300 font-medium">
              {sectorLabel}
            </span>
          </div>
        )}
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 px-3 py-4 md:px-6">
        {messages.length === 0 ? (
          <div className="max-w-2xl mx-auto pt-4 md:pt-8">
            <div className="text-center mb-6 md:mb-8">
              <div className="h-12 w-12 md:h-14 md:w-14 bg-amber-100 dark:bg-amber-900/40 rounded-2xl flex items-center justify-center mx-auto mb-3 md:mb-4">
                <BarChart2 className="h-6 w-6 md:h-7 md:w-7 text-amber-500 dark:text-amber-400" />
              </div>
              <h2 className="text-base md:text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-2">
                {sector === 'all' ? "Explore Rwanda's business landscape" : `Explore Rwanda ${sectorLabel}`}
              </h2>
              <p className="text-sm text-zinc-500 dark:text-zinc-400 max-w-sm mx-auto">
                {sector === 'all'
                  ? 'Research sectors, find companies, and analyze market data.'
                  : `Asking questions focused on the ${sectorLabel} sector in Rwanda.`}
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {examples.map((q) => (
                <button
                  key={q}
                  onClick={() => setInput(q)}
                  className="text-left p-3 rounded-lg border border-amber-100 dark:border-amber-900/40 text-sm text-zinc-600 dark:text-zinc-400 hover:border-amber-300 dark:hover:border-amber-700 hover:bg-amber-50/50 dark:hover:bg-amber-950/30 transition-colors"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="max-w-2xl mx-auto space-y-6">
            {messages.map((m) => {
              const textContent = m.parts.filter(isTextUIPart).map((p) => p.text).join('')
              const { mainContent, sources } = m.role === 'assistant' ? parseResponse(textContent) : { mainContent: textContent, sources: [] }

              return (
                <div key={m.id} className={cn('flex gap-2 md:gap-3', m.role === 'user' ? 'flex-row-reverse' : 'flex-row')}>
                  <div className={cn('h-7 w-7 md:h-8 md:w-8 rounded-full flex items-center justify-center shrink-0',
                    m.role === 'user' ? 'bg-zinc-900 text-white dark:bg-zinc-200 dark:text-zinc-900' : 'bg-amber-100 dark:bg-amber-900/50 text-amber-600 dark:text-amber-400')}>
                    {m.role === 'user' ? <User className="h-3.5 w-3.5" /> : <BarChart2 className="h-3.5 w-3.5" />}
                  </div>
                  <div className={cn('flex-1 rounded-xl px-3 py-2.5 md:px-4 md:py-3 text-sm leading-relaxed min-w-0',
                    m.role === 'user'
                      ? 'bg-zinc-900 text-white dark:bg-zinc-800 max-w-[85%]'
                      : 'bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-800 dark:text-zinc-200')}>
                    {m.role === 'assistant' ? (
                      <>
                        <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>{mainContent}</ReactMarkdown>
                        {sources.length > 0 && (
                          <div className="mt-4 pt-3 border-t border-amber-100 dark:border-amber-900/40">
                            <p className="text-xs font-medium text-amber-600 dark:text-amber-400 mb-2 flex items-center gap-1.5">
                              <BarChart2 className="h-3 w-3" />Sources
                            </p>
                            <div className="space-y-1.5">
                              {sources.map((source, i) => (
                                <div key={i} className="text-xs bg-amber-50/70 dark:bg-amber-950/30 border border-amber-100 dark:border-amber-900/40 rounded-md px-3 py-2 text-zinc-600 dark:text-zinc-400">{source}</div>
                              ))}
                            </div>
                          </div>
                        )}
                        {textContent && !isLoading && (
                          <div className="flex items-center gap-1 mt-3 pt-2 border-t border-zinc-100 dark:border-zinc-800">
                            <button onClick={() => copyMessage(m.id, textContent)}
                              className={cn('p-1 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors', copied[m.id] ? 'text-green-600' : 'text-zinc-400 hover:text-zinc-600')}
                              title="Copy response">
                              {copied[m.id] ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                            </button>
                            {copied[m.id] && <span className="text-xs text-zinc-400 ml-1">Copied</span>}
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="whitespace-pre-wrap">{textContent}</div>
                    )}
                  </div>
                </div>
              )
            })}

            {status === 'submitted' && thinkingStage > 0 && (
              <div className="flex gap-3">
                <div className="h-8 w-8 rounded-full bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center shrink-0">
                  <BarChart2 className="h-4 w-4 text-amber-500 dark:text-amber-400" />
                </div>
                <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1">
                      <span className="h-1.5 w-1.5 bg-amber-400 rounded-full animate-bounce [animation-delay:0ms]" />
                      <span className="h-1.5 w-1.5 bg-amber-400 rounded-full animate-bounce [animation-delay:150ms]" />
                      <span className="h-1.5 w-1.5 bg-amber-400 rounded-full animate-bounce [animation-delay:300ms]" />
                    </div>
                    <span className="text-xs text-zinc-400">{THINKING_LABELS[thinkingStage]}</span>
                  </div>
                </div>
              </div>
            )}

            {error && (
              <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 dark:bg-red-950/30 rounded-lg px-3 py-2">
                <AlertCircle className="h-4 w-4" />Something went wrong. Please try again.
              </div>
            )}
            <div ref={bottomRef} />
          </div>
        )}
      </ScrollArea>

      {/* Input */}
      <div className="px-3 py-3 md:px-6 md:py-4 border-t border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-950 shrink-0">
        <form onSubmit={handleSubmit} className="flex gap-2 items-end">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={sector !== 'all' ? `Research ${sectorLabel} in Rwanda...` : "Explore Rwanda's market landscape..."}
            className="min-h-[48px] max-h-32 resize-none text-sm"
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSubmit() } }}
          />
          <Button
            type="submit"
            size="icon"
            disabled={isLoading || !input.trim()}
            className="h-12 w-12 shrink-0 bg-amber-500 hover:bg-amber-600 dark:bg-amber-600 dark:hover:bg-amber-500 text-white"
          >
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </div>
  )
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function IntelligenceChatPage() {
  const [activeSector, setActiveSector] = useState('all')
  const handleModelSelect = useCallback((_modelId: string) => {}, [])

  return (
    <div className="flex flex-col h-full">
      {/* Mobile: horizontal sector pill strip */}
      <div className="md:hidden flex items-center gap-1.5 px-3 py-2 overflow-x-auto shrink-0 border-b border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-950">
        {SECTORS.map((s) => (
          <button
            key={s.id}
            onClick={() => setActiveSector(s.id)}
            className={cn(
              'shrink-0 px-3 py-1 rounded-full text-xs font-medium transition-colors whitespace-nowrap',
              activeSector === s.id
                ? 'bg-amber-500 text-white'
                : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700',
            )}
          >
            {s.label}
          </button>
        ))}
      </div>

      {/* Main row: desktop left panel + chat */}
      <div className="flex flex-1 min-h-0">
        {/* Desktop: left sector panel */}
        <div className="hidden md:flex flex-col w-44 shrink-0 border-r border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-950 py-4 px-3">
          <p className="text-xs font-medium text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mb-3 px-1">Sector</p>
          <div className="space-y-0.5">
            {SECTORS.map((s) => (
              <button
                key={s.id}
                onClick={() => setActiveSector(s.id)}
                className={cn(
                  'w-full text-left px-2.5 py-1.5 rounded-md text-sm transition-colors',
                  activeSector === s.id
                    ? 'bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300 font-medium'
                    : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800/50',
                )}
              >
                {s.label}
              </button>
            ))}
          </div>
          {activeSector !== 'all' && (
            <button
              onClick={() => setActiveSector('all')}
              className="mt-3 px-2.5 py-1 text-xs text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors text-left"
            >
              Clear filter
            </button>
          )}
        </div>

        {/* Chat area — key remounts on sector change */}
        <ChatArea key={activeSector} sector={activeSector} onModelSelect={handleModelSelect} />
      </div>
    </div>
  )
}
