'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { CheckCircle2, Circle, Clock, ExternalLink, ChevronDown, ChevronUp } from 'lucide-react'
import type { RoadmapEntry } from '@/lib/types'

const STATUS_CONFIG = {
  pending: { label: 'Pending', icon: Circle, color: 'text-zinc-400' },
  in_progress: { label: 'In progress', icon: Clock, color: 'text-amber-500' },
  completed: { label: 'Completed', icon: CheckCircle2, color: 'text-green-500' },
  skipped: { label: 'Skipped', icon: Circle, color: 'text-zinc-300' },
}

function StepCard({ step, onStatusChange }: { step: RoadmapEntry; onStatusChange: (id: string, status: string) => void }) {
  const [expanded, setExpanded] = useState(false)
  const config = STATUS_CONFIG[step.status]
  const Icon = config.icon

  return (
    <div className={`border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 bg-white dark:bg-zinc-900 transition-all ${step.status === 'completed' ? 'opacity-60' : ''}`}>
      <div className="flex items-start gap-3">
        <Icon className={`h-5 w-5 mt-0.5 shrink-0 ${config.color}`} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className={`font-medium text-sm ${step.status === 'completed' ? 'line-through text-zinc-400' : 'text-zinc-900 dark:text-zinc-100'}`}>
              {step.title}
            </h3>
            {step.regBodyCode && (
              <Badge variant="secondary" className="text-xs">{step.regBodyCode}</Badge>
            )}
            {step.isOptional && (
              <Badge variant="outline" className="text-xs">Optional</Badge>
            )}
          </div>
          <p className="text-xs text-zinc-500 mt-1">{step.plainLanguage}</p>

          {/* Meta row */}
          <div className="flex items-center gap-4 mt-2 text-xs text-zinc-400">
            {step.costRwf && <span>~{step.costRwf.toLocaleString()} RWF</span>}
            {step.timelineDays && <span>{step.timelineDays} days</span>}
            {step.applyUrl && (
              <a href={step.applyUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-blue-500 hover:underline">
                Apply <ExternalLink className="h-3 w-3" />
              </a>
            )}
          </div>
        </div>

        <button
          onClick={() => setExpanded((v) => !v)}
          className="text-zinc-400 hover:text-zinc-600 shrink-0"
        >
          {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </button>
      </div>

      {expanded && (
        <div className="mt-4 pl-8 space-y-3 border-t border-zinc-100 dark:border-zinc-800 pt-4">
          <p className="text-sm text-zinc-600 dark:text-zinc-400">{step.description}</p>

          {step.documentsReq && Array.isArray(step.documentsReq) && step.documentsReq.length > 0 && (
            <div>
              <p className="text-xs font-medium text-zinc-500 mb-1">Documents required:</p>
              <ul className="text-xs text-zinc-600 space-y-0.5">
                {step.documentsReq!.map((doc, i) => (
                  <li key={i} className="flex items-center gap-1">
                    <span className="text-zinc-300">•</span> {doc.name}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {step.penaltyDescription && (
            <div className="text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/30 rounded-md px-3 py-2">
              ⚠️ {step.penaltyDescription}
            </div>
          )}

          {/* Status actions */}
          <div className="flex items-center gap-2 pt-1">
            {step.status !== 'completed' && (
              <Button size="sm" onClick={() => onStatusChange(step.id, 'completed')} className="h-7 text-xs">
                Mark complete
              </Button>
            )}
            {step.status !== 'in_progress' && step.status !== 'completed' && (
              <Button size="sm" variant="outline" onClick={() => onStatusChange(step.id, 'in_progress')} className="h-7 text-xs">
                Mark in progress
              </Button>
            )}
            {step.status === 'completed' && (
              <Button size="sm" variant="outline" onClick={() => onStatusChange(step.id, 'pending')} className="h-7 text-xs">
                Mark incomplete
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default function ComplianceRoadmapPage() {
  const [steps, setSteps] = useState<RoadmapEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [needsOnboarding, setNeedsOnboarding] = useState(false)

  useEffect(() => {
    fetch('/api/compliance/roadmap')
      .then((r) => r.json())
      .then((data) => {
        setSteps(data.steps || [])
        setNeedsOnboarding(data.needsOnboarding)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  async function handleStatusChange(stepId: string, status: string) {
    // Optimistic update
    setSteps((prev) =>
      prev.map((s) => (s.id === stepId ? { ...s, status: status as RoadmapEntry['status'] } : s))
    )
    await fetch('/api/compliance/roadmap', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ stepId, status }),
    })
  }

  const completed = steps.filter((s) => s.status === 'completed').length
  const total = steps.filter((s) => !s.isOptional).length
  const progress = total > 0 ? Math.round((completed / total) * 100) : 0

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center">
        <div className="text-zinc-400 text-sm">Loading your compliance roadmap...</div>
      </div>
    )
  }

  if (needsOnboarding) {
    return (
      <div className="p-8 max-w-2xl mx-auto text-center">
        <div className="text-4xl mb-4">📋</div>
        <h1 className="text-2xl font-semibold mb-2">Set up your compliance profile</h1>
        <p className="text-zinc-500 mb-6">
          Tell us about your business and we&apos;ll generate a personalized compliance roadmap.
        </p>
        <Link href="/onboarding">
          <Button>Complete setup</Button>
        </Link>
      </div>
    )
  }

  if (steps.length === 0) {
    return (
      <div className="p-8 max-w-2xl mx-auto text-center">
        <div className="text-4xl mb-4">🔍</div>
        <h1 className="text-2xl font-semibold mb-2">No steps found yet</h1>
        <p className="text-zinc-500 mb-6">
          We&apos;re still building the knowledge base for your sector. Check back soon or ask the AI compliance chat.
        </p>
        <Link href="/dashboard/compliance/chat">
          <Button>Ask the AI</Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100 mb-1">Compliance Roadmap</h1>
        <p className="text-zinc-500 dark:text-zinc-400 text-sm">Your personalized compliance checklist for Rwanda</p>
      </div>

      {/* Health score */}
      <Card className="mb-6">
        <CardContent className="pt-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Compliance Health</span>
            <span className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">{progress}%</span>
          </div>
          <Progress value={progress} className="h-2 mb-2" />
          <p className="text-xs text-zinc-400">
            {completed} of {total} required steps completed
          </p>
        </CardContent>
      </Card>

      {/* Roadmap */}
      <div className="space-y-3">
        {steps.map((step) => (
          <StepCard key={step.id} step={step} onStatusChange={handleStatusChange} />
        ))}
      </div>
    </div>
  )
}
