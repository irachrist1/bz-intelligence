'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { AlertCircle, CheckCircle2, Sparkles, User } from 'lucide-react'

type FitScoreState =
  | { status: 'loading' }
  | { status: 'no_profile' }
  | { status: 'error' }
  | { status: 'ok'; score: number; reasons: string[]; gaps: string[] }

function scoreBadgeClass(score: number): string {
  if (score >= 70) return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
  if (score >= 40) return 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
  return 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300'
}

function scoreLabel(score: number): string {
  if (score >= 80) return 'Strong fit'
  if (score >= 60) return 'Moderate fit'
  if (score >= 40) return 'Weak fit'
  return 'Poor fit'
}

export function FitScoreCard({ tenderId }: { tenderId: string }) {
  const [state, setState] = useState<FitScoreState>({ status: 'loading' })

  useEffect(() => {
    let cancelled = false

    fetch(`/api/tenders/${tenderId}/fit-score`)
      .then((res) => res.json())
      .then((data: FitScoreState) => {
        if (!cancelled) setState(data)
      })
      .catch(() => {
        if (!cancelled) setState({ status: 'error' })
      })

    return () => { cancelled = true }
  }, [tenderId])

  if (state.status === 'loading') {
    return (
      <section className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 space-y-2">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="h-4 w-4 text-zinc-400" />
          <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">AI Fit Score</span>
        </div>
        <div className="h-4 w-24 rounded bg-zinc-100 dark:bg-zinc-800 animate-pulse" />
        <div className="h-3 w-48 rounded bg-zinc-100 dark:bg-zinc-800 animate-pulse" />
        <div className="h-3 w-40 rounded bg-zinc-100 dark:bg-zinc-800 animate-pulse" />
      </section>
    )
  }

  if (state.status === 'no_profile') {
    return (
      <section className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 h-8 w-8 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center shrink-0">
            <User className="h-4 w-4 text-zinc-500" />
          </div>
          <div>
            <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100 mb-1">Set up your firm profile to see your match score</p>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-3">
              Add your practice areas, sector focus, and target contract size. We'll show how well each tender fits your firm.
            </p>
            <Link
              href="/dashboard/profile"
              className="text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline"
            >
              Complete your firm profile →
            </Link>
          </div>
        </div>
      </section>
    )
  }

  if (state.status === 'error') {
    return (
      <section className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-zinc-400" />
          <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">AI Fit Score</span>
          <span className="ml-auto text-xs text-zinc-400">Unavailable</span>
        </div>
      </section>
    )
  }

  // state.status === 'ok'
  const { score, reasons, gaps } = state

  return (
    <section className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4">
      <div className="flex items-center gap-2 mb-3">
        <Sparkles className="h-4 w-4 text-zinc-500 dark:text-zinc-400" />
        <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">AI Fit Score</span>
        <div className="ml-auto flex items-center gap-2">
          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${scoreBadgeClass(score)}`}>
            {score}% — {scoreLabel(score)}
          </span>
        </div>
      </div>

      {reasons.length > 0 && (
        <ul className="space-y-1.5 mb-3">
          {reasons.map((reason, i) => (
            <li key={i} className="flex items-start gap-2 text-xs text-zinc-600 dark:text-zinc-400">
              <CheckCircle2 className="h-3.5 w-3.5 mt-0.5 text-emerald-500 shrink-0" />
              {reason}
            </li>
          ))}
        </ul>
      )}

      {gaps.length > 0 && (
        <ul className="space-y-1.5">
          {gaps.map((gap, i) => (
            <li key={i} className="flex items-start gap-2 text-xs text-zinc-600 dark:text-zinc-400">
              <AlertCircle className="h-3.5 w-3.5 mt-0.5 text-amber-500 shrink-0" />
              {gap}
            </li>
          ))}
        </ul>
      )}

      <p className="mt-3 text-[11px] text-zinc-400 dark:text-zinc-500">
        Based on your <Link href="/dashboard/profile" className="underline hover:text-zinc-600 dark:hover:text-zinc-300">firm profile</Link>. Update it to improve accuracy.
      </p>
    </section>
  )
}
