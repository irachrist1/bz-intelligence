'use client'

import { useState, useRef } from 'react'
import { Menu } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet'
import { SidebarContent } from './sidebar'

export function MobileHeader() {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()
  // Snapshot the mode when the sheet opens so nav items don't flash during close animation
  const frozenIsCompliance = useRef(pathname.startsWith('/dashboard/compliance'))

  function handleOpenChange(val: boolean) {
    if (val) {
      frozenIsCompliance.current = pathname.startsWith('/dashboard/compliance')
    }
    setOpen(val)
  }

  return (
    <header className="md:hidden flex items-center gap-3 px-4 h-14 border-b border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-950 shrink-0 sticky top-0 z-40">
      <button
        onClick={() => handleOpenChange(true)}
        className="p-1.5 -ml-1.5 rounded-md text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
        aria-label="Open navigation"
      >
        <Menu className="h-5 w-5" />
      </button>

      <Link
        href="/dashboard"
        className="font-semibold text-sm tracking-tight text-zinc-900 dark:text-zinc-100"
      >
        BZ Intelligence
      </Link>

      <Sheet open={open} onOpenChange={handleOpenChange}>
        <SheetContent side="left" className="p-0 w-72" showCloseButton={false}>
          <SheetTitle className="sr-only">Navigation</SheetTitle>
          <SidebarContent onClose={() => setOpen(false)} frozenIsCompliance={frozenIsCompliance.current} />
        </SheetContent>
      </Sheet>
    </header>
  )
}
