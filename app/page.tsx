import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-4 border-b border-zinc-100 max-w-7xl mx-auto">
        <span className="font-semibold text-lg tracking-tight">BZ Intelligence</span>
        <div className="flex items-center gap-3">
          <Link href="/sign-in">
            <Button variant="ghost" size="sm">Sign in</Button>
          </Link>
          <Link href="/sign-up">
            <Button size="sm">Get started</Button>
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <main className="max-w-5xl mx-auto px-6 pt-24 pb-32 text-center">
        <Badge variant="secondary" className="mb-6">
          Rwanda Business Intelligence
        </Badge>
        <h1 className="text-5xl font-bold tracking-tight text-zinc-900 leading-tight mb-6">
          The operating system for doing
          <br />
          business in Rwanda.
        </h1>
        <p className="text-xl text-zinc-500 max-w-2xl mx-auto mb-10">
          Verified company intelligence, AI-powered compliance guidance, and
          regulatory updates — all grounded in real Rwanda data.
        </p>
        <div className="flex items-center justify-center gap-4">
          <Link href="/sign-up">
            <Button size="lg" className="px-8">
              Start for free
            </Button>
          </Link>
          <Link href="/dashboard/compliance">
            <Button size="lg" variant="outline" className="px-8">
              See how it works
            </Button>
          </Link>
        </div>

        {/* Mode cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-20 text-left">
          <div className="border border-zinc-200 rounded-xl p-6">
            <div className="text-2xl mb-3">🔍</div>
            <h2 className="text-lg font-semibold text-zinc-900 mb-2">Intelligence Mode</h2>
            <p className="text-zinc-500 text-sm">
              Company directory, sector dashboards, and an AI market analyst
              for investors and researchers who need verified Rwanda market data.
            </p>
          </div>
          <div className="border border-zinc-200 rounded-xl p-6">
            <div className="text-2xl mb-3">✅</div>
            <h2 className="text-lg font-semibold text-zinc-900 mb-2">Compliance Mode</h2>
            <p className="text-zinc-500 text-sm">
              Personalized regulatory roadmap, AI compliance chat, and a
              document vault for founders navigating Rwanda&apos;s business registration.
            </p>
          </div>
        </div>
      </main>
    </div>
  )
}
