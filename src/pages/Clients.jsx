import { useEffect, useState } from 'react'
import { Users, Plus, Search, Phone, Mail, ChevronRight, Pencil, Trash2, X } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/context/AuthContext'
import { initials, formatDate } from '@/lib/utils'
import { cn } from '@/lib/utils'
import ClientModal from '@/components/clients/ClientModal'

function ClientCard({ client, onEdit, onSelect }) {
  return (
    <div className="card p-4 flex items-center gap-4 hover:shadow-card-hover transition-shadow">
      <button onClick={() => onSelect(client)} className="flex items-center gap-4 flex-1 min-w-0 text-left">
        <div className="w-10 h-10 rounded-full bg-navy flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
          {initials(client.first_name, client.last_name)}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-navy text-sm">{client.first_name} {client.last_name}</p>
          <div className="flex items-center gap-3 mt-0.5 flex-wrap">
            {client.email && (
              <span className="text-xs text-navy-300 flex items-center gap-1 truncate">
                <Mail className="w-3 h-3 flex-shrink-0" /> {client.email}
              </span>
            )}
            {client.phone && (
              <span className="text-xs text-navy-300 flex items-center gap-1">
                <Phone className="w-3 h-3 flex-shrink-0" /> {client.phone}
              </span>
            )}
          </div>
        </div>
        <ChevronRight className="w-4 h-4 text-navy-200 group-hover:text-navy-400 flex-shrink-0" />
      </button>
      <button
        onClick={() => onEdit(client)}
        className="btn-ghost p-2 rounded-lg flex-shrink-0"
        aria-label="Edit client"
      >
        <Pencil className="w-3.5 h-3.5" />
      </button>
    </div>
  )
}

function DetailRow({ label, value }) {
  if (!value) return null
  return (
    <div>
      <p className="label">{label}</p>
      <p className="text-sm text-navy">{value}</p>
    </div>
  )
}

