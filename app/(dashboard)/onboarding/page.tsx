'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'

type Profile = {
  firmName: string
  legalEntityType: string
  serviceCategories: string[]
  sectors: string[]
  contractSizeRange: string
  fundingSources: string[]
  countries: string[]
  languages: string[]
  keywordsInclude: string
  keywordsExclude: string
}

const TOTAL_STEPS = 4

const SERVICE_OPTIONS = [
  'IT consulting',
  'Legal services',
  'Management consulting',
  'Engineering',
  'Audit',
  'Training',
  'Construction',
  'Financial advisory',
]

const SECTOR_OPTIONS = [
  'ICT',
  'Public sector',
  'Health',
  'Education',
  'Energy',
  'Agriculture',
  'Finance',
  'Infrastructure',
]

const FUNDING_OPTIONS = [
  'GoR',
  'World Bank',
  'AfDB',
  'UN',
  'EU',
  'USAID',
  'Bilateral',
  'All',
]

const COUNTRY_OPTIONS = [
  'Rwanda',
  'Uganda',
  'Kenya',
  'Tanzania',
  'Pan-Africa',
]

const LANGUAGE_OPTIONS = ['English', 'French', 'Kinyarwanda']

function MultiSelectChips({
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
              'px-3 py-1.5 rounded-lg border text-xs transition-colors',
              active
                ? 'border-zinc-900 dark:border-zinc-200 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900'
                : 'border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:border-zinc-400',
            ].join(' ')}
          >
            {option}
          </button>
        )
      })}
    </div>
  )
}

