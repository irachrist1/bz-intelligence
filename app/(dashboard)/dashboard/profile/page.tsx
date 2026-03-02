'use client'

import { useEffect, useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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

const DEFAULT_PROFILE: Profile = {
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
}

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

const FUNDING_OPTIONS = ['GoR', 'World Bank', 'AfDB', 'UN', 'EU', 'USAID', 'Bilateral', 'All']
const COUNTRY_OPTIONS = ['Rwanda', 'Uganda', 'Kenya', 'Tanzania', 'Pan-Africa']
const LANGUAGE_OPTIONS = ['English', 'French', 'Kinyarwanda']

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

export default function ProfilePage() {
  const [profile, setProfile] = useState<Profile>(DEFAULT_PROFILE)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetch('/api/profile')
      .then((res) => res.json())
      .then((payload) => {
        if (payload?.profile) {
          setProfile({
            ...DEFAULT_PROFILE,
            ...payload.profile,
          })
        }
      })
      .catch(() => {
        toast.error('Could not load firm profile.')
      })
      .finally(() => setLoading(false))
  }, [])

  function update<K extends keyof Profile>(field: K, value: Profile[K]) {
    setProfile((current) => ({ ...current, [field]: value }))
  }

  function toggle(field: 'serviceCategories' | 'sectors' | 'fundingSources' | 'countries' | 'languages', value: string) {
    setProfile((current) => {
      const list = current[field]
      const next = list.includes(value) ? list.filter((item) => item !== value) : [...list, value]
      return { ...current, [field]: next }
    })
  }

  const canSave = useMemo(
    () => Boolean(profile.firmName && profile.legalEntityType && profile.serviceCategories.length > 0 && profile.sectors.length > 0),
    [profile]
  )

  async function save() {
    if (!canSave) {
      toast.error('Please complete required profile fields before saving.')
      return
    }

    setSaving(true)
    try {
      const response = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profile),
      })
      if (!response.ok) throw new Error('Request failed')
      toast.success('Firm profile updated.')
    } catch {
      toast.error('Could not save profile.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="p-6 max-w-4xl mx-auto space-y-3">
        <div className="h-7 w-52 bg-zinc-200 dark:bg-zinc-800 rounded animate-pulse" />
        <div className="h-4 w-80 bg-zinc-100 dark:bg-zinc-800/70 rounded animate-pulse" />
        <div className="h-48 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 animate-pulse" />
      </div>
    )
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100 mb-1">Firm Profile</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Keep this profile current to improve tender matching and alerts.
          </p>
        </div>
        <Button onClick={save} disabled={saving || !canSave}>
          {saving ? 'Saving...' : 'Save profile'}
        </Button>
      </div>

      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Identity</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label>Firm name</Label>
              <Input value={profile.firmName} onChange={(e) => update('firmName', e.target.value)} />
            </div>
            <div className="space-y-1.5">
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
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Capabilities</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label>Service categories</Label>
              <p className="text-xs text-zinc-500">Select all that apply.</p>
              <Chips options={SERVICE_OPTIONS} selected={profile.serviceCategories} onToggle={(value) => toggle('serviceCategories', value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Sectors</Label>
              <p className="text-xs text-zinc-500">Select all that apply.</p>
              <Chips options={SECTOR_OPTIONS} selected={profile.sectors} onToggle={(value) => toggle('sectors', value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Typical contract size</Label>
              <Select value={profile.contractSizeRange} onValueChange={(value) => update('contractSizeRange', value)}>
                <SelectTrigger><SelectValue placeholder="Select contract size range" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="lt_50k">Below $50K</SelectItem>
                  <SelectItem value="50k_250k">$50K - $250K</SelectItem>
                  <SelectItem value="250k_1m">$250K - $1M</SelectItem>
                  <SelectItem value="gt_1m">Above $1M</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Targeting</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label>Funding sources</Label>
              <p className="text-xs text-zinc-500">Select all that apply.</p>
              <Chips options={FUNDING_OPTIONS} selected={profile.fundingSources} onToggle={(value) => toggle('fundingSources', value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Countries</Label>
              <p className="text-xs text-zinc-500">Select all that apply.</p>
              <Chips options={COUNTRY_OPTIONS} selected={profile.countries} onToggle={(value) => toggle('countries', value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Proposal languages</Label>
              <p className="text-xs text-zinc-500">Select all that apply.</p>
              <Chips options={LANGUAGE_OPTIONS} selected={profile.languages} onToggle={(value) => toggle('languages', value)} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Keyword Rules</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label>Must-include keywords</Label>
              <Textarea
                value={profile.keywordsInclude}
                onChange={(e) => update('keywordsInclude', e.target.value)}
                placeholder="e.g. cybersecurity, enterprise architecture"
                className="min-h-[90px] resize-none"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Disqualifying keywords</Label>
              <Textarea
                value={profile.keywordsExclude}
                onChange={(e) => update('keywordsExclude', e.target.value)}
                placeholder="e.g. roads, heavy construction"
                className="min-h-[90px] resize-none"
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
