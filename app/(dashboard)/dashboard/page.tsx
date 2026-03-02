import { redirect } from 'next/navigation'

// Default dashboard redirects to the tender feed
export default function DashboardPage() {
  redirect('/dashboard/tenders')
}
