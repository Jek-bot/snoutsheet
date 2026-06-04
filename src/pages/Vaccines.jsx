import { useEffect, useState } from 'react'
import { Syringe, Plus, Search, AlertTriangle, Pencil, Trash2, X } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/context/AuthContext'
import { formatDate, daysUntil } from '@/lib/utils'
import { cn } from '@/lib/utils'
import VaccineModal from '@/components/vaccines/VaccineModal'

function urgency(days) {
  if (days == null) return 'ok'
  if (days <= 0) return 'expired'
  if (days <= 7) return 'urgent'
  if (days <= 30) return 'warning'
  return 'ok'
}

const ICON_STYLES = {
  expired: 'bg-red-50 text-red-600',
  urgent: 'bg-red-50 text-red-500',
  warning: 'bg-yellow-50 text-yellow-600',
  ok: 'bg-teal-50 text-teal-600',
}

const BADGE_STYLES = {
  expired: 'badge-red',
  urgent: 'badge-red',
  warning: 'badge-yellow',
  ok: 'badge-teal',
}

function VaccineCard({ vaccine, onEdit, onSelect }) {
  const days = daysUntil(vaccine.expiry_date)
  const level = urgency(days)
  const showAlert = level === 'expired' || level === 'urgent'

  return (
    <div className="card p-4 flex items-center gap-4 hover:shadow-card-hover transition-shadow">
      <button onClick={() => onSelect(vaccine)} className="flex items-center gap-4 flex-1 min-w-0 text-left">
        <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0', ICON_STYLES[level])}>
          {showAlert
            ? <AlertTriangle className="w-4 h-4" />
            : <Syringe className="w-4 h-4" />
          }
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="font-semibold text-navy text-sm">{vaccine.vaccine_name}</p>
            <span className="text-xs text-navy-300">·</span>
            <p className="text-sm text-navy-400">{vaccine.pets?.name}</p>
          </div>
          <p className="text-xs text-navy-300 mt-0.5">
            {vaccine.pets?.clients?.first_name} {vaccine.pets?.clients?.last_name}
            {vaccine.date_given && <> · Given {formatDate(vaccine.date_given)}</>}
          </p>
        </div>
        <div className="text-right flex-shrink-0 mr-2">
          <p className="text-xs text-navy-300 mb-1">Expires</p>
          <span className={cn('badge', BADGE_STYLES[level])}>
            {!vaccine.expiry_date ? '—' : days <= 0 ? 'Expired' : days <= 30 ? `${days}d` : formatDate(vaccine.expiry_date)}
          </span>
        </div>
      </button>
      <button onClick={() => onEdit(vaccine)} className="btn-ghost p-2 rounded-lg flex-shrink-0" aria-label="Edit">
        <Pencil className="w-3.5 h-3.5" />
      </button>
    </div>
  )
}

