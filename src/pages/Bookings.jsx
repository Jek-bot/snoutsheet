import { useEffect, useState } from 'react'
import { CalendarDays, Plus, Search, Pencil, Trash2, X } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/context/AuthContext'
import { formatDate, formatCurrency } from '@/lib/utils'
import { cn } from '@/lib/utils'
import BookingModal from '@/components/bookings/BookingModal'

const STATUS_COLORS = {
  inquiry: 'badge-yellow',
  confirmed: 'badge-teal',
  active: 'badge-green',
  completed: 'badge-gray',
  cancelled: 'badge-red',
}

const STATUSES = ['all', 'inquiry', 'confirmed', 'active', 'completed', 'cancelled']

function BookingCard({ booking, onEdit, onSelect }) {
  return (
    <div className="card p-4 flex items-center gap-4 hover:shadow-card-hover transition-shadow">
      <button onClick={() => onSelect(booking)} className="flex-1 min-w-0 text-left">
        <div className="flex items-center gap-2 mb-0.5 flex-wrap">
          <p className="font-semibold text-navy text-sm">
            {booking.clients?.first_name} {booking.clients?.last_name}
          </p>
          <span className={cn('badge', STATUS_COLORS[booking.status] ?? 'badge-gray')}>
            {booking.status}
          </span>
          {booking._pets?.length > 0 && (
            <span className="text-xs text-navy-300">
              · {booking._pets.map(p => p.pets?.name).filter(Boolean).join(', ')}
            </span>
          )}
        </div>
        <p className="text-xs text-navy-300">
          {booking.services?.name ?? 'No service'} · {formatDate(booking.start_date)} – {formatDate(booking.end_date)}
        </p>
      </button>
      <div className="text-right flex-shrink-0 mr-2">
        <p className="font-bold text-navy text-sm">{formatCurrency(booking.price)}</p>
        <p className={cn('text-xs mt-0.5', booking.paid ? 'text-green-600' : 'text-yellow-600')}>
          {booking.paid ? 'Paid' : 'Unpaid'}
        </p>
      </div>
      <button onClick={() => onEdit(booking)} className="btn-ghost p-2 rounded-lg flex-shrink-0" aria-label="Edit">
        <Pencil className="w-3.5 h-3.5" />
      </button>
    </div>
  )
}

