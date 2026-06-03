import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { X, Loader2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/context/AuthContext'
import { cn } from '@/lib/utils'

const schema = z.object({
  client_id: z.string().min(1, 'Client is required'),
  service_id: z.string().optional(),
  status: z.string().min(1),
  start_date: z.string().min(1, 'Start date is required'),
  end_date: z.string().min(1, 'End date is required'),
  price: z.string().optional(),
  paid: z.boolean().optional(),
  payment_method: z.string().optional(),
  notes: z.string().optional(),
}).refine(d => !d.end_date || !d.start_date || d.end_date >= d.start_date, {
  message: 'End date must be on or after start date',
  path: ['end_date'],
})

const STATUSES = ['inquiry', 'confirmed', 'active', 'completed', 'cancelled']
const PAYMENT_METHODS = ['', 'Cash', 'Venmo', 'PayPal', 'Zelle', 'Check', 'Credit Card', 'Other']

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

export default function BookingModal({ booking = null, onClose, onSaved }) {
  const { user } = useAuth()
  const [clients, setClients] = useState([])
  const [services, setServices] = useState([])
  const [pets, setPets] = useState([])
  const [selectedPets, setSelectedPets] = useState(
    booking?._pets?.map(p => p.pet_id) ?? []
  )
  const [saving, setSaving] = useState(false)
  const isEdit = Boolean(booking)

  const toLocalDatetime = (iso) => {
    if (!iso) return ''
    const d = new Date(iso)
    const pad = n => String(n).padStart(2, '0')
    return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
  }

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      client_id: booking?.client_id ?? '',
      service_id: booking?.service_id ?? '',
      status: booking?.status ?? 'inquiry',
      start_date: toLocalDatetime(booking?.start_date),
      end_date: toLocalDatetime(booking?.end_date),
      price: booking?.price?.toString() ?? '',
      paid: booking?.paid ?? false,
      payment_method: booking?.payment_method ?? '',
      notes: booking?.notes ?? '',
    },
  })

  const clientId = watch('client_id')
  const serviceId = watch('service_id')

  // Load clients & services once
  useEffect(() => {
    Promise.all([
      supabase.from('clients').select('id,first_name,last_name').eq('user_id', user.id).order('last_name'),
      supabase.from('services').select('*').eq('user_id', user.id).eq('active', true).order('name'),
    ]).then(([{ data: c }, { data: s }]) => {
      setClients(c ?? [])
      setServices(s ?? [])
    })
  }, [user])

  // Load pets when client changes
  useEffect(() => {
    if (!clientId) { setPets([]); return }
    supabase
      .from('pets')
      .select('id,name,species')
      .eq('client_id', clientId)
      .order('name')
      .then(({ data }) => setPets(data ?? []))
  }, [clientId])

  // Auto-fill price when service changes
  useEffect(() => {
    const svc = services.find(s => s.id === serviceId)
    if (svc && !booking) setValue('price', svc.base_price.toString())
  }, [serviceId, services])

  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  function togglePet(petId) {
    setSelectedPets(prev =>
      prev.includes(petId) ? prev.filter(id => id !== petId) : [...prev, petId]
    )
  }

  async function onSubmit(data) {
    setSaving(true)
    const payload = {
      ...data,
      user_id: user.id,
      price: data.price ? parseFloat(data.price) : null,
      service_id: data.service_id || null,
      start_date: new Date(data.start_date).toISOString(),
      end_date: new Date(data.end_date).toISOString(),
      paid: Boolean(data.paid),
      payment_method: data.payment_method || null,
    }

    let bookingId = booking?.id
    if (isEdit) {
      await supabase.from('bookings').update(payload).eq('id', bookingId)
    } else {
      const { data: created } = await supabase.from('bookings').insert(payload).select('id').single()
      bookingId = created?.id
    }

    // Sync booking_pets
    if (bookingId) {
      await supabase.from('booking_pets').delete().eq('booking_id', bookingId)
      if (selectedPets.length > 0) {
        await supabase.from('booking_pets').insert(
          selectedPets.map(petId => ({ booking_id: bookingId, pet_id: petId }))
        )
      }
    }

    setSaving(false)
    onSaved()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-navy/40 backdrop-blur-sm" onClick={onClose} />

      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-surface-border flex-shrink-0">
          <h2 className="text-base font-bold text-navy">
            {isEdit ? 'Edit Booking' : 'New Booking'}
          </h2>
          <button onClick={onClose} className="btn-ghost p-1.5 rounded-lg">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col flex-1 overflow-hidden">
          <div className="overflow-y-auto px-6 py-4 space-y-4">

            <SectionHeading>Client & Service</SectionHeading>

            <Field label="Client *" error={errors.client_id?.message}>
              <select
                className={cn('input', errors.client_id && 'border-red-400')}
                {...register('client_id')}
              >
                <option value="">Select a client…</option>
                {clients.map(c => (
                  <option key={c.id} value={c.id}>{c.first_name} {c.last_name}</option>
                ))}
              </select>
            </Field>

            {/* Pet selection — shows once client chosen */}
            {clientId && (
              <div>
                <label className="label">Pets</label>
                {pets.length === 0 ? (
                  <p className="text-xs text-navy-300">No pets on file for this client</p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {pets.map(p => {
                      const selected = selectedPets.includes(p.id)
                      return (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => togglePet(p.id)}
                          className={cn(
                            'px-3 py-1.5 rounded-full text-sm font-medium border transition-all',
                            selected
                              ? 'bg-teal text-navy border-teal'
                              : 'bg-white text-navy-400 border-surface-border hover:border-teal-300'
                          )}
                        >
                          {p.name}
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>
            )}

            <Field label="Service">
              <select className="input" {...register('service_id')}>
                <option value="">No service selected</option>
                {services.map(s => (
                  <option key={s.id} value={s.id}>{s.name} — ${s.base_price}</option>
                ))}
              </select>
            </Field>

            <SectionHeading>Dates</SectionHeading>

            <div className="grid grid-cols-2 gap-4">
              <Field label="Start *" error={errors.start_date?.message}>
                <input
                  className={cn('input', errors.start_date && 'border-red-400')}
                  type="datetime-local"
                  {...register('start_date')}
                />
              </Field>
              <Field label="End *" error={errors.end_date?.message}>
                <input
                  className={cn('input', errors.end_date && 'border-red-400')}
                  type="datetime-local"
                  {...register('end_date')}
                />
              </Field>
            </div>

            <SectionHeading>Payment</SectionHeading>

            <div className="grid grid-cols-2 gap-4">
              <Field label="Price ($)">
                <input
                  className="input"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  {...register('price')}
                />
              </Field>
              <Field label="Payment Method">
                <select className="input" {...register('payment_method')}>
                  {PAYMENT_METHODS.map(m => (
                    <option key={m} value={m}>{m || 'Not specified'}</option>
                  ))}
                </select>
              </Field>
            </div>

            <div className="flex items-center gap-3">
              <input
                id="paid"
                type="checkbox"
                className="w-4 h-4 rounded border-surface-border accent-teal"
                {...register('paid')}
              />
              <label htmlFor="paid" className="text-sm font-medium text-navy cursor-pointer">
                Mark as paid
              </label>
            </div>

            <SectionHeading>Status & Notes</SectionHeading>

            <Field label="Status">
              <select className="input" {...register('status')}>
                {STATUSES.map(s => (
                  <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                ))}
              </select>
            </Field>

            <Field label="Notes">
              <textarea
                className="input resize-none"
                rows={3}
                placeholder="Special instructions, access codes, etc."
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
              {saving ? 'Saving…' : isEdit ? 'Save Changes' : 'Create Booking'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
