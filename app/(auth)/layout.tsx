import Link from 'next/link'
import { redirect } from 'next/navigation'
import { ShieldCheck } from 'lucide-react'
import { getSession } from '@/lib/auth/server'

export default async function AuthLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession()
  if (session) redirect('/dashboard')

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950 px-4">
      <div className="absolute inset-x-0 top-0 h-[24rem] bg-[radial-gradient(circle_at_top,_rgba(24,24,27,0.08),_transparent_70%)] dark:bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.08),_transparent_60%)] pointer-events-none" />
      <div className="relative w-full max-w-md">
        <div className="text-center mb-6">
          <Link href="/" className="inline-flex items-center gap-2 font-semibold text-lg tracking-tight">
            <span className="h-7 w-7 rounded-md bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 flex items-center justify-center">
              <ShieldCheck className="h-4 w-4" />
            </span>
            BZ Intelligence
          </Link>
        </div>
        {children}
      </div>
    </div>
  )
}
