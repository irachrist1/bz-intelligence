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
  serviceCategories: string[]
  contractSizeRange: string
  fundingSources: string[]
  keywordsInclude: string
  keywordsExclude: string
}

const DEFAULT_PROFILE: Profile = {
  firmName: '',
  serviceCategories: [],
  contractSizeRange: '',
  fundingSources: [],
  keywordsInclude: '',
  keywordsExclude: '',
}

const PRACTICE_AREAS = [
  'Legal services',
  'Management consulting',
  'IT consulting',
  'Financial advisory',
  'Audit & assurance',
  'Training & capacity building',
  'Engineering',
  'Research & evaluation',
  'Policy advisory',
  'Procurement advisory',
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

  function toggle(field: 'serviceCategories' | 'fundingSources', value: string) {
    setProfile((current) => {
      const list = current[field]
      const next = list.includes(value) ? list.filter((item) => item !== value) : [...list, value]
      return { ...current, [field]: next }
    })
  }

  const canSave = useMemo(
    () => Boolean(profile.firmName.trim() && profile.serviceCategories.length > 0),
    [profile]
  )

  async function save() {
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
      <div className="p-6 max-w-3xl mx-auto space-y-3">
        <div className="h-7 w-52 bg-zinc-200 dark:bg-zinc-800 rounded animate-pulse" />
        <div className="h-4 w-80 bg-zinc-100 dark:bg-zinc-800/70 rounded animate-pulse" />
        <div className="h-48 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 animate-pulse" />
      </div>
    )
  }

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100 mb-1">Firm Profile</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Keep this current to improve tender matching and alerts.
          </p>
        </div>
        <Button onClick={save} disabled={saving || !canSave}>
          {saving ? 'Saving...' : 'Save profile'}
        </Button>
      </div>

      <div className="space-y-4">
        <Card className="border-zinc-200 dark:border-zinc-800 shadow-none">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold">Identity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1.5">
              <Label>Firm name</Label>
              <Input
                value={profile.firmName}
                onChange={(e) => update('firmName', e.target.value)}
                placeholder="e.g. Kigali Advisory Partners Ltd"
              />
            </div>
          </CardContent>
        </Card>

        <Card className="border-zinc-200 dark:border-zinc-800 shadow-none">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold">Practice Areas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <p className="text-xs text-zinc-500 dark:text-zinc-400">Select all that apply.</p>
              <Chips
                options={PRACTICE_AREAS}
                selected={profile.serviceCategories}
                onToggle={(v) => toggle('serviceCategories', v)}
              />
            </div>
          </CardContent>
        </Card>

        <Card className="border-zinc-200 dark:border-zinc-800 shadow-none">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold">Targeting</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label>Typical contract size</Label>
              <Select value={profile.contractSizeRange} onValueChange={(v) => update('contractSizeRange', v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a range" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="lt_50k">Below $50K</SelectItem>
                  <SelectItem value="50k_250k">$50K – $250K</SelectItem>
                  <SelectItem value="250k_1m">$250K – $1M</SelectItem>
                  <SelectItem value="gt_1m">Above $1M</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Funding sources</Label>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">Select all that apply.</p>
              <Chips
                options={FUNDING_SOURCES}
                selected={profile.fundingSources}
                onToggle={(v) => toggle('fundingSources', v)}
              />
            </div>
          </CardContent>
        </Card>

        <Card className="border-zinc-200 dark:border-zinc-800 shadow-none">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold">Keyword Rules</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label>Keywords to always watch for</Label>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">Comma-separated. Optional.</p>
              <Textarea
                value={profile.keywordsInclude}
                onChange={(e) => update('keywordsInclude', e.target.value)}
                placeholder="e.g. data governance, enterprise architecture"
                className="min-h-[80px] resize-none"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Keywords that disqualify a tender</Label>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">Comma-separated. Optional.</p>
              <Textarea
                value={profile.keywordsExclude}
                onChange={(e) => update('keywordsExclude', e.target.value)}
                placeholder="e.g. civil works, road construction"
                className="min-h-[80px] resize-none"
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
