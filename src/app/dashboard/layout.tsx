import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import LogoutButton from '@/components/LogoutButton'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  return (
    <div className="min-h-screen flex flex-col">
      <nav className="border-b border-gray-800 px-6 py-4 flex items-center justify-between">
        <Link href="/dashboard" className="flex items-center gap-2 font-bold text-lg text-white">
          <span>🏃</span> FitLog
        </Link>
        <div className="flex items-center gap-4">
          <Link
            href="/dashboard/upload"
            className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium rounded-lg transition-colors"
          >
            + Log Workout
          </Link>
          <span className="text-gray-500 text-sm hidden sm:block">{user.email}</span>
          <LogoutButton />
        </div>
      </nav>
      <main className="flex-1 px-6 py-8 max-w-5xl mx-auto w-full">
        {children}
      </main>
    </div>
  )
}
