'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { signOut } from '@/lib/auth/client'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import {
  Bell,
  Bookmark,
  BriefcaseBusiness,
  Building2,
  ChartColumnIncreasing,
  KanbanSquare,
  Newspaper,
  LogOut,
  ChevronRight,
  Settings2,
} from 'lucide-react'

const tenderNav = [
  { href: '/dashboard/intelligence', label: 'Intelligence', icon: ChartColumnIncreasing },
  { href: '/ecosystem', label: 'Tech Ecosystem', icon: Building2 },
  { href: '/dashboard/tenders', label: 'Feed', icon: Newspaper },
  { href: '/dashboard/pipeline', label: 'Pipeline', icon: KanbanSquare },
  { href: '/dashboard/saved', label: 'Saved', icon: Bookmark },
  { href: '/dashboard/alerts', label: 'Alerts', icon: Bell },
  { href: '/dashboard/profile', label: 'Profile', icon: BriefcaseBusiness },
  { href: '/dashboard/admin', label: 'Admin', icon: Settings2 },
]

type SidebarContentProps = {
  onClose?: () => void
  collapsed?: boolean
}

// Shared nav content — used by both desktop Sidebar and the mobile Sheet drawer
export function SidebarContent({ onClose, collapsed = false }: SidebarContentProps) {
  const pathname = usePathname()
  const router = useRouter()

  async function handleSignOut() {
    try {
      const result = await signOut()
      if (result?.error) throw new Error(result.error.message || 'Sign out failed')
    } catch {
      // Fallback to same-origin endpoint in case client baseURL/env is mismatched.
      try {
        await fetch('/api/auth/sign-out', {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: '{}',
        })
      } catch {
        toast.error('Sign out failed. Please refresh and try again.')
        return
      }
    }

    router.replace('/')
    router.refresh()
  }

  return (
    <div className="flex flex-col h-full bg-white dark:bg-zinc-950">
      {/* Logo */}
      <div className={cn(
        'border-b border-zinc-100 dark:border-zinc-800',
        collapsed ? 'px-2 py-4 flex justify-center' : 'px-4 py-5',
      )}>
        <Link
          href="/dashboard/tenders"
          onClick={onClose}
          className={cn(
            'font-semibold tracking-tight text-zinc-900 dark:text-zinc-100',
            collapsed ? 'inline-flex items-center justify-center h-9 w-9 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-xs' : 'text-base',
          )}
          title={collapsed ? 'BZ Intelligence' : undefined}
        >
          {collapsed ? 'BZ' : 'BZ Intelligence'}
        </Link>
      </div>

      {/* Nav links */}
      <nav className="flex-1 px-3 py-3 space-y-0.5">
        {tenderNav.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href || pathname.startsWith(`${href}/`)

          return (
            <Link
              key={href}
              href={href}
              onClick={onClose}
              title={collapsed ? label : undefined}
              className={cn(
                collapsed
                  ? 'mx-auto h-9 w-9 flex items-center justify-center rounded-md transition-colors'
                  : 'flex items-center gap-2.5 px-2.5 py-2 rounded-md text-sm transition-colors',
                isActive
                  ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 font-medium'
                  : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-800/50',
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {!collapsed && label}
              {!collapsed && isActive && (
                <ChevronRight className="ml-auto h-3 w-3 text-zinc-400 dark:text-zinc-500" />
              )}
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="px-3 py-3 border-t border-zinc-100 dark:border-zinc-800 space-y-0.5">
        <button
          onClick={handleSignOut}
          title={collapsed ? 'Sign out' : undefined}
          className={cn(
            collapsed
              ? 'mx-auto h-9 w-9 flex items-center justify-center rounded-md text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors'
              : 'flex items-center gap-2.5 px-2.5 py-2 rounded-md text-sm text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 w-full transition-colors',
          )}
        >
          <LogOut className="h-4 w-4 shrink-0" />
          {!collapsed && 'Sign out'}
        </button>
      </div>
    </div>
  )
}

// Desktop-only sidebar — hidden on mobile (md: breakpoint)
export function Sidebar() {
  return (
    <aside className="hidden md:flex flex-col w-60 border-r border-zinc-100 dark:border-zinc-800 h-screen sticky top-0 shrink-0">
      <SidebarContent />
    </aside>
  )
}
