'use client'

import { useState } from 'react'
import { PanelLeftClose, PanelLeftOpen } from 'lucide-react'
import { SidebarContent } from '@/components/sidebar'
import { MobileHeader } from '@/components/mobile-header'
import { cn } from '@/lib/utils'

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)

  return (
    <div className="h-screen bg-zinc-50 dark:bg-zinc-950">
      {/* Mobile shell */}
      <div className="md:hidden flex h-full flex-col">
        <MobileHeader />
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>

      {/* Desktop shell with sidebar toggle */}
      <div
        className="hidden md:grid h-full transition-[grid-template-columns] duration-300 ease-out"
        style={{ gridTemplateColumns: isSidebarCollapsed ? '4.5rem minmax(0,1fr)' : '15rem minmax(0,1fr)' }}
      >
        <aside className="overflow-hidden border-r border-zinc-100 dark:border-zinc-800">
          <div className={cn(
            'h-full transition-[width] duration-300 ease-out',
            isSidebarCollapsed ? 'w-[4.5rem]' : 'w-60',
          )}>
            <SidebarContent collapsed={isSidebarCollapsed} />
          </div>
        </aside>

        <div className="flex min-w-0 min-h-0 flex-col">
          <header className="h-14 border-b border-zinc-100 dark:border-zinc-800 bg-white/85 dark:bg-zinc-950/85 backdrop-blur px-4 flex items-center shrink-0">
            <button
              onClick={() => setIsSidebarCollapsed((v) => !v)}
              aria-label={isSidebarCollapsed ? 'Expand navigation' : 'Collapse navigation'}
              className="inline-flex items-center gap-2 rounded-md border border-zinc-200 dark:border-zinc-700 px-2.5 py-1.5 text-sm text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-zinc-100 hover:border-zinc-400 dark:hover:border-zinc-500 hover:bg-white dark:hover:bg-zinc-900 transition-colors"
            >
              {isSidebarCollapsed ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
              {isSidebarCollapsed ? 'Show labels' : 'Icons only'}
            </button>
          </header>

          <main className="flex-1 overflow-y-auto transition-[padding] duration-300 ease-out">
            {children}
          </main>
        </div>
      </div>
    </div>
  )
}