function VaccineDrawer({ vaccine, onClose, onEdit, onDeleted }) {
  const [deleting, setDeleting] = useState(false)
  const days = daysUntil(vaccine.expiry_date)
  const level = urgency(days)

  async function handleDelete() {
    if (!confirm(`Delete ${vaccine.vaccine_name} record for ${vaccine.pets?.name}?`)) return
    setDeleting(true)
    await supabase.from('vaccines').delete().eq('id', vaccine.id)
    onDeleted()
  }

  return (
    <div className="fixed inset-0 z-40 flex justify-end">
      <div className="absolute inset-0 bg-navy/30 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white w-full sm:max-w-sm h-full flex flex-col shadow-2xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-surface-border flex-shrink-0">
          <div>
            <p className="font-bold text-navy text-sm">{vaccine.vaccine_name}</p>
            <p className="text-xs text-navy-300">
              {vaccine.pets?.name} · {vaccine.pets?.clients?.first_name} {vaccine.pets?.clients?.last_name}
            </p>
          </div>
          <button onClick={onClose} className="btn-ghost p-1.5 rounded-lg">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
          <div className="space-y-3">
            <p className="text-xs font-bold text-navy-300 uppercase tracking-widest">Record</p>

            {vaccine.date_given && (
              <div>
                <p className="label">Date Given</p>
                <p className="text-sm text-navy">{formatDate(vaccine.date_given)}</p>
              </div>
            )}

            <div>
              <p className="label">Expiry / Due Date</p>
              <div className="flex items-center gap-2 mt-0.5">
                <p className="text-sm text-navy">
                  {vaccine.expiry_date ? formatDate(vaccine.expiry_date) : '—'}
                </p>
                {vaccine.expiry_date && (
                  <span className={cn('badge', BADGE_STYLES[level])}>
                    {days <= 0 ? 'Expired' : days <= 30 ? `${days} days` : 'Up to date'}
                  </span>
                )}
              </div>
            </div>

            {vaccine.lot_number && (
              <div>
                <p className="label">Lot Number</p>
                <p className="text-sm text-navy font-mono">{vaccine.lot_number}</p>
              </div>
            )}

            {vaccine.administered_by && (
              <div>
                <p className="label">Administered By</p>
                <p className="text-sm text-navy">{vaccine.administered_by}</p>
              </div>
            )}
          </div>

          {vaccine.notes && (
            <div className="space-y-2">
              <p className="text-xs font-bold text-navy-300 uppercase tracking-widest">Notes</p>
              <p className="text-sm text-navy whitespace-pre-wrap">{vaccine.notes}</p>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 px-5 py-4 border-t border-surface-border flex-shrink-0">
          <button onClick={() => onEdit(vaccine)} className="btn-outline flex-1">
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

export default function Vaccines() {
  const { user } = useAuth()
  const [vaccines, setVaccines] = useState([])
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingVaccine, setEditingVaccine] = useState(null)
  const [selectedVaccine, setSelectedVaccine] = useState(null)

  function reload() {
    if (!user) return
    supabase
      .from('vaccines')
      .select('*, pets(name, species, clients(first_name,last_name))')
      .eq('user_id', user.id)
      .order('expiry_date', { ascending: true, nullsFirst: false })
      .then(({ data }) => { setVaccines(data ?? []); setLoading(false) })
  }

  useEffect(() => { reload() }, [user])

  function openAdd() { setEditingVaccine(null); setModalOpen(true) }
  function openEdit(v) { setEditingVaccine(v); setSelectedVaccine(null); setModalOpen(true) }
  function closeModal() { setModalOpen(false); setEditingVaccine(null) }
  function onSaved() { closeModal(); reload() }
  function onDeleted() { setSelectedVaccine(null); reload() }

  const filtered = vaccines.filter(v => {
    const days = daysUntil(v.expiry_date)
    const level = urgency(days)
    const matchSearch = `${v.vaccine_name} ${v.pets?.name ?? ''} ${v.pets?.clients?.first_name ?? ''} ${v.pets?.clients?.last_name ?? ''}`.toLowerCase().includes(search.toLowerCase())
    const matchFilter =
      filter === 'all' ||
      (filter === 'expired' && level === 'expired') ||
      (filter === 'soon' && (level === 'urgent' || level === 'warning')) ||
      (filter === 'ok' && level === 'ok')
    return matchSearch && matchFilter
  })

  return (
    <div className="max-w-4xl mx-auto">
      <div className="page-header">
        <div>
          <h1 className="page-title">Vaccines</h1>
          <p className="text-sm text-navy-300 mt-0.5">{vaccines.length} records</p>
        </div>
        <button className="btn-primary" onClick={openAdd}>
          <Plus className="w-4 h-4" /> Log Vaccine
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-2 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-navy-300" />
          <input className="input pl-9" placeholder="Search vaccines…" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="input w-auto" value={filter} onChange={e => setFilter(e.target.value)}>
          <option value="all">All</option>
          <option value="expired">Expired</option>
          <option value="soon">Expiring soon</option>
          <option value="ok">Up to date</option>
        </select>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => <div key={i} className="h-20 bg-white rounded-2xl animate-pulse" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="card p-12 text-center">
          <Syringe className="w-10 h-10 text-navy-100 mx-auto mb-3" />
          <p className="font-semibold text-navy mb-1">No vaccine records found</p>
          <p className="text-sm text-navy-300">Start logging vaccines to track pet health.</p>
          <button className="btn-primary mt-4" onClick={openAdd}>
            <Plus className="w-4 h-4" /> Log Vaccine
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(v => (
            <VaccineCard key={v.id} vaccine={v} onEdit={openEdit} onSelect={setSelectedVaccine} />
          ))}
        </div>
      )}

      {modalOpen && (
        <VaccineModal vaccine={editingVaccine} onClose={closeModal} onSaved={onSaved} />
      )}
      {selectedVaccine && (
        <VaccineDrawer
          vaccine={selectedVaccine}
          onClose={() => setSelectedVaccine(null)}
          onEdit={openEdit}
          onDeleted={onDeleted}
        />
      )}
    </div>
  )
}
