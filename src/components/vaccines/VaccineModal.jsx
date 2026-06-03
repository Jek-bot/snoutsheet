import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { X, Loader2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/context/AuthContext'
import { cn } from '@/lib/utils'

const COMMON_VACCINES = [
  'Rabies', 'DHPP / DA2PP', 'Bordetella', 'Leptospirosis', 'Lyme',
  'Canine Influenza', 'FVRCP', 'FeLV', 'Other',
]

const schema = z.object({
  pet_id: z.string().min(1, 'Pet is required'),
  vaccine_name: z.string().min(1, 'Vaccine name is required'),
  date_given: z.string().optional(),
  expiry_date: z.string().optional(),
  lot_number: z.string().optional(),
  administered_by: z.string().optional(),
  notes: z.string().optional(),
})

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

export default function VaccineModal({ vaccine = null, defaultPetId = null, onClose, onSaved }) {
  const { user } = useAuth()
  const [clients, setClients] = useState([])
  const [clientId, setClientId] = useState('')
  const [pets, setPets] = useState([])
  const [customVaccine, setCustomVaccine] = useState(false)
  const [saving, setSaving] = useState(false)
  const isEdit = Boolean(vaccine)

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      pet_id: vaccine?.pet_id ?? defaultPetId ?? '',
      vaccine_name: vaccine?.vaccine_name ?? '',
      date_given: vaccine?.date_given ?? '',
      expiry_date: vaccine?.expiry_date ?? '',
      lot_number: vaccine?.lot_number ?? '',
      administered_by: vaccine?.administered_by ?? '',
      notes: vaccine?.notes ?? '',
    },
  })

  const vaccineNameWatch = watch('vaccine_name')

  // Load clients
  useEffect(() => {
    supabase
      .from('clients')
      .select('id, first_name, last_name')
      .eq('user_id', user.id)
      .order('last_name')
      .then(({ data }) => setClients(data ?? []))
  }, [user])

  // If editing, resolve the client from the pet
  useEffect(() => {
    if (!vaccine?.pet_id) return
    supabase
      .from('pets')
      .select('client_id')
      .eq('id', vaccine.pet_id)
      .single()
      .then(({ data }) => { if (data) setClientId(data.client_id) })
  }, [vaccine])

  // Load pets when client changes
  useEffect(() => {
    if (!clientId) { setPets([]); return }
    supabase
      .from('pets')
      .select('id, name, species')
      .eq('client_id', clientId)
      .order('name')
      .then(({ data }) => setPets(data ?? []))
  }, [clientId])

  // If a defaultPetId is set, resolve its client
  useEffect(() => {
    if (!defaultPetId) return
    supabase
      .from('pets')
      .select('client_id')
      .eq('id', defaultPetId)
      .single()
      .then(({ data }) => { if (data) setClientId(data.client_id) })
  }, [defaultPetId])

  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  // Switch to custom input when "Other" selected
  useEffect(() => {
    if (vaccineNameWatch === 'Other') {
      setCustomVaccine(true)
      setValue('vaccine_name', '')
    }
  }, [vaccineNameWatch])

  async function onSubmit(data) {
    setSaving(true)
    const payload = {
      ...data,
      user_id: user.id,
      date_given: data.date_given || null,
      expiry_date: data.expiry_date || null,
      lot_number: data.lot_number || null,
      administered_by: data.administered_by || null,
    }

    const { error } = isEdit
      ? await supabase.from('vaccines').update(payload).eq('id', vaccine.id)
      : await supabase.from('vaccines').insert(payload)

    setSaving(false)
    if (!error) onSaved()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-navy/40 backdrop-blur-sm" onClick={onClose} />

      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-surface-border flex-shrink-0">
          <h2 className="text-base font-bold text-navy">
            {isEdit ? 'Edit Vaccine Record' : 'Log Vaccine'}
          </h2>
          <button onClick={onClose} className="btn-ghost p-1.5 rounded-lg">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col flex-1 overflow-hidden">
          <div className="overflow-y-auto px-6 py-4 space-y-4">

            <SectionHeading>Pet</SectionHeading>

            {/* Client picker to narrow pet list */}
            <div>
              <label className="label">Client</label>
              <select
                className="input"
                value={clientId}
                onChange={e => { setClientId(e.target.value); setValue('pet_id', '') }}
              >
                <option value="">Select a client…</option>
                {clients.map(c => (
                  <option key={c.id} value={c.id}>{c.first_name} {c.last_name}</option>
                ))}
              </select>
            </div>

            <Field label="Pet *" error={errors.pet_id?.message}>
              <select
                className={cn('input', errors.pet_id && 'border-red-400')}
                {...register('pet_id')}
                disabled={!clientId}
              >
                <option value="">{clientId ? 'Select a pet…' : 'Choose a client first'}</option>
                {pets.map(p => (
                  <option key={p.id} value={p.id}>{p.name} ({p.species})</option>
                ))}
              </select>
            </Field>

            <SectionHeading>Vaccine</SectionHeading>

            {!customVaccine ? (
              <Field label="Vaccine Name *" error={errors.vaccine_name?.message}>
                <select
                  className={cn('input', errors.vaccine_name && 'border-red-400')}
                  {...register('vaccine_name')}
                  autoFocus
                >
                  <option value="">Select a vaccine…</option>
                  {COMMON_VACCINES.map(v => (
                    <option key={v} value={v}>{v}</option>
                  ))}
                </select>
              </Field>
            ) : (
              <Field label="Vaccine Name *" error={errors.vaccine_name?.message}>
                <div className="flex gap-2">
                  <input
                    className={cn('input flex-1', errors.vaccine_name && 'border-red-400')}
                    placeholder="Enter vaccine name…"
                    {...register('vaccine_name')}
                    autoFocus
                  />
                  <button
                    type="button"
                    className="btn-ghost text-xs px-3 border border-surface-border rounded-lg"
                    onClick={() => { setCustomVaccine(false); setValue('vaccine_name', '') }}
                  >
                    List
                  </button>
                </div>
              </Field>
            )}

            <SectionHeading>Dates</SectionHeading>

            <div className="grid grid-cols-2 gap-4">
              <Field label="Date Given">
                <input className="input" type="date" {...register('date_given')} />
              </Field>
              <Field label="Expiry / Due Date">
                <input className="input" type="date" {...register('expiry_date')} />
              </Field>
            </div>

            <SectionHeading>Details</SectionHeading>

            <div className="grid grid-cols-2 gap-4">
              <Field label="Lot Number">
                <input className="input" placeholder="ABC123" {...register('lot_number')} />
              </Field>
              <Field label="Administered By">
                <input className="input" placeholder="Dr. Smith / Owner" {...register('administered_by')} />
              </Field>
            </div>

            <Field label="Notes">
              <textarea
                className="input resize-none"
                rows={2}
                placeholder="Any additional notes…"
                {...register('notes')}
              />
            </Field>
          </div>

          <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-surface-border flex-shrink-0">
            <button type="button" onClick={onClose} className="btn-outline">Cancel</button>
            <button
              type="submit"
              className={cn('btn-primary', saving && 'opacity-70 pointer-events-none')}
            >
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              {saving ? 'Saving…' : isEdit ? 'Save Changes' : 'Log Vaccine'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
