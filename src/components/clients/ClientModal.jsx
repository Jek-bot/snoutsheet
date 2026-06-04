import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { X, Loader2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/context/AuthContext'
import { cn } from '@/lib/utils'

const schema = z.object({
  first_name: z.string().min(1, 'First name is required'),
  last_name: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid email').or(z.literal('')).optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zip: z.string().optional(),
  notes: z.string().optional(),
  emergency_contact_name: z.string().optional(),
  emergency_contact_phone: z.string().optional(),
  vet_name: z.string().optional(),
  vet_phone: z.string().optional(),
  vet_address: z.string().optional(),
  vet_preferred_dr: z.string().optional(),
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

export default function ClientModal({ client = null, onClose, onSaved }) {
  const { user } = useAuth()
  const [saving, setSaving] = useState(false)
  const isEdit = Boolean(client)

  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      first_name: client?.first_name ?? '',
      last_name: client?.last_name ?? '',
      email: client?.email ?? '',
      phone: client?.phone ?? '',
      address: client?.address ?? '',
      city: client?.city ?? '',
      state: client?.state ?? '',
      zip: client?.zip ?? '',
      notes: client?.notes ?? '',
      emergency_contact_name: client?.emergency_contact_name ?? '',
      emergency_contact_phone: client?.emergency_contact_phone ?? '',
      vet_name: client?.vet_name ?? '',
      vet_phone: client?.vet_phone ?? '',
      vet_address: client?.vet_address ?? '',
      vet_preferred_dr: client?.vet_preferred_dr ?? '',
    },
  })

  // Close on Escape
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  async function onSubmit(data) {
    setSaving(true)
    const payload = { ...data, user_id: user.id }

    const { error } = isEdit
      ? await supabase.from('clients').update(payload).eq('id', client.id)
      : await supabase.from('clients').insert(payload)

    setSaving(false)
    if (!error) onSaved()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-navy/40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-surface-border flex-shrink-0">
          <h2 className="text-base font-bold text-navy">
            {isEdit ? 'Edit Client' : 'Add Client'}
          </h2>
          <button onClick={onClose} className="btn-ghost p-1.5 rounded-lg">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable body */}
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col flex-1 overflow-hidden">
          <div className="overflow-y-auto px-6 py-4 space-y-4">

            <SectionHeading>Basic Info</SectionHeading>

            <div className="grid grid-cols-2 gap-4">
              <Field label="First Name *" error={errors.first_name?.message}>
                <input className={cn('input', errors.first_name && 'border-red-400 focus:ring-red-400')}
                  {...register('first_name')} placeholder="Jane" autoFocus />
              </Field>
              <Field label="Last Name *" error={errors.last_name?.message}>
                <input className={cn('input', errors.last_name && 'border-red-400 focus:ring-red-400')}
                  {...register('last_name')} placeholder="Smith" />
              </Field>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Field label="Email" error={errors.email?.message}>
                <input className={cn('input', errors.email && 'border-red-400 focus:ring-red-400')}
                  type="email" {...register('email')} placeholder="jane@example.com" />
              </Field>
              <Field label="Phone">
                <input className="input" {...register('phone')} placeholder="(555) 000-0000" />
              </Field>
            </div>

            <SectionHeading>Address</SectionHeading>

            <Field label="Street Address">
              <input className="input" {...register('address')} placeholder="123 Main St" />
            </Field>

            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-1">
                <Field label="City">
                  <input className="input" {...register('city')} placeholder="City" />
                </Field>
              </div>
              <Field label="State">
                <input className="input" {...register('state')} placeholder="TX" maxLength={2} />
              </Field>
              <Field label="ZIP">
                <input className="input" {...register('zip')} placeholder="78701" />
              </Field>
            </div>

            <SectionHeading>Emergency Contact</SectionHeading>

            <div className="grid grid-cols-2 gap-4">
              <Field label="Name">
                <input className="input" {...register('emergency_contact_name')} placeholder="John Smith" />
              </Field>
              <Field label="Phone">
                <input className="input" {...register('emergency_contact_phone')} placeholder="(555) 000-0001" />
              </Field>
            </div>

            <SectionHeading>Veterinarian</SectionHeading>

            <div className="grid grid-cols-2 gap-4">
              <Field label="Vet / Clinic Name">
                <input className="input" {...register('vet_name')} placeholder="Happy Paws Vet" />
              </Field>
              <Field label="Vet Phone">
                <input className="input" {...register('vet_phone')} placeholder="(555) 000-0002" />
              </Field>
            </div>

            <Field label="Preferred Dr.">
              <input className="input" {...register('vet_preferred_dr')} placeholder="Dr. Smith" />
            </Field>

            <Field label="Vet Address">
              <input className="input" {...register('vet_address')} placeholder="456 Vet Ave, City, ST" />
            </Field>

            <SectionHeading>Notes</SectionHeading>

            <Field label="Internal Notes">
              <textarea
                className="input resize-none"
                rows={3}
                {...register('notes')}
                placeholder="Any notes about this client…"
              />
            </Field>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-surface-border flex-shrink-0">
            <button type="button" onClick={onClose} className="btn-outline">
              Cancel
            </button>
            <button
              type="submit"
              className={cn('btn-primary', saving && 'opacity-70 pointer-events-none')}
            >
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              {saving ? 'Saving…' : isEdit ? 'Save Changes' : 'Add Client'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
