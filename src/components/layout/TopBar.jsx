import { useLocation } from 'react-router-dom'
import { LifeBuoy, LogOut, Menu } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { useSupport } from '@/context/SupportContext'
import { initials } from '@/lib/utils'

const PAGE_TITLES = {
  '/': 'Dashboard',
  '/clients': 'Clients',
  '/pets': 'Pets',
  '/bookings': 'Bookings',
  '/schedule': 'Schedule',
  '/vaccines': 'Vaccines',
  '/settings': 'Settings',
}

export default function TopBar({ onMenuClick }) {
  const { pathname } = useLocation()
  const { user, signOut } = useAuth()
  const { openReport } = useSupport()

  const title = PAGE_TITLES[pathname] ?? 'Snoutsheet'
  const email = user?.email ?? ''
  const name = user?.user_metadata?.full_name ?? email.split('@')[0] ?? 'You'

  return (
    <header className="h-14 flex-shrink-0 flex items-center justify-between px-4 bg-white border-b border-surface-border">
      <div className="flex items-center gap-3">
        {/* Hamburger — mobile only */}
        <button
          onClick={onMenuClick}
          className="btn-ghost p-2 rounded-lg lg:hidden"
          aria-label="Open menu"
        >
          <Menu className="w-5 h-5" />
        </button>
        <h1 className="text-base font-semibold text-navy">{title}</h1>
      </div>

      <div className="flex items-center gap-1">
        <button
          onClick={openReport}
          className="btn-ghost p-2 rounded-lg relative"
          aria-label="Report a problem"
          title="Report a problem"
        >
          <LifeBuoy className="w-4.5 h-4.5" />
        </button>

        <div className="flex items-center gap-2 ml-1">
          <div className="w-8 h-8 rounded-full bg-navy flex items-center justify-center text-white text-xs font-bold select-none flex-shrink-0">
            {initials(name.split(' ')[0], name.split(' ')[1])}
          </div>
          <span className="text-sm font-medium text-navy hidden sm:block max-w-[120px] truncate">
            {name}
          </span>
        </div>

        <button
          onClick={signOut}
          className="btn-ghost p-2 rounded-lg ml-1"
          aria-label="Sign out"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </header>
  )
}
