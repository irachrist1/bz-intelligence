'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'

type Profile = {
  firmName: string
  serviceCategories: string[]
  fundingSources: string[]
  keywordsInclude: string
  keywordsExclude: string
}

const PRACTICE_AREAS = [
  // Tax & advisory (Andersen Tax Services)
  'Tax compliance & strategy',
  'Tax advisory',
  'Transfer pricing',
  'International tax',
  // Legal & corporate (Andersen Corporate & Legal Support)
  'Legal services',
  'Corporate & commercial law',
  'Regulatory & compliance',
  // Advisory & consulting (Andersen Advisory)
  'Management consulting',
  'Financial advisory',
  'Strategy & growth advisory',
  'Risk management & governance',
  // Assurance & finance
  'Audit & assurance',
  'Finance & accounting support',
  // People & operations (Andersen Business Support)
  'HR & people advisory',
  // Technology
  'IT & technology consulting',
  // Other
  'Training & capacity building',
  'Research & evaluation',
  'Policy advisory',
  'Procurement advisory',
  'Engineering',
]

const FUNDING_SOURCES = [
  'RPPA / GoR',
  'World Bank',
  'UNGM',
  'AfDB',
  'UN agencies',
  'EU',
  'USAID',
  'All',
]

function Chips({
  options,
  selected,
  onToggle,
}: {
  options: string[]
  selected: string[]
  onToggle: (value: string) => void
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((option) => {
        const active = selected.includes(option)
        return (
          <button
            key={option}
            type="button"
            onClick={() => onToggle(option)}
            className={[
              'px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors',
              active
                ? 'border-zinc-900 dark:border-zinc-200 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900'
                : 'border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:border-zinc-400 dark:hover:border-zinc-500',
            ].join(' ')}
          >
            {option}
          </button>
        )
      })}
    </div>
  )
}

const TOTAL_STEPS = 3

export default function OnboardingPage() {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [saving, setSaving] = useState(false)
  const [profile, setProfile] = useState<Profile>({
    firmName: '',
    serviceCategories: [],
    fundingSources: [],
    keywordsInclude: '',
    keywordsExclude: '',
  })

  function update<K extends keyof Profile>(field: K, value: Profile[K]) {
    setProfile((p) => ({ ...p, [field]: value }))
  }

  function toggle(field: 'serviceCategories' | 'fundingSources', value: string) {
    setProfile((p) => {
      const next = p[field].includes(value)
        ? p[field].filter((v) => v !== value)
        : [...p[field], value]
      return { ...p, [field]: next }
    })
  }

  async function submit() {
    setSaving(true)
    try {
      const res = await fetch('/api/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profile),
      })
      if (!res.ok) throw new Error('Save failed')
      router.push('/dashboard/tenders')
    } catch {
      toast.error('Could not save your profile. Please try again.')
      setSaving(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-16 bg-zinc-50 dark:bg-zinc-950">
      <div className="w-full max-w-[480px]">

        {/* Header */}
        <div className="mb-8 text-center">
          <p className="text-xs font-medium text-zinc-400 tracking-widest uppercase mb-2">BZ Intelligence</p>
          <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100">Set up your firm profile</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">Takes 2 minutes. Powers your tender feed and match scores.</p>
        </div>

        {/* Progress */}
        <div className="flex items-center gap-3 mb-6">
          {Array.from({ length: TOTAL_STEPS + 1 }).map((_, i) => (
            <div
              key={i}
              className={[
                'flex-1 h-1 rounded-full transition-colors',
                i <= step
                  ? 'bg-zinc-900 dark:bg-zinc-100'
                  : 'bg-zinc-200 dark:bg-zinc-800',
              ].join(' ')}
            />
          ))}
        </div>

        <Card className="border-zinc-200 dark:border-zinc-800 shadow-none">

          {/* Step 0 — Firm name */}
          {step === 0 && (
            <>
              <CardHeader className="pb-4">
                <CardTitle className="text-base font-semibold">What's your firm called?</CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="space-y-1.5">
                  <Label htmlFor="firmName">Firm name</Label>
                  <Input
                    id="firmName"
                    autoFocus
                    placeholder="e.g. Kigali Advisory Partners Ltd"
                    value={profile.firmName}
                    onChange={(e) => update('firmName', e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter' && profile.firmName.trim()) setStep(1) }}
                  />
                </div>
                <Button
                  onClick={() => setStep(1)}
                  disabled={!profile.firmName.trim()}
                  className="w-full"
                >
                  Continue
                </Button>
              </CardContent>
            </>
          )}

          {/* Step 1 — Practice areas */}
          {step === 1 && (
            <>
              <CardHeader className="pb-4">
                <CardTitle className="text-base font-semibold">What does your firm do?</CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="space-y-2">
                  <Label>Practice areas</Label>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">Select all that apply.</p>
                  <Chips
                    options={PRACTICE_AREAS}
                    selected={profile.serviceCategories}
                    onToggle={(v) => toggle('serviceCategories', v)}
                  />
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setStep(0)} className="flex-1">Back</Button>
                  <Button
                    onClick={() => setStep(2)}
                    disabled={profile.serviceCategories.length === 0}
                    className="flex-1"
                  >
                    Continue
                  </Button>
                </div>
              </CardContent>
            </>
          )}

          {/* Step 2 — Funding sources */}
          {step === 2 && (
            <>
              <CardHeader className="pb-4">
                <CardTitle className="text-base font-semibold">Which funding sources do you track?</CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="space-y-2">
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">Select all that apply.</p>
                  <Chips
                    options={FUNDING_SOURCES}
                    selected={profile.fundingSources}
                    onToggle={(v) => toggle('fundingSources', v)}
                  />
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setStep(1)} className="flex-1">Back</Button>
                  <Button
                    onClick={() => setStep(3)}
                    disabled={profile.fundingSources.length === 0}
                    className="flex-1"
                  >
                    Continue
                  </Button>
                </div>
              </CardContent>
            </>
          )}

          {/* Step 3 — Keywords + submit */}
          {step === 3 && (
            <>
              <CardHeader className="pb-4">
                <CardTitle className="text-base font-semibold">Fine-tune your matching</CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="space-y-1.5">
                  <Label htmlFor="kw-include">Keywords to always watch for</Label>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">Comma-separated. Optional.</p>
                  <Textarea
                    id="kw-include"
                    placeholder="e.g. transfer pricing, tax audit"
                    value={profile.keywordsInclude}
                    onChange={(e) => update('keywordsInclude', e.target.value)}
                    className="min-h-[80px] resize-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="kw-exclude">Keywords that disqualify a tender</Label>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">Comma-separated. Optional.</p>
                  <Textarea
                    id="kw-exclude"
                    placeholder="e.g. civil works, road construction"
                    value={profile.keywordsExclude}
                    onChange={(e) => update('keywordsExclude', e.target.value)}
                    className="min-h-[80px] resize-none"
                  />
                </div>

                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setStep(2)} className="flex-1">Back</Button>
                  <Button onClick={submit} disabled={saving} className="flex-1">
                    {saving ? 'Saving...' : 'Open tender feed →'}
                  </Button>
                </div>
              </CardContent>
            </>
          )}
        </Card>

        <p className="text-center text-xs text-zinc-400 dark:text-zinc-500 mt-5">
          You can update this any time from your profile settings.
        </p>
      </div>
    </div>
  )
}
