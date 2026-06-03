import { NavLink, useLocation } from 'react-router-dom'
import {
  LayoutDashboard,
  Users,
  PawPrint,
  CalendarDays,
  CalendarRange,
  Syringe,
  Settings,
  ChevronRight,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const nav = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/clients', label: 'Clients', icon: Users },
  { to: '/pets', label: 'Pets', icon: PawPrint },
  { to: '/bookings', label: 'Bookings', icon: CalendarDays },
  { to: '/schedule', label: 'Schedule', icon: CalendarRange },
  { to: '/vaccines', label: 'Vaccines', icon: Syringe },
]

export default function Sidebar({ onNavigate }) {
  return (
    <aside className="w-60 flex-shrink-0 flex flex-col bg-navy h-full">
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-6 py-5 border-b border-white/10">
        <div className="w-8 h-8 rounded-lg bg-teal flex items-center justify-center flex-shrink-0">
          <PawPrint className="w-4 h-4 text-navy" strokeWidth={2.5} />
        </div>
        <span className="text-white font-bold text-lg tracking-tight">Snoutsheet</span>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {nav.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            onClick={onNavigate}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 group',
                isActive
                  ? 'bg-white/15 text-white'
                  : 'text-white/60 hover:bg-white/8 hover:text-white'
              )
            }
          >
            {({ isActive }) => (
              <>
                <Icon
                  className={cn('w-4.5 h-4.5 flex-shrink-0', isActive ? 'text-teal' : 'text-white/50 group-hover:text-white/80')}
                  strokeWidth={isActive ? 2.5 : 2}
                />
                <span className="flex-1">{label}</span>
                {isActive && <ChevronRight className="w-3.5 h-3.5 text-teal/70" />}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Settings at bottom */}
      <div className="px-3 py-4 border-t border-white/10">
        <NavLink
          to="/settings"
          onClick={onNavigate}
          className={({ isActive }) =>
            cn(
              'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 group',
              isActive
                ? 'bg-white/15 text-white'
                : 'text-white/60 hover:bg-white/8 hover:text-white'
            )
          }
        >
          {({ isActive }) => (
            <>
              <Settings
                className={cn('w-4.5 h-4.5 flex-shrink-0', isActive ? 'text-teal' : 'text-white/50 group-hover:text-white/80')}
                strokeWidth={isActive ? 2.5 : 2}
              />
              <span className="flex-1">Settings</span>
            </>
          )}
        </NavLink>
      </div>
    </aside>
  )
}