export default function OnboardingPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [step, setStep] = useState(0)
  const [loading, setLoading] = useState(false)
  const [profile, setProfile] = useState<Profile>({
    firmName: '',
    legalEntityType: '',
    serviceCategories: [],
    sectors: [],
    contractSizeRange: '',
    fundingSources: [],
    countries: ['Rwanda'],
    languages: ['English'],
    keywordsInclude: '',
    keywordsExclude: '',
  })

  function update<K extends keyof Profile>(field: K, value: Profile[K]) {
    setProfile((current) => ({ ...current, [field]: value }))
  }

  function toggleArray(field: 'serviceCategories' | 'sectors' | 'fundingSources' | 'countries' | 'languages', value: string) {
    setProfile((current) => {
      const next = current[field].includes(value)
        ? current[field].filter((item) => item !== value)
        : [...current[field], value]
      return { ...current, [field]: next }
    })
  }

  async function finish() {
    setLoading(true)

    try {
      const res = await fetch('/api/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profile),
      })

      if (!res.ok) throw new Error('Failed to save profile')

      const requestedPath = searchParams.get('callbackUrl')
      const destination = requestedPath && requestedPath.startsWith('/') ? requestedPath : '/dashboard/tenders'
      router.push(destination)
    } catch {
      toast.error('Could not save your firm profile. Please try again.')
      setLoading(false)
    }
  }

  const progress = Math.round(((step + 1) / (TOTAL_STEPS + 1)) * 100)

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg">
        <div className="mb-6">
          <div className="flex justify-between text-xs text-zinc-400 mb-2">
            <span>Step {step + 1} of {TOTAL_STEPS + 1}</span>
            <span className="text-zinc-500">Firm capability profile</span>
          </div>
          <Progress value={progress} className="h-1.5" />
        </div>

        <Card>
          {step === 0 && (
            <>
              <CardHeader>
                <CardTitle>Set up your firm profile</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Firm name</Label>
                  <Input
                    placeholder="e.g. Kigali Digital Advisory Ltd"
                    value={profile.firmName}
                    onChange={(e) => update('firmName', e.target.value)}
                  />
                </div>

                <div>
                  <Label>Legal entity type</Label>
                  <Select value={profile.legalEntityType} onValueChange={(value) => update('legalEntityType', value)}>
                    <SelectTrigger><SelectValue placeholder="Select legal entity type" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ltd">Private Limited Company (Ltd)</SelectItem>
                      <SelectItem value="llp">Limited Liability Partnership (LLP)</SelectItem>
                      <SelectItem value="ngo">NGO / Non-profit</SelectItem>
                      <SelectItem value="branch">Branch of Foreign Company</SelectItem>
                      <SelectItem value="sole_prop">Sole Proprietorship</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex gap-2 pt-2">
                  <Button
                    onClick={() => setStep(1)}
                    className="flex-1"
                    disabled={!profile.firmName || !profile.legalEntityType}
                  >
                    Next
                  </Button>
                </div>
              </CardContent>
            </>
          )}

          {step === 1 && (
            <>
              <CardHeader>
                <CardTitle>What work does your firm do?</CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                <div>
                  <Label>Service categories</Label>
                  <p className="text-xs text-zinc-500 mb-2">Select all that apply.</p>
                  <MultiSelectChips
                    options={SERVICE_OPTIONS}
                    selected={profile.serviceCategories}
                    onToggle={(value) => toggleArray('serviceCategories', value)}
                  />
                </div>

                <div>
                  <Label>Sectors you primarily work in</Label>
                  <p className="text-xs text-zinc-500 mb-2">Select all that apply.</p>
                  <MultiSelectChips
                    options={SECTOR_OPTIONS}
                    selected={profile.sectors}
                    onToggle={(value) => toggleArray('sectors', value)}
                  />
                </div>

                <div className="flex gap-2 pt-2">
                  <Button variant="outline" onClick={() => setStep(0)} className="flex-1">Back</Button>
                  <Button
                    onClick={() => setStep(2)}
                    className="flex-1"
                    disabled={profile.serviceCategories.length === 0 || profile.sectors.length === 0}
                  >
                    Next
                  </Button>
                </div>
              </CardContent>
            </>
          )}

          {step === 2 && (
            <>
              <CardHeader>
                <CardTitle>Target profile</CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                <div>
                  <Label>Typical contract size</Label>
                  <Select value={profile.contractSizeRange} onValueChange={(value) => update('contractSizeRange', value)}>
                    <SelectTrigger><SelectValue placeholder="Select typical contract size range" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="lt_50k">Below $50K</SelectItem>
                      <SelectItem value="50k_250k">$50K - $250K</SelectItem>
                      <SelectItem value="250k_1m">$250K - $1M</SelectItem>
                      <SelectItem value="gt_1m">Above $1M</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Funding sources you target</Label>
                  <p className="text-xs text-zinc-500 mb-2">Select all that apply.</p>
                  <MultiSelectChips
                    options={FUNDING_OPTIONS}
                    selected={profile.fundingSources}
                    onToggle={(value) => toggleArray('fundingSources', value)}
                  />
                </div>

                <div>
                  <Label>Countries you operate in</Label>
                  <p className="text-xs text-zinc-500 mb-2">Select all that apply.</p>
                  <MultiSelectChips
                    options={COUNTRY_OPTIONS}
                    selected={profile.countries}
                    onToggle={(value) => toggleArray('countries', value)}
                  />
                </div>

                <div>
                  <Label>Proposal languages</Label>
                  <p className="text-xs text-zinc-500 mb-2">Select all that apply.</p>
                  <MultiSelectChips
                    options={LANGUAGE_OPTIONS}
                    selected={profile.languages}
                    onToggle={(value) => toggleArray('languages', value)}
                  />
                </div>

                <div className="flex gap-2 pt-2">
                  <Button variant="outline" onClick={() => setStep(1)} className="flex-1">Back</Button>
                  <Button
                    onClick={() => setStep(3)}
                    className="flex-1"
                    disabled={!profile.contractSizeRange || profile.fundingSources.length === 0 || profile.countries.length === 0}
                  >
                    Next
                  </Button>
                </div>
              </CardContent>
            </>
          )}

          {step === 3 && (
            <>
              <CardHeader>
                <CardTitle>Matching rules</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Keywords we should always watch for</Label>
                  <Textarea
                    placeholder="e.g. cybersecurity, enterprise architecture, cloud migration"
                    value={profile.keywordsInclude}
                    onChange={(e) => update('keywordsInclude', e.target.value)}
                    className="min-h-[90px] resize-none"
                  />
                </div>

                <div>
                  <Label>Keywords that disqualify tenders</Label>
                  <Textarea
                    placeholder="e.g. civil works, roads, heavy construction"
                    value={profile.keywordsExclude}
                    onChange={(e) => update('keywordsExclude', e.target.value)}
                    className="min-h-[90px] resize-none"
                  />
                </div>

                <div className="flex gap-2 pt-2">
                  <Button variant="outline" onClick={() => setStep(2)} className="flex-1">Back</Button>
                  <Button onClick={() => setStep(4)} className="flex-1">Review</Button>
                </div>
              </CardContent>
            </>
          )}

          {step === 4 && (
            <>
              <CardHeader>
                <CardTitle>Profile ready</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 p-4 text-sm text-zinc-600 dark:text-zinc-400 space-y-1">
                  <p>
                    Firm: <span className="font-medium text-zinc-900 dark:text-zinc-100">{profile.firmName}</span>
                  </p>
                  <p>
                    Services: <span className="font-medium text-zinc-900 dark:text-zinc-100">{profile.serviceCategories.join(', ')}</span>
                  </p>
                  <p>
                    Sectors: <span className="font-medium text-zinc-900 dark:text-zinc-100">{profile.sectors.join(', ')}</span>
                  </p>
                  <p>
                    Target size: <span className="font-medium text-zinc-900 dark:text-zinc-100">{profile.contractSizeRange}</span>
                  </p>
                </div>

                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setStep(3)} className="flex-1">Back</Button>
                  <Button onClick={finish} disabled={loading} className="flex-1">
                    {loading ? 'Saving profile...' : 'Open tender feed'}
                  </Button>
                </div>
              </CardContent>
            </>
          )}
        </Card>
      </div>
    </div>
  )
}
