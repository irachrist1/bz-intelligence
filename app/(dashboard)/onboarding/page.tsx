'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Progress } from '@/components/ui/progress'
import { toast } from 'sonner'

type AppMode = 'compliance' | 'intelligence' | 'both'

type Profile = {
  bizName: string
  bizType: string
  sector: string
  customerType: string
  currentStatus: string
  handlesMoney: boolean
  transactionType: string[]
  foreignOwnership: boolean
  collectsData: boolean
  employeeRange: string
  operatesProvince: boolean
  biggestQuestion: string
}

const TOTAL_STEPS = 5

export default function OnboardingPage() {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [loading, setLoading] = useState(false)
  const [appMode, setAppMode] = useState<AppMode>('compliance')
  const [profile, setProfile] = useState<Partial<Profile>>({
    handlesMoney: false,
    foreignOwnership: false,
    collectsData: false,
    operatesProvince: false,
    transactionType: [],
  })

  function set<K extends keyof Profile>(field: K, value: Profile[K]) {
    setProfile((p) => ({ ...p, [field]: value }))
  }

  function toggleTransactionType(type: string) {
    setProfile((p) => {
      const current = p.transactionType || []
      return {
        ...p,
        transactionType: current.includes(type)
          ? current.filter((t) => t !== type)
          : [...current, type],
      }
    })
  }

  async function finish() {
    setLoading(true)
    try {
      const res = await fetch('/api/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...profile, appMode }),
      })
      if (!res.ok) throw new Error('Failed to save profile')
      const destination = appMode === 'intelligence' ? '/dashboard/intelligence' : '/dashboard/compliance'
      router.push(destination)
    } catch {
      toast.error('Could not save your profile. Please try again.')
      setLoading(false)
    }
  }

  const progress = Math.round(((step + 1) / (TOTAL_STEPS + 1)) * 100)

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950 px-4">
      <div className="w-full max-w-lg">
        <div className="mb-6">
          <div className="flex justify-between text-xs text-zinc-400 mb-2">
            <span>Step {step + 1} of {TOTAL_STEPS + 1}</span>
            <span className="text-zinc-500">BZ Intelligence</span>
          </div>
          <Progress value={progress} className="h-1.5" />
        </div>

        <Card>
          {/* ── Step 0: Mode ─────────────────────────────────────────── */}
          {step === 0 && (
            <>
              <CardHeader>
                <CardTitle>What brings you here?</CardTitle>
                <p className="text-sm text-zinc-500 mt-1">This shapes your experience from the start.</p>
              </CardHeader>
              <CardContent className="space-y-3">
                {[
                  { label: "I'm a founder navigating Rwanda compliance", value: 'compliance' as AppMode, icon: '✅', sub: 'Personalized roadmap, AI compliance advisor, document tracker' },
                  { label: "I'm an investor or researcher", value: 'intelligence' as AppMode, icon: '🔍', sub: 'Company directory, sector dashboards, AI market analyst' },
                  { label: 'Both — compliance and market intelligence', value: 'both' as AppMode, icon: '⚡', sub: 'Full access to both modes' },
                ].map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => { setAppMode(opt.value); setStep(1) }}
                    className="w-full flex items-start gap-3 p-4 rounded-lg border border-zinc-200 dark:border-zinc-700 hover:border-zinc-400 dark:hover:border-zinc-500 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors text-left"
                  >
                    <span className="text-xl mt-0.5">{opt.icon}</span>
                    <div>
                      <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200">{opt.label}</p>
                      <p className="text-xs text-zinc-400 mt-0.5">{opt.sub}</p>
                    </div>
                  </button>
                ))}
              </CardContent>
            </>
          )}

          {/* ── Step 1: Business basics ──────────────────────────────── */}
          {step === 1 && (
            <>
              <CardHeader>
                <CardTitle>About your business</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Business name (optional)</Label>
                  <Input
                    placeholder="e.g. Kigali Tech Ltd"
                    value={profile.bizName || ''}
                    onChange={(e) => set('bizName', e.target.value)}
                  />
                </div>
                <div>
                  <Label>Legal structure</Label>
                  <Select value={profile.bizType} onValueChange={(v) => set('bizType', v)}>
                    <SelectTrigger><SelectValue placeholder="Select structure" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ltd">Private Limited Company (Ltd)</SelectItem>
                      <SelectItem value="sole_prop">Sole Proprietorship</SelectItem>
                      <SelectItem value="ngo">NGO / Non-profit / Association</SelectItem>
                      <SelectItem value="branch">Branch of Foreign Company</SelectItem>
                      <SelectItem value="cooperative">Cooperative</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Primary sector</Label>
                  <Select value={profile.sector} onValueChange={(v) => set('sector', v)}>
                    <SelectTrigger><SelectValue placeholder="Select sector" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="fintech">Financial Services & Fintech</SelectItem>
                      <SelectItem value="agritech">Agriculture & Agritech</SelectItem>
                      <SelectItem value="healthtech">Health & Healthtech</SelectItem>
                      <SelectItem value="ict">Telecommunications & ICT</SelectItem>
                      <SelectItem value="energy">Energy & Cleantech</SelectItem>
                      <SelectItem value="retail">Retail & E-commerce</SelectItem>
                      <SelectItem value="logistics">Logistics & Transport</SelectItem>
                      <SelectItem value="education">Education & Edtech</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Where are you in your journey?</Label>
                  <Select value={profile.currentStatus} onValueChange={(v) => set('currentStatus', v)}>
                    <SelectTrigger><SelectValue placeholder="Select status" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="idea">Pre-registration — still an idea</SelectItem>
                      <SelectItem value="registered">Registered with RDB, not yet operating</SelectItem>
                      <SelectItem value="operating">Operating — already have customers</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex gap-2 pt-2">
                  <Button variant="outline" onClick={() => setStep(0)} className="flex-1">Back</Button>
                  <Button
                    onClick={() => setStep(2)}
                    disabled={!profile.bizType || !profile.sector || !profile.currentStatus}
                    className="flex-1"
                  >
                    Next
                  </Button>
                </div>
              </CardContent>
            </>
          )}

          {/* ── Step 2: Customer type + money ────────────────────────── */}
          {step === 2 && (
            <>
              <CardHeader>
                <CardTitle>Customers & revenue</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Who are your primary customers?</Label>
                  <Select value={profile.customerType} onValueChange={(v) => set('customerType', v)}>
                    <SelectTrigger><SelectValue placeholder="Select customer type" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="b2c">Individual consumers (B2C)</SelectItem>
                      <SelectItem value="b2b">Other businesses (B2B)</SelectItem>
                      <SelectItem value="b2g">Government (B2G)</SelectItem>
                      <SelectItem value="all">Mix of all</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Does your business handle money for others?</Label>
                  <p className="text-xs text-zinc-400 mb-2">Payments, lending, savings deposits, insurance, investments — not just receiving payment for your services.</p>
                  <div className="grid grid-cols-2 gap-2">
                    {[{ label: 'Yes, we handle money', value: true }, { label: 'No, standard services', value: false }].map((opt) => (
                      <button
                        key={String(opt.value)}
                        onClick={() => set('handlesMoney', opt.value)}
                        className={`p-3 rounded-lg border text-sm text-left transition-colors ${
                          profile.handlesMoney === opt.value
                            ? 'border-zinc-900 dark:border-zinc-200 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 font-medium'
                            : 'border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:border-zinc-400'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                {profile.handlesMoney && (
                  <div>
                    <Label>What type of financial services? (select all that apply)</Label>
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      {[
                        { label: 'Payments / transfers', value: 'payments' },
                        { label: 'Lending / credit', value: 'lending' },
                        { label: 'Savings / deposits', value: 'savings' },
                        { label: 'Insurance', value: 'insurance' },
                      ].map((opt) => (
                        <button
                          key={opt.value}
                          onClick={() => toggleTransactionType(opt.value)}
                          className={`p-2.5 rounded-lg border text-xs text-left transition-colors ${
                            (profile.transactionType || []).includes(opt.value)
                              ? 'border-zinc-900 dark:border-zinc-200 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 font-medium'
                              : 'border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:border-zinc-400'
                          }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex gap-2 pt-2">
                  <Button variant="outline" onClick={() => setStep(1)} className="flex-1">Back</Button>
                  <Button
                    onClick={() => setStep(3)}
                    disabled={!profile.customerType || profile.handlesMoney === undefined}
                    className="flex-1"
                  >
                    Next
                  </Button>
                </div>
              </CardContent>
            </>
          )}

          {/* ── Step 3: Compliance triggers ──────────────────────────── */}
          {step === 3 && (
            <>
              <CardHeader>
                <CardTitle>A few more details</CardTitle>
                <p className="text-sm text-zinc-500 mt-1">These determine which compliance requirements apply to you.</p>
              </CardHeader>
              <CardContent className="space-y-5">
                <div>
                  <Label>Will you have foreign shareholders or directors?</Label>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    {[{ label: 'Yes', value: true }, { label: 'No — fully Rwandan', value: false }].map((opt) => (
                      <button
                        key={String(opt.value)}
                        onClick={() => set('foreignOwnership', opt.value)}
                        className={`p-3 rounded-lg border text-sm transition-colors ${
                          profile.foreignOwnership === opt.value
                            ? 'border-zinc-900 dark:border-zinc-200 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 font-medium'
                            : 'border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:border-zinc-400'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <Label>Will you collect personal data from customers or employees?</Label>
                  <p className="text-xs text-zinc-400 mb-2">Names, IDs, location, health info, financial data — triggers Rwanda Data Protection registration.</p>
                  <div className="grid grid-cols-2 gap-2">
                    {[{ label: 'Yes', value: true }, { label: 'No', value: false }].map((opt) => (
                      <button
                        key={String(opt.value)}
                        onClick={() => set('collectsData', opt.value)}
                        className={`p-3 rounded-lg border text-sm transition-colors ${
                          profile.collectsData === opt.value
                            ? 'border-zinc-900 dark:border-zinc-200 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 font-medium'
                            : 'border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:border-zinc-400'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <Label>How many employees do you expect in year one?</Label>
                  <Select value={profile.employeeRange} onValueChange={(v) => set('employeeRange', v)}>
                    <SelectTrigger><SelectValue placeholder="Select range" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">Just me — solo founder</SelectItem>
                      <SelectItem value="2-10">2 to 10 employees</SelectItem>
                      <SelectItem value="11-50">11 to 50 employees</SelectItem>
                      <SelectItem value="50+">More than 50 employees</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Will you operate outside Kigali?</Label>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    {[{ label: 'Yes — provincial / nationwide', value: true }, { label: 'Kigali only', value: false }].map((opt) => (
                      <button
                        key={String(opt.value)}
                        onClick={() => set('operatesProvince', opt.value)}
                        className={`p-3 rounded-lg border text-sm transition-colors ${
                          profile.operatesProvince === opt.value
                            ? 'border-zinc-900 dark:border-zinc-200 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 font-medium'
                            : 'border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:border-zinc-400'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <Button variant="outline" onClick={() => setStep(2)} className="flex-1">Back</Button>
                  <Button
                    onClick={() => setStep(4)}
                    disabled={
                      profile.foreignOwnership === undefined ||
                      profile.collectsData === undefined ||
                      !profile.employeeRange ||
                      profile.operatesProvince === undefined
                    }
                    className="flex-1"
                  >
                    Next
                  </Button>
                </div>
              </CardContent>
            </>
          )}

          {/* ── Step 4: Biggest question ─────────────────────────────── */}
          {step === 4 && (
            <>
              <CardHeader>
                <CardTitle>What's your most urgent compliance question?</CardTitle>
                <p className="text-sm text-zinc-500 mt-1">Optional. This seeds your first AI conversation.</p>
              </CardHeader>
              <CardContent className="space-y-4">
                <Textarea
                  placeholder="e.g. Do I need a BNR license to offer buy-now-pay-later to consumers?"
                  value={profile.biggestQuestion || ''}
                  onChange={(e) => set('biggestQuestion', e.target.value)}
                  className="min-h-[100px] resize-none"
                />
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setStep(3)} className="flex-1">Back</Button>
                  <Button onClick={() => setStep(5)} className="flex-1">
                    Almost done
                  </Button>
                </div>
              </CardContent>
            </>
          )}

          {/* ── Step 5: Done ─────────────────────────────────────────── */}
          {step === 5 && (
            <>
              <CardHeader>
                <CardTitle>You&apos;re all set</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-center py-4">
                <div className="text-4xl">🎉</div>
                <div className="space-y-1 text-sm text-zinc-600 dark:text-zinc-400">
                  {profile.bizName && <p>Business: <strong className="text-zinc-900 dark:text-zinc-200">{profile.bizName}</strong></p>}
                  <p>Sector: <strong className="text-zinc-900 dark:text-zinc-200">{profile.sector}</strong></p>
                  <p>Structure: <strong className="text-zinc-900 dark:text-zinc-200">{profile.bizType}</strong></p>
                  {profile.handlesMoney && <p className="text-amber-600 dark:text-amber-400">⚠ BNR financial licensing requirements apply</p>}
                  {profile.collectsData && <p className="text-blue-600 dark:text-blue-400">🔒 Data protection registration required</p>}
                  {profile.foreignOwnership && <p className="text-purple-600 dark:text-purple-400">🌍 Foreign ownership disclosure requirements apply</p>}
                </div>
                <Button onClick={finish} disabled={loading} className="w-full mt-4">
                  {loading ? 'Setting up your workspace...' : 'View my compliance roadmap →'}
                </Button>
              </CardContent>
            </>
          )}
        </Card>
      </div>
    </div>
  )
}
