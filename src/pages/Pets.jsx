import { useEffect, useState } from 'react'
import { PawPrint, Plus, Search, ChevronRight, Pencil, Trash2, X, ZoomIn } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/context/AuthContext'
import { petAge, formatDate } from '@/lib/utils'
import { cn } from '@/lib/utils'
import PetModal from '@/components/pets/PetModal'

const SPECIES_EMOJI = { Dog: '🐕', Cat: '🐈', Bird: '🐦', Rabbit: '🐇', 'Guinea Pig': '🐹', Reptile: '🦎', Other: '🐾' }

function PhotoLightbox({ url, name, onClose }) {
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <button className="absolute top-4 right-4 text-white btn-ghost p-2 rounded-full" onClick={onClose}>
        <X className="w-6 h-6" />
      </button>
      <img
        src={url}
        alt={name}
        className="max-w-full max-h-full rounded-2xl object-contain shadow-2xl"
        onClick={e => e.stopPropagation()}
      />
    </div>
  )
}

function PetAvatar({ pet, size = 'md' }) {
  const emoji = SPECIES_EMOJI[pet.species] ?? '🐾'
  const cls = size === 'lg'
    ? 'w-16 h-16 rounded-2xl text-3xl'
    : 'w-10 h-10 rounded-full text-xl'
  if (pet.photo_url) {
    return (
      <img
        src={pet.photo_url}
        alt={pet.name}
        className={cn(cls, 'object-cover flex-shrink-0 border border-surface-border')}
      />
    )
  }
  return (
    <div className={cn(cls, 'bg-teal-50 flex items-center justify-center flex-shrink-0')}>
      {emoji}
    </div>
  )
}

