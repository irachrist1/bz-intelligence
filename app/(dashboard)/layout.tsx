import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth/server'
import { Sidebar } from '@/components/sidebar'
import { MobileHeader } from '@/components/mobile-header'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession()
  if (!session) redirect('/sign-in')

  return (
    <div className="flex h-screen bg-zinc-50 dark:bg-zinc-950">
      {/* Desktop sidebar — hidden on mobile */}
      <Sidebar />

      {/* Main column — full-width on mobile, flex-1 on desktop */}
      <div className="flex flex-col flex-1 min-w-0 min-h-0">
        {/* Mobile top bar with hamburger + sheet drawer */}
        <MobileHeader />

        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
