'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useTheme } from 'next-themes'
import { signOut } from '@/lib/auth/client'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  ShieldCheck,
  FolderLock,
  Building2,
  MessageSquare,
  Newspaper,
  LogOut,
  ChevronRight,
  Sun,
  Moon,
} from 'lucide-react'

const complianceNav = [
  { href: '/dashboard/compliance', label: 'Roadmap', icon: LayoutDashboard },
  { href: '/dashboard/compliance/chat', label: 'Compliance Advisor', icon: ShieldCheck },
  { href: '/dashboard/compliance/documents', label: 'Document Vault', icon: FolderLock },
  { href: '/dashboard/compliance/newsfeed', label: 'Newsfeed', icon: Newspaper },
]

const intelligenceNav = [
  { href: '/dashboard/intelligence', label: 'Companies', icon: Building2 },
  { href: '/dashboard/intelligence/chat', label: 'Market Analyst', icon: MessageSquare },
]

// Shared nav content — used by both desktop Sidebar and the mobile Sheet drawer
export function SidebarContent({ onClose, frozenIsCompliance }: { onClose?: () => void; frozenIsCompliance?: boolean }) {
  const pathname = usePathname()
  const { resolvedTheme, setTheme } = useTheme()
  const isCompliance = frozenIsCompliance ?? pathname.startsWith('/dashboard/compliance')

  return (
    <div className="flex flex-col h-full bg-white dark:bg-zinc-950">
      {/* Logo */}
      <div className="px-4 py-5 border-b border-zinc-100 dark:border-zinc-800">
        <Link
          href="/dashboard"
          onClick={onClose}
          className="font-semibold text-base tracking-tight text-zinc-900 dark:text-zinc-100"
        >
          BZ Intelligence
        </Link>
      </div>

      {/* Mode switcher */}
      <div className="px-3 py-3 border-b border-zinc-100 dark:border-zinc-800">
        <div className="flex rounded-lg bg-zinc-100 dark:bg-zinc-800/80 p-1 text-xs font-medium">
          <Link
            href="/dashboard/compliance"
            onClick={onClose}
            className={cn(
              'flex-1 text-center py-1.5 rounded-md transition-colors',
              isCompliance
                ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 shadow-sm'
                : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200',
            )}
          >
            Compliance
          </Link>
          <Link
            href="/dashboard/intelligence"
            onClick={onClose}
            className={cn(
              'flex-1 text-center py-1.5 rounded-md transition-colors',
              !isCompliance
                ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 shadow-sm'
                : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200',
            )}
          >
            Intelligence
          </Link>
        </div>
      </div>

      {/* Nav links */}
      <nav className="flex-1 px-3 py-3 space-y-0.5">
        {(isCompliance ? complianceNav : intelligenceNav).map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            onClick={onClose}
            className={cn(
              'flex items-center gap-2.5 px-2.5 py-2 rounded-md text-sm transition-colors',
              pathname === href
                ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 font-medium'
                : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-800/50',
            )}
          >
            <Icon className="h-4 w-4 shrink-0" />
            {label}
            {pathname === href && (
              <ChevronRight className="ml-auto h-3 w-3 text-zinc-400 dark:text-zinc-500" />
            )}
          </Link>
        ))}
      </nav>

      {/* Footer */}
      <div className="px-3 py-3 border-t border-zinc-100 dark:border-zinc-800 space-y-0.5">
        <button
          onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
          className="flex items-center gap-2.5 px-2.5 py-2 rounded-md text-sm text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 w-full transition-colors"
        >
          {resolvedTheme === 'dark' ? <Sun className="h-4 w-4 shrink-0" /> : <Moon className="h-4 w-4 shrink-0" />}
          {resolvedTheme === 'dark' ? 'Light mode' : 'Dark mode'}
        </button>
        <button
          onClick={() => signOut().then(() => { window.location.href = '/' })}
          className="flex items-center gap-2.5 px-2.5 py-2 rounded-md text-sm text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 w-full transition-colors"
        >
          <LogOut className="h-4 w-4 shrink-0" />
          Sign out
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
