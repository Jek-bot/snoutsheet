import { useEffect, useState } from 'react'
import { ShieldCheck, Users, PawPrint, CalendarDays, Syringe, Briefcase } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/context/AuthContext'
import { formatDate } from '@/lib/utils'

function StatBadge({ icon: Icon, value, label }) {
  return (
    <div className="flex flex-col items-center gap-0.5 min-w-[48px]">
      <Icon className="w-3.5 h-3.5 text-navy-300 mb-0.5" />
      <p className="text-sm font-bold text-navy">{value}</p>
      <p className="text-[10px] text-navy-300 uppercase tracking-wide">{label}</p>
    </div>
  )
}

export default function Admin() {
  const { user } = useAuth()
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    supabase
      .rpc('get_admin_user_stats')
      .then(({ data, error }) => {
        if (error) setError(error.message)
        else setUsers((data ?? []).sort((a, b) => new Date(a.created_at) - new Date(b.created_at)))
        setLoading(false)
      })
  }, [])

  async function toggleApproved(u) {
    await supabase
      .from('user_profiles')
      .update({ approved: !u.approved })
      .eq('id', u.id)
    setUsers(prev => prev.map(x => x.id === u.id ? { ...x, approved: !x.approved } : x))
  }

  const totals = users.reduce((acc, u) => ({
    clients:  acc.clients  + Number(u.client_count),
    pets:     acc.pets     + Number(u.pet_count),
    bookings: acc.bookings + Number(u.booking_count),
    vaccines: acc.vaccines + Number(u.vaccine_count),
    services: acc.services + Number(u.service_count),
  }), { clients: 0, pets: 0, bookings: 0, vaccines: 0, services: 0 })

  return (
    <div className="max-w-5xl mx-auto">
      <div className="page-header">
        <div>
          <h1 className="page-title flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-teal" /> Admin
          </h1>
          <p className="text-sm text-navy-300 mt-0.5">{users.length} user{users.length !== 1 ? 's' : ''}</p>
        </div>
      </div>

      {/* Summary totals */}
      <div className="grid grid-cols-5 gap-3 mb-6">
        {[
          { icon: Users,       value: totals.clients,  label: 'Clients' },
          { icon: PawPrint,    value: totals.pets,     label: 'Pets' },
          { icon: CalendarDays,value: totals.bookings, label: 'Bookings' },
          { icon: Syringe,     value: totals.vaccines, label: 'Vaccines' },
          { icon: Briefcase,   value: totals.services, label: 'Services' },
        ].map(({ icon, value, label }) => (
          <div key={label} className="card p-4 flex flex-col items-center gap-1">
            {(() => { const Icon = icon; return <Icon className="w-5 h-5 text-teal mb-1" /> })()}
            <p className="text-2xl font-bold text-navy">{value}</p>
            <p className="text-xs text-navy-300">{label}</p>
          </div>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => <div key={i} className="h-20 bg-white rounded-2xl animate-pulse" />)}
        </div>
      ) : error ? (
        <div className="card p-8 text-center">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-surface-border">
                <th className="text-left px-5 py-3 text-xs font-bold text-navy-300 uppercase tracking-widest">User</th>
                <th className="text-center px-3 py-3 text-xs font-bold text-navy-300 uppercase tracking-widest">Clients</th>
                <th className="text-center px-3 py-3 text-xs font-bold text-navy-300 uppercase tracking-widest">Pets</th>
                <th className="text-center px-3 py-3 text-xs font-bold text-navy-300 uppercase tracking-widest">Bookings</th>
                <th className="text-center px-3 py-3 text-xs font-bold text-navy-300 uppercase tracking-widest">Vaccines</th>
                <th className="text-center px-3 py-3 text-xs font-bold text-navy-300 uppercase tracking-widest">Services</th>
                <th className="text-center px-3 py-3 text-xs font-bold text-navy-300 uppercase tracking-widest">Status</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id} className="border-b border-surface-border last:border-0 hover:bg-surface/50 transition-colors">
                  <td className="px-5 py-4">
                    <p className="font-semibold text-navy truncate max-w-[200px]">{u.email}</p>
                    <p className="text-xs text-navy-300 mt-0.5">Joined {formatDate(u.created_at)}</p>
                    {u.is_admin && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-teal uppercase tracking-wide mt-0.5">
                        <ShieldCheck className="w-3 h-3" /> Admin
                      </span>
                    )}
                  </td>
                  <td className="text-center px-3 py-4 font-semibold text-navy">{u.client_count}</td>
                  <td className="text-center px-3 py-4 font-semibold text-navy">{u.pet_count}</td>
                  <td className="text-center px-3 py-4 font-semibold text-navy">{u.booking_count}</td>
                  <td className="text-center px-3 py-4 font-semibold text-navy">{u.vaccine_count}</td>
                  <td className="text-center px-3 py-4 font-semibold text-navy">{u.service_count}</td>
                  <td className="text-center px-3 py-4">
                    <span className={`badge ${u.approved ? 'badge-teal' : 'badge-yellow'}`}>
                      {u.approved ? 'Approved' : 'Pending'}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    {u.id !== user?.id && (
                      <button
                        onClick={() => toggleApproved(u)}
                        className={`text-xs font-semibold px-3 py-1.5 rounded-lg border transition-colors ${
                          u.approved
                            ? 'border-red-200 text-red-600 hover:bg-red-50'
                            : 'border-teal/30 text-teal hover:bg-teal/5'
                        }`}
                      >
                        {u.approved ? 'Revoke' : 'Approve'}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
