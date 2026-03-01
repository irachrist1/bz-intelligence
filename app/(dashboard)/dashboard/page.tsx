import { redirect } from 'next/navigation'

// Default dashboard redirects to compliance mode (Phase 1 priority)
export default function DashboardPage() {
  redirect('/dashboard/compliance')
}