function BookingDrawer({ booking, onClose, onEdit, onDeleted }) {
  const [deleting, setDeleting] = useState(false)

  async function handleDelete() {
    if (!confirm('Delete this booking? This cannot be undone.')) return
    setDeleting(true)
    await supabase.from('bookings').delete().eq('id', booking.id)
    onDeleted()
  }

  return (
    <div className="fixed inset-0 z-40 flex justify-end">
      <div className="absolute inset-0 bg-navy/30 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white w-full max-w-sm h-full flex flex-col shadow-2xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-surface-border flex-shrink-0">
          <div>
            <p className="font-bold text-navy text-sm">
              {booking.clients?.first_name} {booking.clients?.last_name}
            </p>
            <p className="text-xs text-navy-300">{booking.services?.name ?? 'No service'}</p>
          </div>
          <button onClick={onClose} className="btn-ghost p-1.5 rounded-lg">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
          <div className="space-y-3">
            <p className="text-xs font-bold text-navy-300 uppercase tracking-widest">Details</p>
            <div>
              <p className="label">Status</p>
              <span className={cn('badge', STATUS_COLORS[booking.status] ?? 'badge-gray')}>
                {booking.status}
              </span>
            </div>
            <div>
              <p className="label">Dates</p>
              <p className="text-sm text-navy">{formatDate(booking.start_date)} – {formatDate(booking.end_date)}</p>
            </div>
            {booking._pets?.length > 0 && (
              <div>
                <p className="label">Pets</p>
                <p className="text-sm text-navy">{booking._pets.map(p => p.pets?.name).filter(Boolean).join(', ')}</p>
              </div>
            )}
          </div>

          <div className="space-y-3">
            <p className="text-xs font-bold text-navy-300 uppercase tracking-widest">Payment</p>
            <div>
              <p className="label">Amount</p>
              <p className="text-sm text-navy">{formatCurrency(booking.price)}</p>
            </div>
            <div>
              <p className="label">Status</p>
              <p className={cn('text-sm font-medium', booking.paid ? 'text-green-600' : 'text-yellow-600')}>
                {booking.paid ? `Paid${booking.payment_method ? ` via ${booking.payment_method}` : ''}` : 'Unpaid'}
              </p>
            </div>
          </div>

          {booking.notes && (
            <div className="space-y-2">
              <p className="text-xs font-bold text-navy-300 uppercase tracking-widest">Notes</p>
              <p className="text-sm text-navy whitespace-pre-wrap">{booking.notes}</p>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 px-5 py-4 border-t border-surface-border flex-shrink-0">
          <button onClick={() => onEdit(booking)} className="btn-outline flex-1">
            <Pencil className="w-3.5 h-3.5" /> Edit
          </button>
          <button
            onClick={handleDelete}
            className={cn('btn-danger px-3', deleting && 'opacity-70 pointer-events-none')}
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  )
}

async function loadBookings(userId) {
  const { data } = await supabase
    .from('bookings')
    .select('*, clients(first_name,last_name), services(name), booking_pets(pet_id, pets(name))')
    .eq('user_id', userId)
    .order('start_date', { ascending: false })
  return (data ?? []).map(b => ({ ...b, _pets: b.booking_pets ?? [] }))
}

export default function Bookings() {
  const { user } = useAuth()
  const [bookings, setBookings] = useState([])
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingBooking, setEditingBooking] = useState(null)
  const [selectedBooking, setSelectedBooking] = useState(null)

  function reload() {
    if (!user) return
    loadBookings(user.id).then(data => { setBookings(data); setLoading(false) })
  }

  useEffect(() => { reload() }, [user])

  function openAdd() { setEditingBooking(null); setModalOpen(true) }
  function openEdit(b) { setEditingBooking(b); setSelectedBooking(null); setModalOpen(true) }
  function closeModal() { setModalOpen(false); setEditingBooking(null) }
  function onSaved() { closeModal(); reload() }
  function onDeleted() { setSelectedBooking(null); reload() }

  const filtered = bookings.filter(b => {
    const matchStatus = statusFilter === 'all' || b.status === statusFilter
    const matchSearch = `${b.clients?.first_name} ${b.clients?.last_name} ${b.services?.name ?? ''}`.toLowerCase().includes(search.toLowerCase())
    return matchStatus && matchSearch
  })

  return (
    <div className="max-w-4xl mx-auto">
      <div className="page-header">
        <div>
          <h1 className="page-title">Bookings</h1>
          <p className="text-sm text-navy-300 mt-0.5">{bookings.length} total</p>
        </div>
        <button className="btn-primary" onClick={openAdd}>
          <Plus className="w-4 h-4" /> New Booking
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-2 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-navy-300" />
          <input className="input pl-9" placeholder="Search bookings…" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="input w-auto" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
          {STATUSES.map(s => (
            <option key={s} value={s}>{s === 'all' ? 'All statuses' : s.charAt(0).toUpperCase() + s.slice(1)}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => <div key={i} className="h-20 bg-white rounded-2xl animate-pulse" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="card p-12 text-center">
          <CalendarDays className="w-10 h-10 text-navy-100 mx-auto mb-3" />
          <p className="font-semibold text-navy mb-1">No bookings found</p>
          <p className="text-sm text-navy-300">Create your first booking to get started.</p>
          <button className="btn-primary mt-4" onClick={openAdd}>
            <Plus className="w-4 h-4" /> New Booking
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(b => (
            <BookingCard key={b.id} booking={b} onEdit={openEdit} onSelect={setSelectedBooking} />
          ))}
        </div>
      )}

      {modalOpen && (
        <BookingModal booking={editingBooking} onClose={closeModal} onSaved={onSaved} />
      )}
      {selectedBooking && (
        <BookingDrawer
          booking={selectedBooking}
          onClose={() => setSelectedBooking(null)}
          onEdit={openEdit}
          onDeleted={onDeleted}
        />
      )}
    </div>
  )
}
