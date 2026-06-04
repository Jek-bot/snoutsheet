import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { formatDate, petAge } from '@/lib/utils'
import { cn } from '@/lib/utils'

const SPECIES_EMOJI = { Dog: '🐕', Cat: '🐈', Bird: '🐦', Rabbit: '🐇', 'Guinea Pig': '🐹', Reptile: '🦎', Other: '🐾' }

const STATUS_COLORS = {
  inquiry: 'badge-yellow',
  confirmed: 'badge-teal',
  active: 'badge-green',
}

function Section({ title, children }) {
  return (
    <div className="bg-white rounded-2xl border border-surface-border shadow-card p-5 space-y-4">
      <h2 className="text-base font-bold text-navy">{title}</h2>
      {children}
    </div>
  )
}

function PetCard({ pet, vaccines }) {
  const emoji = SPECIES_EMOJI[pet.species] ?? '🐾'
  const petVaccines = vaccines.filter(v => v.pet_id === pet.id)
  const [lightbox, setLightbox] = useState(false)

  return (
    <div className="border border-surface-border rounded-2xl overflow-hidden">
      {pet.photo_url && (
        <button
          onClick={() => setLightbox(true)}
          className="w-full"
        >
          <img src={pet.photo_url} alt={pet.name} className="w-full h-48 object-cover" />
        </button>
      )}
      <div className="p-4 space-y-3">
        <div className="flex items-center gap-3">
          {!pet.photo_url && (
            <div className="w-10 h-10 rounded-full bg-teal-50 flex items-center justify-center text-xl flex-shrink-0">
              {emoji}
            </div>
          )}
          <div>
            <p className="font-bold text-navy">{pet.name}</p>
            <p className="text-xs text-navy-300">
              {pet.species}{pet.breed ? ` · ${pet.breed}` : ''}
              {pet.dob ? ` · ${petAge(pet.dob)}` : ''}
              {pet.sex ? ` · ${pet.sex}${pet.altered ? ' (altered)' : ''}` : ''}
            </p>
          </div>
        </div>

        {pet.medical_notes && (
          <div className="bg-yellow-50 rounded-xl px-3 py-2">
            <p className="text-xs font-semibold text-yellow-700 mb-0.5">Medical Notes</p>
            <p className="text-sm text-navy whitespace-pre-wrap">{pet.medical_notes}</p>
          </div>
        )}

        {petVaccines.length > 0 && (
          <div className="space-y-1">
            <p className="text-xs font-semibold text-navy-300 uppercase tracking-wide">Vaccines</p>
            {petVaccines.map(v => (
              <div key={v.id} className="flex items-center justify-between text-sm">
                <span className="text-navy">{v.vaccine_name}</span>
                <span className="text-navy-300 text-xs">
                  {v.expiry_date ? `Exp ${formatDate(v.expiry_date)}` : '—'}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {lightbox && pet.photo_url && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
          onClick={() => setLightbox(false)}
        >
          <img src={pet.photo_url} alt={pet.name} className="max-w-full max-h-full rounded-2xl object-contain" />
        </div>
      )}
    </div>
  )
}

export default function ClientPortal() {
  const { token } = useParams()
  const [data, setData] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!token) { setError('Invalid link.'); setLoading(false); return }

    supabase.functions.invoke('client-portal', { body: { token } })
      .then(({ data, error }) => {
        if (error || data?.error) {
          setError(data?.error ?? 'This link is invalid or has been revoked.')
        } else {
          setData(data)
        }
        setLoading(false)
      })
  }, [token])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-full border-4 border-teal border-t-transparent animate-spin" />
          <p className="text-sm text-navy-400 font-medium">Loading your portal…</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface p-6">
        <div className="max-w-sm w-full bg-white rounded-2xl border border-surface-border shadow-card p-8 text-center">
          <p className="text-4xl mb-4">🔒</p>
          <h2 className="text-lg font-bold text-navy mb-2">Link Not Found</h2>
          <p className="text-sm text-navy-300">{error}</p>
        </div>
      </div>
    )
  }

  const { client, pets, bookings, vaccines, sitter } = data

  return (
    <div className="min-h-screen bg-surface">
      {/* Header */}
      <div className="bg-navy px-6 py-5">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div>
            <img src="/logo.png" alt="Snoutsheet" className="h-10 w-auto mix-blend-screen" />
          </div>
          <div className="text-right">
            <p className="text-white font-semibold text-sm">{client.first_name} {client.last_name}</p>
            <p className="text-white/50 text-xs">Pet Care Portal</p>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">

        {/* Sitter info */}
        {(sitter.business_name || sitter.business_phone) && (
          <Section title="Your Pet Sitter">
            <div className="space-y-1">
              {sitter.business_name && <p className="font-semibold text-navy">{sitter.business_name}</p>}
              {sitter.business_phone && (
                <a href={`tel:${sitter.business_phone}`} className="text-sm text-teal-600 hover:underline block">
                  📞 {sitter.business_phone}
                </a>
              )}
              {sitter.business_email && (
                <a href={`mailto:${sitter.business_email}`} className="text-sm text-teal-600 hover:underline block">
                  ✉️ {sitter.business_email}
                </a>
              )}
            </div>
          </Section>
        )}

        {/* Upcoming bookings */}
        {bookings.length > 0 && (
          <Section title={`Upcoming Bookings (${bookings.length})`}>
            <div className="space-y-3">
              {bookings.map(b => (
                <div key={b.id} className="flex items-start justify-between gap-4 py-3 border-b border-surface-border last:border-0">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-semibold text-navy text-sm">{b.services?.name ?? 'Pet Sitting'}</p>
                      <span className={cn('badge', STATUS_COLORS[b.status] ?? 'badge-gray')}>
                        {b.status}
                      </span>
                    </div>
                    <p className="text-xs text-navy-300">
                      {formatDate(b.start_date)}
                      {b.end_date !== b.start_date ? ` – ${formatDate(b.end_date)}` : ''}
                    </p>
                    {b.pets?.length > 0 && (
                      <p className="text-xs text-navy-300 mt-0.5">
                        {b.pets.join(', ')}
                      </p>
                    )}
                    {b.notes && (
                      <p className="text-xs text-navy-400 mt-1 italic">{b.notes}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </Section>
        )}

        {/* Pets */}
        <Section title={`Your Pets (${pets.length})`}>
          {pets.length === 0 ? (
            <p className="text-sm text-navy-300">No pets on file yet.</p>
          ) : (
            <div className="space-y-4">
              {pets.map(pet => (
                <PetCard key={pet.id} pet={pet} vaccines={vaccines} />
              ))}
            </div>
          )}
        </Section>

        <p className="text-center text-xs text-navy-300 pb-6">
          This is a read-only view. Contact your sitter to make changes.
        </p>
      </div>
    </div>
  )
}
