'use client'

import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'

type AlertFormState = {
  newMatchFrequency: string
  deadline7day: boolean
  deadline48hr: boolean
  tenderUpdate: boolean
  weeklyDigest: boolean
}

export function AlertsForm({ initialState }: { initialState: AlertFormState }) {
  const [state, setState] = useState<AlertFormState>(initialState)
  const [pending, startTransition] = useTransition()
  const [previewPending, startPreviewTransition] = useTransition()

  function setFlag(key: keyof AlertFormState) {
    setState((current) => ({ ...current, [key]: !current[key] }))
  }

  function save() {
    startTransition(async () => {
      const response = await fetch('/api/alerts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(state),
      })

      if (!response.ok) {
        toast.error('Could not save alert preferences.')
        return
      }

      toast.success('Alert preferences saved.')
    })
  }

  function sendPreview() {
    startPreviewTransition(async () => {
      const response = await fetch('/api/cron/weekly-digest/preview', {
        method: 'POST',
      })

      const payload = await response.json().catch(() => null)

      if (!response.ok) {
        toast.error('Could not send the digest preview.')
        return
      }

      if (payload?.sent > 0) {
        toast.success('Weekly digest preview sent to your email.')
        return
      }

      if (payload?.reason === 'email_not_configured') {
        toast.info('Email sending is not configured in this environment yet.')
        return
      }

      toast.info('No matching tenders from the past 7 days yet.')
    })
  }

  const toggleRows: { key: keyof AlertFormState; label: string; description: string }[] = [
    { key: 'deadline7day', label: '7-day deadline reminder', description: 'Email when a saved tender closes in 7 days' },
    { key: 'deadline48hr', label: '48-hour critical alert', description: 'Email when a saved tender closes in 48 hours' },
    { key: 'tenderUpdate', label: 'Tender updates', description: 'Notify when addenda or changes are published' },
    { key: 'weeklyDigest', label: 'Weekly summary email', description: 'Monday digest of new tenders matching your profile' },
  ]

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5">
        <div className="space-y-1.5 mb-3">
          <Label htmlFor="newMatchFrequency">New tender match alerts</Label>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            How often to notify you when new tenders match your firm profile.
          </p>
        </div>
        <Select
          value={state.newMatchFrequency}
          onValueChange={(value) => setState((current) => ({ ...current, newMatchFrequency: value }))}
        >
          <SelectTrigger id="newMatchFrequency" className="w-full sm:w-[240px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="realtime">Real-time (as tenders are approved)</SelectItem>
            <SelectItem value="daily">Daily digest</SelectItem>
            <SelectItem value="weekly">Weekly digest (Mondays)</SelectItem>
            <SelectItem value="off">Off</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 space-y-4">
        <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200">Deadline and update notifications</p>
        {toggleRows.map(({ key, label, description }) => (
          <div key={key} className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm text-zinc-800 dark:text-zinc-200">{label}</p>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">{description}</p>
            </div>
            <Switch
              checked={state[key] as boolean}
              onCheckedChange={() => setFlag(key)}
              aria-label={label}
            />
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 space-y-3">
        <div>
          <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200">Weekly digest preview</p>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
            Send yourself a copy of the Monday digest using tenders matched in the last 7 days.
          </p>
        </div>
        <Button variant="outline" onClick={sendPreview} disabled={previewPending}>
          {previewPending ? 'Sending preview...' : 'Send preview to my email'}
        </Button>
      </div>

      <Button onClick={save} disabled={pending}>
        {pending ? 'Saving...' : 'Save preferences'}
      </Button>
    </div>
  )
}
