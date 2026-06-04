import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { X, Loader2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/context/AuthContext'
import { cn } from '@/lib/utils'
import PetPhotoUpload from './PetPhotoUpload'

const schema = z.object({
  client_id: z.string().min(1, 'Client is required'),
  name: z.string().min(1, 'Pet name is required'),
  species: z.string().min(1, 'Species is required'),
  breed: z.string().optional(),
  color: z.string().optional(),
  dob: z.string().optional(),
  sex: z.string().optional(),
  altered: z.boolean().optional(),
  weight_lbs: z.string().optional(),
  microchip: z.string().optional(),
  notes: z.string().optional(),
  medical_notes: z.string().optional(),
})

const SPECIES = ['Dog', 'Cat', 'Bird', 'Rabbit', 'Guinea Pig', 'Reptile', 'Other']
const SEXES = ['', 'Male', 'Female', 'Unknown']

const TEMPERAMENT_QUESTIONS = [
  { key: 'good_with_children', label: 'Good with children?' },
  { key: 'good_with_animals', label: 'Likes other animals?' },
  { key: 'good_with_strangers', label: 'Good with strangers?' },
  { key: 'good_with_men', label: 'Good with men?' },
  { key: 'good_with_women', label: 'Good with women?' },
]

function TriToggle({ value, onChange }) {
  return (
    <div className="flex rounded-lg border border-surface-border overflow-hidden text-xs font-semibold">
      {[
        { val: true, label: 'Yes', active: 'bg-green-500 text-white border-green-500' },
        { val: null, label: '?', active: 'bg-navy-100 text-navy' },
        { val: false, label: 'No', active: 'bg-red-400 text-white border-red-400' },
      ].map(({ val, label, active }) => (
        <button
          key={String(val)}
          type="button"
          onClick={() => onChange(value === val ? null : val)}
          className={cn(
            'flex-1 py-1.5 transition-colors',
            value === val ? active : 'bg-white text-navy-300 hover:bg-surface'
          )}
        >
          {label}
        </button>
      ))}
    </div>
  )
}

function Field({ label, error, children }) {
  return (
    <div>
      <label className="label">{label}</label>
      {children}
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  )
}

function SectionHeading({ children }) {
  return (
    <div className="flex items-center gap-3 pt-2">
      <p className="text-xs font-bold text-navy-300 uppercase tracking-widest whitespace-nowrap">{children}</p>
      <div className="flex-1 h-px bg-surface-border" />
    </div>
  )
}

export default function PetModal({ pet = null, defaultClientId = null, onClose, onSaved }) {
  const { user } = useAuth()
  const [clients, setClients] = useState([])
  const [saving, setSaving] = useState(false)
  const [photoUrl, setPhotoUrl] = useState(pet?.photo_url ?? null)
  const [temperament, setTemperament] = useState({
    good_with_children: pet?.good_with_children ?? null,
    good_with_animals: pet?.good_with_animals ?? null,
    good_with_strangers: pet?.good_with_strangers ?? null,
    good_with_men: pet?.good_with_men ?? null,
    good_with_women: pet?.good_with_women ?? null,
  })
  const isEdit = Boolean(pet)

  const { register, handleSubmit, formState: { errors }, watch } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      client_id: pet?.client_id ?? defaultClientId ?? '',
      name: pet?.name ?? '',
      species: pet?.species ?? 'Dog',
      breed: pet?.breed ?? '',
      color: pet?.color ?? '',
      dob: pet?.dob ?? '',
      sex: pet?.sex ?? '',
      altered: pet?.altered ?? false,
      weight_lbs: pet?.weight_lbs?.toString() ?? '',
      microchip: pet?.microchip ?? '',
      notes: pet?.notes ?? '',
      medical_notes: pet?.medical_notes ?? '',
    },
  })

  useEffect(() => {
    supabase
      .from('clients')
      .select('id, first_name, last_name')
      .eq('user_id', user.id)
      .order('last_name')
      .then(({ data }) => setClients(data ?? []))
  }, [user])

  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  async function onSubmit(data) {
    setSaving(true)
    const payload = {
      ...data,
      user_id: user.id,
      photo_url: photoUrl,
      ...temperament,
      weight_lbs: data.weight_lbs ? parseFloat(data.weight_lbs) : null,
      dob: data.dob || null,
      sex: data.sex || null,
      altered: Boolean(data.altered),
    }

    const { error } = isEdit
      ? await supabase.from('pets').update(payload).eq('id', pet.id)
      : await supabase.from('pets').insert(payload)

    setSaving(false)
    if (!error) onSaved()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-navy/40 backdrop-blur-sm" onClick={onClose} />

      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-surface-border flex-shrink-0">
          <h2 className="text-base font-bold text-navy">
            {isEdit ? 'Edit Pet' : 'Add Pet'}
          </h2>
          <button onClick={onClose} className="btn-ghost p-1.5 rounded-lg">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col flex-1 overflow-hidden">
          <div className="overflow-y-auto px-4 py-4 space-y-4">

            <SectionHeading>Owner</SectionHeading>

            <Field label="Client *" error={errors.client_id?.message}>
              <select
                className={cn('input', errors.client_id && 'border-red-400 focus:ring-red-400')}
                {...register('client_id')}
              >
                <option value="">Select a client…</option>
                {clients.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.first_name} {c.last_name}
                  </option>
                ))}
              </select>
            </Field>

            <SectionHeading>Basic Info</SectionHeading>

            <div className="grid grid-cols-2 gap-3">
              <Field label="Pet Name *" error={errors.name?.message}>
                <input
                  className={cn('input', errors.name && 'border-red-400 focus:ring-red-400')}
                  {...register('name')}
                  placeholder="Biscuit"
                  autoFocus
                />
              </Field>
              <Field label="Species *" error={errors.species?.message}>
                <select className="input" {...register('species')}>
                  {SPECIES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </Field>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Field label="Breed">
                <input className="input" {...register('breed')} placeholder="Golden Retriever" />
              </Field>
              <Field label="Color / Markings">
                <input className="input" {...register('color')} placeholder="Golden, white chest" />
              </Field>
            </div>

            <SectionHeading>Details</SectionHeading>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Field label="Date of Birth">
                <input className="input" type="date" {...register('dob')} />
              </Field>
              <Field label="Sex">
                <select className="input" {...register('sex')}>
                  {SEXES.map(s => <option key={s} value={s}>{s || 'Unknown'}</option>)}
                </select>
              </Field>
              <Field label="Weight (lbs)">
                <input className="input" type="number" step="0.1" min="0" {...register('weight_lbs')} placeholder="45.0" />
              </Field>
            </div>

            <div className="flex items-center gap-3">
              <input
                id="altered"
                type="checkbox"
                className="w-4 h-4 rounded border-surface-border text-teal accent-teal"
                {...register('altered')}
              />
              <label htmlFor="altered" className="text-sm font-medium text-navy cursor-pointer">
                Spayed / Neutered
              </label>
            </div>

            <Field label="Microchip Number">
              <input className="input" {...register('microchip')} placeholder="985112000000000" />
            </Field>

            <SectionHeading>Temperament</SectionHeading>

            <div className="space-y-3">
              {TEMPERAMENT_QUESTIONS.map(({ key, label }) => (
                <div key={key} className="flex items-center justify-between gap-4">
                  <span className="text-sm text-navy flex-1">{label}</span>
                  <div className="w-32 flex-shrink-0">
                    <TriToggle
                      value={temperament[key]}
                      onChange={val => setTemperament(t => ({ ...t, [key]: val }))}
                    />
                  </div>
                </div>
              ))}
            </div>

            <SectionHeading>Photo</SectionHeading>

            <PetPhotoUpload
              petId={pet?.id}
              currentUrl={photoUrl}
              onUploaded={setPhotoUrl}
            />

            <SectionHeading>Notes</SectionHeading>

            <Field label="General Notes">
              <textarea
                className="input resize-none"
                rows={2}
                {...register('notes')}
                placeholder="Personality, preferences, quirks…"
              />
            </Field>

            <Field label="Medical Notes">
              <textarea
                className="input resize-none"
                rows={2}
                {...register('medical_notes')}
                placeholder="Allergies, medications, conditions…"
              />
            </Field>
          </div>

          <div className="flex items-center justify-end gap-3 px-4 py-4 border-t border-surface-border flex-shrink-0">
            <button type="button" onClick={onClose} className="btn-outline">Cancel</button>
            <button
              type="submit"
              className={cn('btn-primary', saving && 'opacity-70 pointer-events-none')}
            >
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              {saving ? 'Saving…' : isEdit ? 'Save Changes' : 'Add Pet'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