function PetCard({ pet, onEdit, onSelect }) {
  return (
    <div className="card p-4 flex items-center gap-4 hover:shadow-card-hover transition-shadow">
      <button onClick={() => onSelect(pet)} className="flex items-center gap-4 flex-1 min-w-0 text-left">
        <PetAvatar pet={pet} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-semibold text-navy text-sm">{pet.name}</p>
            <span className="badge badge-gray">{pet.species}</span>
            {pet.breed && <span className="text-xs text-navy-300 truncate">{pet.breed}</span>}
          </div>
          <p className="text-xs text-navy-300 mt-0.5">
            {pet.clients?.first_name} {pet.clients?.last_name}
            {pet.dob && <> · {petAge(pet.dob)}</>}
            {pet.sex && <> · {pet.sex}{pet.altered ? ' (altered)' : ''}</>}
          </p>
        </div>
        <ChevronRight className="w-4 h-4 text-navy-200 flex-shrink-0" />
      </button>
      <button onClick={() => onEdit(pet)} className="btn-ghost p-2 rounded-lg flex-shrink-0" aria-label="Edit pet">
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

function PetDrawer({ pet, onClose, onEdit, onDeleted }) {
  const [deleting, setDeleting] = useState(false)
  const [vaccines, setVaccines] = useState([])
  const [lightbox, setLightbox] = useState(false)

  useEffect(() => {
    supabase
      .from('vaccines')
      .select('*')
      .eq('pet_id', pet.id)
      .order('expiry_date')
      .then(({ data }) => setVaccines(data ?? []))
  }, [pet])

  async function handleDelete() {
    if (!confirm(`Delete ${pet.name}? This cannot be undone.`)) return
    setDeleting(true)
    await supabase.from('pets').delete().eq('id', pet.id)
    onDeleted()
  }

  return (
    <>
    <div className="fixed inset-0 z-40 flex justify-end">
      <div className="absolute inset-0 bg-navy/30 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white w-full sm:max-w-sm h-full flex flex-col shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-surface-border flex-shrink-0">
          <div className="flex items-center gap-3">
            <PetAvatar pet={pet} />
            <div>
              <p className="font-bold text-navy text-sm">{pet.name}</p>
              <p className="text-xs text-navy-300">
                {pet.clients?.first_name} {pet.clients?.last_name}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="btn-ghost p-1.5 rounded-lg">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">

          {/* Photo */}
          {pet.photo_url && (
            <div>
              <button
                type="button"
                onClick={() => setLightbox(true)}
                className="relative group w-full rounded-2xl overflow-hidden border border-surface-border"
              >
                <img
                  src={pet.photo_url}
                  alt={pet.name}
                  className="w-full h-48 object-cover"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 group-active:bg-black/30 transition-colors flex items-center justify-center">
                  <ZoomIn className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow" />
                </div>
              </button>
            </div>
          )}

          <div className="space-y-3">
            <p className="text-xs font-bold text-navy-300 uppercase tracking-widest">Profile</p>
            <DetailRow label="Species" value={pet.species} />
            <DetailRow label="Breed" value={pet.breed} />
            <DetailRow label="Color" value={pet.color} />
            <DetailRow label="Date of Birth" value={pet.dob ? formatDate(pet.dob) : null} />
            {pet.dob && <DetailRow label="Age" value={petAge(pet.dob)} />}
            <DetailRow label="Sex" value={pet.sex ? `${pet.sex}${pet.altered ? ' (altered)' : ''}` : null} />
            <DetailRow label="Weight" value={pet.weight_lbs ? `${pet.weight_lbs} lbs` : null} />
            <DetailRow label="Microchip" value={pet.microchip} />
          </div>

          {vaccines.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-bold text-navy-300 uppercase tracking-widest">Vaccines ({vaccines.length})</p>
              {vaccines.map(v => (
                <div key={v.id} className="flex items-center justify-between bg-surface rounded-xl px-3 py-2">
                  <p className="text-sm font-medium text-navy">{v.vaccine_name}</p>
                  <p className="text-xs text-navy-300">
                    {v.expiry_date ? `Exp ${formatDate(v.expiry_date)}` : '—'}
                  </p>
                </div>
              ))}
            </div>
          )}

          {pet.notes && (
            <div className="space-y-2">
              <p className="text-xs font-bold text-navy-300 uppercase tracking-widest">Notes</p>
              <p className="text-sm text-navy whitespace-pre-wrap">{pet.notes}</p>
            </div>
          )}

          {pet.medical_notes && (
            <div className="space-y-2">
              <p className="text-xs font-bold text-navy-300 uppercase tracking-widest">Medical Notes</p>
              <p className="text-sm text-navy whitespace-pre-wrap">{pet.medical_notes}</p>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 px-5 py-4 border-t border-surface-border flex-shrink-0">
          <button onClick={() => onEdit(pet)} className="btn-outline flex-1">
            <Pencil className="w-3.5 h-3.5" /> Edit
          </button>
          <button
            onClick={handleDelete}
            className={cn('btn-danger px-3', deleting && 'opacity-70 pointer-events-none')}
            aria-label="Delete pet"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>

    {lightbox && pet.photo_url && (
      <PhotoLightbox url={pet.photo_url} name={pet.name} onClose={() => setLightbox(false)} />
    )}
    </>
  )
}


export default function Pets() {
  const { user } = useAuth()
  const [pets, setPets] = useState([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingPet, setEditingPet] = useState(null)
  const [selectedPet, setSelectedPet] = useState(null)

  function loadPets() {
    if (!user) return
    supabase
      .from('pets')
      .select('*, clients(first_name, last_name)')
      .eq('user_id', user.id)
      .order('name')
      .then(({ data }) => { setPets(data ?? []); setLoading(false) })
  }

  useEffect(() => { loadPets() }, [user])

  function openAdd() { setEditingPet(null); setModalOpen(true) }
  function openEdit(pet) { setEditingPet(pet); setSelectedPet(null); setModalOpen(true) }
  function closeModal() { setModalOpen(false); setEditingPet(null) }

  function onSaved() { closeModal(); loadPets() }
  function onDeleted() { setSelectedPet(null); loadPets() }

  const filtered = pets.filter(p =>
    `${p.name} ${p.species} ${p.breed ?? ''} ${p.clients?.first_name ?? ''} ${p.clients?.last_name ?? ''}`.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="max-w-4xl mx-auto">
      <div className="page-header">
        <div>
          <h1 className="page-title">Pets</h1>
          <p className="text-sm text-navy-300 mt-0.5">{pets.length} total</p>
        </div>
        <button className="btn-primary" onClick={openAdd}>
          <Plus className="w-4 h-4" /> Add Pet
        </button>
      </div>

      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-navy-300" />
        <input
          className="input pl-9"
          placeholder="Search pets…"
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
          <PawPrint className="w-10 h-10 text-navy-100 mx-auto mb-3" />
          <p className="font-semibold text-navy mb-1">
            {search ? 'No pets match your search' : 'No pets yet'}
          </p>
          <p className="text-sm text-navy-300">
            {search ? 'Try a different name or owner.' : 'Add a pet to get started.'}
          </p>
          {!search && (
            <button className="btn-primary mt-4" onClick={openAdd}>
              <Plus className="w-4 h-4" /> Add Pet
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(p => (
            <PetCard key={p.id} pet={p} onEdit={openEdit} onSelect={setSelectedPet} />
          ))}
        </div>
      )}

      {modalOpen && (
        <PetModal
          pet={editingPet}
          onClose={closeModal}
          onSaved={onSaved}
        />
      )}

      {selectedPet && (
        <PetDrawer
          pet={selectedPet}
          onClose={() => setSelectedPet(null)}
          onEdit={openEdit}
          onDeleted={onDeleted}
        />
      )}
    </div>
  )
}
