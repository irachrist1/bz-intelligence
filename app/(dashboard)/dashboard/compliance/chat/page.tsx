'use client'

import { useChat } from '@ai-sdk/react'
import { TextStreamChatTransport, isTextUIPart, UIMessage } from 'ai'
import { useRef, useEffect, useState, useMemo, useCallback } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Send, Shield, User, AlertCircle, ThumbsUp, ThumbsDown, Copy, Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import { ModelSelector } from '@/components/model-selector'

const STORAGE_KEY = 'bz-chat-compliance'

const THINKING_LABELS = [
  '',
  'Thinking...',
  'Searching knowledge base...',
  'Reviewing sources...',
  'Composing response...',
]

// Split response into main content + citation sources
// Handles: ## Sources, **Sources:**, Sources:, etc.
function parseResponse(text: string): { mainContent: string; sources: string[] } {
  const match = text.match(/\n+(?:#{1,3}\s*\*{0,2}Sources?\*{0,2}|Sources?:)\s*\n+([\s\S]*)$/i)
  if (!match) return { mainContent: text, sources: [] }
  const mainContent = text.slice(0, text.length - match[0].length).trim()
  const sources = match[1]
    .split('\n')
    .map((l) => l.replace(/^[-*•\d.]\s*/, '').trim())
    .filter((l) => l.length > 5)
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
  code: ({ children }: any) => (
    <code className="bg-blue-50 dark:bg-blue-950/40 px-1 py-0.5 rounded text-xs font-mono">{children}</code>
  ),
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  blockquote: ({ children }: any) => (
    <blockquote className="border-l-2 border-blue-200 dark:border-blue-800 pl-3 text-zinc-500 italic mb-2">
      {children}
    </blockquote>
  ),
}

const EXAMPLE_QUESTIONS = [
  'What licenses does a digital lending startup need?',
  'How do I register my company with RDB?',
  'What are the VAT registration thresholds?',
  'What are my PAYE obligations as an employer?',
]

export default function ComplianceChatPage() {
  const [input, setInput] = useState('')
  const [feedbackSent, setFeedbackSent] = useState<Record<string, 'up' | 'down'>>({})
  const [copied, setCopied] = useState<Record<string, boolean>>({})
  const [thinkingStage, setThinkingStage] = useState(0)
  const bottomRef = useRef<HTMLDivElement>(null)

  // Mutable body object — transport reads this by reference on each request
  const transportBody = useRef<Record<string, unknown>>({ mode: 'compliance' })
  const transport = useMemo(
    () => new TextStreamChatTransport({ api: '/api/ai/chat', body: transportBody.current }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  )

  // Load persisted messages from localStorage (runs once on mount)
  const [initialMessages] = useState<UIMessage[]>(() => {
    if (typeof window === 'undefined') return []
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')
    } catch {
      return []
    }
  })

  const { messages, sendMessage, status, error } = useChat({ transport, messages: initialMessages })
  const isLoading = status === 'submitted' || status === 'streaming'

  // Persist messages to localStorage on every change
  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(messages))
    }
  }, [messages])

  // Staged thinking indicator — only fires during 'submitted' (before streaming starts)
  useEffect(() => {
    if (status !== 'submitted') {
      setThinkingStage(0)
      return
    }
    setThinkingStage(1)
    const t1 = setTimeout(() => setThinkingStage(2), 1500)
    const t2 = setTimeout(() => setThinkingStage(3), 7000)
    const t3 = setTimeout(() => setThinkingStage(4), 18000)
    return () => {
      clearTimeout(t1)
      clearTimeout(t2)
      clearTimeout(t3)
    }
  }, [status])

  // When model is selected, update the transport body (read by ref on next request)
  const handleModelSelect = useCallback((modelId: string) => {
    transportBody.current.modelOverride = modelId
  }, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, thinkingStage])

  async function sendFeedback(messageId: string, rating: 'up' | 'down') {
    if (feedbackSent[messageId]) return
    setFeedbackSent((prev) => ({ ...prev, [messageId]: rating }))
    const msgIndex = messages.findIndex((m) => m.id === messageId)
    const precedingUserMsg = messages.slice(0, msgIndex).reverse().find((m) => m.role === 'user')
    const query = precedingUserMsg?.parts.filter(isTextUIPart).map((p) => p.text).join('') || ''
    await fetch('/api/ai/feedback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messageId, rating, query, mode: 'compliance' }),
    }).catch(() => {})
  }

  async function copyMessage(messageId: string, text: string) {
    await navigator.clipboard.writeText(text).catch(() => {})
    setCopied((prev) => ({ ...prev, [messageId]: true }))
    setTimeout(() => setCopied((prev) => ({ ...prev, [messageId]: false })), 2000)
  }

  function handleSubmit(e?: React.FormEvent) {
    e?.preventDefault()
    if (!input.trim() || isLoading) return
    sendMessage({ text: input })
    setInput('')
  }

  return (
    <div className="flex flex-col h-full">
      {/* ── Header — blue identity ─────────────────────────────────────────── */}
      <div className="px-6 py-4 border-b border-blue-100 bg-blue-50/60 dark:bg-blue-950/20 dark:border-blue-900/40">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-blue-600 dark:bg-blue-700 text-white flex items-center justify-center shrink-0">
              <Shield style={{ width: '18px', height: '18px' }} />
            </div>
            <div>
              <h1 className="font-semibold text-zinc-900 dark:text-zinc-100">Compliance Advisor</h1>
              <p className="text-xs text-zinc-500 mt-0.5">Rwanda regulatory guidance · Verified sources only</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <ModelSelector onSelect={handleModelSelect} />
            {messages.length > 0 && (
              <button
                onClick={() => {
                  localStorage.removeItem(STORAGE_KEY)
                  window.location.reload()
                }}
                className="text-xs text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 px-2 py-1 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
              >
                Clear
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── Messages ──────────────────────────────────────────────────────── */}
      <ScrollArea className="flex-1 px-6 py-4">
        {messages.length === 0 ? (
          <div className="max-w-2xl mx-auto">
            <div className="text-center mb-8 pt-8">
              <div className="h-14 w-14 bg-blue-100 dark:bg-blue-900/40 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Shield className="h-7 w-7 text-blue-600 dark:text-blue-400" />
              </div>
              <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-2">
                Your Rwanda compliance advisor
              </h2>
              <p className="text-sm text-zinc-500 dark:text-zinc-400 max-w-sm mx-auto">
                Ask anything about licensing, registration, taxes, or regulatory requirements. Every answer cites
                verified sources.
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {EXAMPLE_QUESTIONS.map((q) => (
                <button
                  key={q}
                  onClick={() => setInput(q)}
                  className="text-left p-3 rounded-lg border border-blue-100 dark:border-blue-900/40 text-sm text-zinc-600 dark:text-zinc-400 hover:border-blue-300 dark:hover:border-blue-700 hover:bg-blue-50/50 dark:hover:bg-blue-950/30 transition-colors"
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
              const { mainContent, sources } =
                m.role === 'assistant' ? parseResponse(textContent) : { mainContent: textContent, sources: [] }

              return (
                <div key={m.id} className={cn('flex gap-3', m.role === 'user' ? 'flex-row-reverse' : 'flex-row')}>
                  <div
                    className={cn(
                      'h-8 w-8 rounded-full flex items-center justify-center shrink-0',
                      m.role === 'user'
                        ? 'bg-zinc-900 text-white dark:bg-zinc-200 dark:text-zinc-900'
                        : 'bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400',
                    )}
                  >
                    {m.role === 'user' ? <User className="h-4 w-4" /> : <Shield className="h-4 w-4" />}
                  </div>

                  <div
                    className={cn(
                      'flex-1 rounded-xl px-4 py-3 text-sm leading-relaxed',
                      m.role === 'user'
                        ? 'bg-zinc-900 text-white dark:bg-zinc-800 max-w-sm'
                        : 'bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-800 dark:text-zinc-200',
                    )}
                  >
                    {m.role === 'assistant' ? (
                      <>
                        <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
                          {mainContent}
                        </ReactMarkdown>

                        {/* Citation cards */}
                        {sources.length > 0 && (
                          <div className="mt-4 pt-3 border-t border-blue-100 dark:border-blue-900/40">
                            <p className="text-xs font-medium text-blue-600 dark:text-blue-400 mb-2 flex items-center gap-1.5">
                              <Shield className="h-3 w-3" />
                              Verified sources
                            </p>
                            <div className="space-y-1.5">
                              {sources.map((source, i) => (
                                <div
                                  key={i}
                                  className="text-xs bg-blue-50/70 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/40 rounded-md px-3 py-2 text-zinc-600 dark:text-zinc-400"
                                >
                                  {source}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Action row */}
                        {textContent && !isLoading && (
                          <div className="flex items-center gap-1 mt-3 pt-2 border-t border-zinc-100 dark:border-zinc-800">
                            <button
                              onClick={() => copyMessage(m.id, textContent)}
                              className={cn(
                                'p-1 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors',
                                copied[m.id] ? 'text-green-600' : 'text-zinc-400 hover:text-zinc-600',
                              )}
                              title="Copy response"
                            >
                              {copied[m.id] ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                            </button>
                            <span className="w-px h-3 bg-zinc-200 dark:bg-zinc-700 mx-0.5" />
                            <span className="text-xs text-zinc-400 mr-1">Helpful?</span>
                            <button
                              onClick={() => sendFeedback(m.id, 'up')}
                              className={cn(
                                'p-1 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors',
                                feedbackSent[m.id] === 'up' ? 'text-green-600' : 'text-zinc-400 hover:text-zinc-600',
                              )}
                              aria-label="Thumbs up"
                            >
                              <ThumbsUp className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={() => sendFeedback(m.id, 'down')}
                              className={cn(
                                'p-1 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors',
                                feedbackSent[m.id] === 'down' ? 'text-red-500' : 'text-zinc-400 hover:text-zinc-600',
                              )}
                              aria-label="Thumbs down"
                            >
                              <ThumbsDown className="h-3.5 w-3.5" />
                            </button>
                            {feedbackSent[m.id] && <span className="text-xs text-zinc-400 ml-1">Thanks</span>}
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

            {/* Staged thinking indicator — visible only before streaming begins */}
            {status === 'submitted' && thinkingStage > 0 && (
              <div className="flex gap-3">
                <div className="h-8 w-8 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center shrink-0">
                  <Shield className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1">
                      <span className="h-1.5 w-1.5 bg-blue-400 rounded-full animate-bounce [animation-delay:0ms]" />
                      <span className="h-1.5 w-1.5 bg-blue-400 rounded-full animate-bounce [animation-delay:150ms]" />
                      <span className="h-1.5 w-1.5 bg-blue-400 rounded-full animate-bounce [animation-delay:300ms]" />
                    </div>
                    <span className="text-xs text-zinc-400">{THINKING_LABELS[thinkingStage]}</span>
                  </div>
                </div>
              </div>
            )}

            {error && (
              <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 dark:bg-red-950/30 rounded-lg px-3 py-2">
                <AlertCircle className="h-4 w-4 shrink-0" />
                Something went wrong. Please try again.
              </div>
            )}
            <div ref={bottomRef} />
          </div>
        )}
      </ScrollArea>

      {/* ── Input ─────────────────────────────────────────────────────────── */}
      <div className="px-6 py-4 border-t border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-950">
        <div className="max-w-2xl mx-auto">
          <form onSubmit={handleSubmit} className="flex gap-2 items-end">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about your compliance requirements..."
              className="min-h-[52px] max-h-32 resize-none text-sm"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  handleSubmit()
                }
              }}
            />
            <Button
              type="submit"
              size="icon"
              disabled={isLoading || !input.trim()}
              className="h-[52px] w-[52px] shrink-0 bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600"
            >
              <Send className="h-4 w-4" />
            </Button>
          </form>
          <p className="text-xs text-zinc-400 mt-2 text-center">
            General guidance only — not legal advice. Verify requirements with the relevant regulatory body.
          </p>
        </div>
      </div>
    </div>
  )
}
