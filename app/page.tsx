import Link from 'next/link'
import { redirect } from 'next/navigation'
import { ArrowRight, Database, Newspaper, ShieldCheck, Sparkles } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { getSession } from '@/lib/auth/server'

const pillars = [
  {
    title: 'Intelligence Mode',
    description: 'Search Rwanda companies, compare sectors, and explore the market with a grounded AI analyst.',
    icon: Database,
  },
  {
    title: 'Compliance Mode',
    description: 'Get a personalized compliance roadmap with clear next steps and source-backed guidance.',
    icon: ShieldCheck,
  },
  {
    title: 'Regulatory Newsfeed',
    description: 'Track high-impact updates from Rwanda regulators and focus on what actually affects your business.',
    icon: Newspaper,
  },
]

const trustSignals = [
  'Grounded in Rwanda-specific sources',
  'Personalized by business profile',
  'Built for founders, investors, and operators',
]

export default async function HomePage() {
  const session = await getSession()
  if (session) redirect('/dashboard')

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100">
      <div className="absolute inset-x-0 top-0 h-[34rem] bg-[radial-gradient(circle_at_top,_rgba(24,24,27,0.08),_transparent_65%)] dark:bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.08),_transparent_60%)] pointer-events-none" />

      <nav className="relative max-w-6xl mx-auto px-6 py-5 flex items-center justify-between">
        <span className="font-semibold tracking-tight text-lg">BZ Intelligence</span>
        <div className="flex items-center gap-2">
          <Link href="/sign-in">
            <Button variant="ghost" size="sm">Sign in</Button>
          </Link>
          <Link href="/sign-up">
            <Button size="sm">Get started</Button>
          </Link>
        </div>
      </nav>

      <main className="relative max-w-6xl mx-auto px-6 pb-20">
        <section className="pt-14 md:pt-20 text-center">
          
          <h1 className="text-4xl md:text-6xl font-semibold tracking-tight leading-tight max-w-4xl mx-auto">
            Move from scattered regulation to decisive execution.
          </h1>
          <p className="mt-5 text-base md:text-lg text-zinc-600 dark:text-zinc-400 max-w-2xl mx-auto leading-relaxed">
            BZ Intelligence combines verified market data, compliance workflows, and AI guidance into one platform built for Rwanda.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link href="/sign-up">
              <Button size="lg" className="px-8">
                Create account
                <ArrowRight className="h-4 w-4 ml-1.5" />
              </Button>
            </Link>
            <Link href="/sign-in">
              <Button size="lg" variant="outline" className="px-8">
                Sign in
              </Button>
            </Link>
          </div>
        </section>

        <section className="mt-14 md:mt-18 grid grid-cols-1 md:grid-cols-3 gap-4">
          {pillars.map(({ title, description, icon: Icon }) => (
            <article
              key={title}
              className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white/85 dark:bg-zinc-900/85 backdrop-blur p-5"
            >
              <div className="h-10 w-10 rounded-xl bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 flex items-center justify-center mb-4">
                <Icon className="h-4 w-4" />
              </div>
              <h2 className="font-medium text-base mb-2">{title}</h2>
              <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">{description}</p>
            </article>
          ))}
        </section>

        <section className="mt-12 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 md:p-7">
          <div className="flex items-center gap-2 text-zinc-800 dark:text-zinc-200 mb-3">
            <Sparkles className="h-4 w-4" />
            <p className="text-sm font-medium">Built for high-confidence decisions</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {trustSignals.map((item) => (
              <div key={item} className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 px-4 py-3 text-sm text-zinc-600 dark:text-zinc-400">
                {item}
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  )
}