function ClientDrawer({ client, onClose, onEdit, onDeleted }) {
  const [deleting, setDeleting] = useState(false)
  const [pets, setPets] = useState([])

  useEffect(() => {
    if (!client) return
    supabase
      .from('pets')
      .select('*')
      .eq('client_id', client.id)
      .order('name')
      .then(({ data }) => setPets(data ?? []))
  }, [client])

  async function handleDelete() {
    if (!confirm(`Delete ${client.first_name} ${client.last_name}? This cannot be undone.`)) return
    setDeleting(true)
    await supabase.from('clients').delete().eq('id', client.id)
    onDeleted()
  }

  if (!client) return null

  const address = [client.address, client.city, client.state, client.zip].filter(Boolean).join(', ')

  return (
    <div className="fixed inset-0 z-40 flex justify-end">
      <div className="absolute inset-0 bg-navy/30 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white w-full max-w-sm h-full flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-surface-border flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-navy flex items-center justify-center text-white text-sm font-bold">
              {initials(client.first_name, client.last_name)}
            </div>
            <div>
              <p className="font-bold text-navy text-sm">{client.first_name} {client.last_name}</p>
              <p className="text-xs text-navy-300">Client since {formatDate(client.created_at)}</p>
            </div>
          </div>
          <button onClick={onClose} className="btn-ghost p-1.5 rounded-lg">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
          {/* Contact */}
          <div className="space-y-3">
            <p className="text-xs font-bold text-navy-300 uppercase tracking-widest">Contact</p>
            <DetailRow label="Email" value={client.email} />
            <DetailRow label="Phone" value={client.phone} />
            <DetailRow label="Address" value={address} />
          </div>

          {/* Pets */}
          <div className="space-y-2">
            <p className="text-xs font-bold text-navy-300 uppercase tracking-widest">Pets ({pets.length})</p>
            {pets.length === 0 ? (
              <p className="text-xs text-navy-300">No pets on file</p>
            ) : (
              pets.map(p => (
                <div key={p.id} className="flex items-center gap-2 bg-surface rounded-xl px-3 py-2">
                  <span className="text-base">{p.species === 'Cat' ? '🐈' : p.species === 'Bird' ? '🐦' : '🐕'}</span>
                  <div>
                    <p className="text-sm font-semibold text-navy">{p.name}</p>
                    <p className="text-xs text-navy-300">{[p.breed, p.sex].filter(Boolean).join(' · ')}</p>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Emergency contact */}
          {(client.emergency_contact_name || client.emergency_contact_phone) && (
            <div className="space-y-3">
              <p className="text-xs font-bold text-navy-300 uppercase tracking-widest">Emergency Contact</p>
              <DetailRow label="Name" value={client.emergency_contact_name} />
              <DetailRow label="Phone" value={client.emergency_contact_phone} />
            </div>
          )}

          {/* Vet */}
          {(client.vet_name || client.vet_phone) && (
            <div className="space-y-3">
              <p className="text-xs font-bold text-navy-300 uppercase tracking-widest">Veterinarian</p>
              <DetailRow label="Clinic" value={client.vet_name} />
              <DetailRow label="Phone" value={client.vet_phone} />
              <DetailRow label="Address" value={client.vet_address} />
            </div>
          )}

          {/* Notes */}
          {client.notes && (
            <div className="space-y-2">
              <p className="text-xs font-bold text-navy-300 uppercase tracking-widest">Notes</p>
              <p className="text-sm text-navy whitespace-pre-wrap">{client.notes}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center gap-2 px-5 py-4 border-t border-surface-border flex-shrink-0">
          <button onClick={() => onEdit(client)} className="btn-outline flex-1">
            <Pencil className="w-3.5 h-3.5" /> Edit
          </button>
          <button
            onClick={handleDelete}
            className={cn('btn-danger px-3', deleting && 'opacity-70 pointer-events-none')}
            aria-label="Delete client"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  )
}

export default function Clients() {
  const { user } = useAuth()
  const [clients, setClients] = useState([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingClient, setEditingClient] = useState(null)
  const [selectedClient, setSelectedClient] = useState(null)

  function loadClients() {
    if (!user) return
    supabase
      .from('clients')
      .select('*')
      .eq('user_id', user.id)
      .order('last_name')
      .then(({ data }) => { setClients(data ?? []); setLoading(false) })
  }

  useEffect(() => { loadClients() }, [user])

  function openAdd() { setEditingClient(null); setModalOpen(true) }
  function openEdit(client) { setEditingClient(client); setSelectedClient(null); setModalOpen(true) }
  function closeModal() { setModalOpen(false); setEditingClient(null) }

  function onSaved() {
    closeModal()
    loadClients()
  }

  function onDeleted() {
    setSelectedClient(null)
    loadClients()
  }

  const filtered = clients.filter(c =>
    `${c.first_name} ${c.last_name} ${c.email ?? ''} ${c.phone ?? ''}`.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="max-w-4xl mx-auto">
      <div className="page-header">
        <div>
          <h1 className="page-title">Clients</h1>
          <p className="text-sm text-navy-300 mt-0.5">{clients.length} total</p>
        </div>
        <button className="btn-primary" onClick={openAdd}>
          <Plus className="w-4 h-4" /> Add Client
        </button>
      </div>

      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-navy-300" />
        <input
          className="input pl-9"
          placeholder="Search clients…"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {loading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => <div key={i} className="h-16 bg-white rounded-2xl animate-pulse" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="card p-12 text-center">
          <Users className="w-10 h-10 text-navy-100 mx-auto mb-3" />
          <p className="font-semibold text-navy mb-1">
            {search ? 'No clients match your search' : 'No clients yet'}
          </p>
          <p className="text-sm text-navy-300">
            {search ? 'Try a different name or email.' : 'Add your first client to get started.'}
          </p>
          {!search && (
            <button className="btn-primary mt-4" onClick={openAdd}>
              <Plus className="w-4 h-4" /> Add Client
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(c => (
            <ClientCard
              key={c.id}
              client={c}
              onEdit={openEdit}
              onSelect={setSelectedClient}
            />
          ))}
        </div>
      )}

      {modalOpen && (
        <ClientModal
          client={editingClient}
          onClose={closeModal}
          onSaved={onSaved}
        />
      )}

      {selectedClient && (
        <ClientDrawer
          client={selectedClient}
          onClose={() => setSelectedClient(null)}
          onEdit={openEdit}
          onDeleted={onDeleted}
        />
      )}
    </div>
  )
}
