import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Users, PawPrint, CalendarDays, Syringe, ArrowRight, TrendingUp } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/context/AuthContext'
import { formatDate, formatCurrency, daysUntil } from '@/lib/utils'
import { cn } from '@/lib/utils'

function StatCard({ icon: Icon, label, value, color, to }) {
  const card = (
    <div className="stat-card hover:shadow-card-hover transition-shadow cursor-pointer">
      <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center mb-2', color)}>
        <Icon className="w-4.5 h-4.5" strokeWidth={2.5} />
      </div>
      <p className="stat-label">{label}</p>
      <p className="stat-value">{value ?? '—'}</p>
    </div>
  )
  return to ? <Link to={to}>{card}</Link> : card
}

function BookingRow({ booking }) {
  const statusColors = {
    inquiry: 'badge-yellow',
    confirmed: 'badge-teal',
    active: 'badge-green',
    completed: 'badge-gray',
    cancelled: 'badge-red',
  }
  return (
    <div className="flex items-center justify-between py-3 border-b border-surface-border last:border-0">
      <div>
        <p className="text-sm font-semibold text-navy">
          {booking.clients?.first_name} {booking.clients?.last_name}
        </p>
        <p className="text-xs text-navy-300 mt-0.5">
          {formatDate(booking.start_date)} · {booking.services?.name ?? 'Service'}
        </p>
      </div>
      <div className="flex items-center gap-3">
        <span className={cn('badge', statusColors[booking.status] ?? 'badge-gray')}>
          {booking.status}
        </span>
        <span className="text-sm font-semibold text-navy">
          {formatCurrency(booking.price)}
        </span>
      </div>
    </div>
  )
}

function VaccineAlert({ vaccine }) {
  const days = daysUntil(vaccine.expiry_date)
  const urgent = days != null && days <= 7
  return (
    <div className={cn(
      'flex items-center justify-between py-3 border-b border-surface-border last:border-0'
    )}>
      <div>
        <p className="text-sm font-semibold text-navy">
          {vaccine.pets?.name} · {vaccine.vaccine_name}
        </p>
        <p className="text-xs text-navy-300 mt-0.5">
          {vaccine.pets?.clients?.first_name} {vaccine.pets?.clients?.last_name}
        </p>
      </div>
      <span className={cn('badge', urgent ? 'badge-red' : 'badge-yellow')}>
        {days != null ? (days <= 0 ? 'Expired' : `${days}d`) : formatDate(vaccine.expiry_date)}
      </span>
    </div>
  )
}

export default function Dashboard() {
  const { user } = useAuth()
  const [stats, setStats] = useState({ clients: 0, pets: 0, upcoming: 0, expiring: 0 })
  const [upcomingBookings, setUpcomingBookings] = useState([])
  const [expiringVaccines, setExpiringVaccines] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    async function load() {
      const now = new Date().toISOString()
      const in30 = new Date(Date.now() + 30 * 864e5).toISOString()

      const [
        { count: clients },
        { count: pets },
        { count: upcoming },
        { count: expiring },
        { data: bookings },
        { data: vaccines },
      ] = await Promise.all([
        supabase.from('clients').select('*', { count: 'exact', head: true }).eq('user_id', user.id),
        supabase.from('pets').select('*', { count: 'exact', head: true }).eq('user_id', user.id),
        supabase.from('bookings').select('*', { count: 'exact', head: true })
          .eq('user_id', user.id).in('status', ['confirmed', 'active']).gte('start_date', now),
        supabase.from('vaccines').select('*', { count: 'exact', head: true })
          .eq('user_id', user.id).lte('expiry_date', in30).gte('expiry_date', now),
        supabase.from('bookings').select('*, clients(first_name,last_name), services(name)')
          .eq('user_id', user.id).in('status', ['confirmed', 'active'])
          .gte('start_date', now).order('start_date').limit(5),
        supabase.from('vaccines').select('*, pets(name, clients(first_name,last_name))')
          .eq('user_id', user.id).lte('expiry_date', in30).order('expiry_date').limit(5),
      ])

      setStats({ clients: clients ?? 0, pets: pets ?? 0, upcoming: upcoming ?? 0, expiring: expiring ?? 0 })
      setUpcomingBookings(bookings ?? [])
      setExpiringVaccines(vaccines ?? [])
      setLoading(false)
    }
    load()
  }, [user])

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Users} label="Total Clients" value={stats.clients} color="bg-navy-50 text-navy" to="/clients" />
        <StatCard icon={PawPrint} label="Total Pets" value={stats.pets} color="bg-teal-50 text-teal-600" to="/pets" />
        <StatCard icon={CalendarDays} label="Upcoming Bookings" value={stats.upcoming} color="bg-blue-50 text-blue-600" to="/bookings" />
        <StatCard icon={Syringe} label="Vaccines Expiring" value={stats.expiring} color="bg-yellow-50 text-yellow-600" to="/vaccines" />
      </div>

      {/* Two-col content */}
      <div className="grid lg:grid-cols-2 gap-4">
        {/* Upcoming bookings */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="section-title mb-0">Upcoming Bookings</h2>
            <Link to="/bookings" className="text-xs text-teal-500 font-semibold hover:text-teal flex items-center gap-1">
              View all <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          {loading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-12 bg-surface rounded-lg animate-pulse" />
              ))}
            </div>
          ) : upcomingBookings.length === 0 ? (
            <p className="text-sm text-navy-300 py-4 text-center">No upcoming bookings</p>
          ) : (
            upcomingBookings.map(b => <BookingRow key={b.id} booking={b} />)
          )}
        </div>

        {/* Vaccine alerts */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="section-title mb-0">Vaccines Expiring Soon</h2>
            <Link to="/vaccines" className="text-xs text-teal-500 font-semibold hover:text-teal flex items-center gap-1">
              View all <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          {loading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-12 bg-surface rounded-lg animate-pulse" />
              ))}
            </div>
          ) : expiringVaccines.length === 0 ? (
            <p className="text-sm text-navy-300 py-4 text-center">No vaccines expiring in the next 30 days 🎉</p>
          ) : (
            expiringVaccines.map(v => <VaccineAlert key={v.id} vaccine={v} />)
          )}
        </div>
      </div>

      {/* Quick actions */}
      <div className="card p-5">
        <h2 className="section-title">Quick Actions</h2>
        <div className="flex flex-wrap gap-3">
          <Link to="/clients" className="btn-outline">
            <Users className="w-4 h-4" /> Add Client
          </Link>
          <Link to="/bookings" className="btn-teal">
            <CalendarDays className="w-4 h-4" /> New Booking
          </Link>
          <Link to="/vaccines" className="btn-outline">
            <Syringe className="w-4 h-4" /> Log Vaccine
          </Link>
          <Link to="/schedule" className="btn-outline">
            <TrendingUp className="w-4 h-4" /> View Schedule
          </Link>
        </div>
      </div>
    </div>
  )
}
