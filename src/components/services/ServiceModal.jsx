import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { X, Loader2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/context/AuthContext'
import { cn } from '@/lib/utils'

const schema = z.object({
  name: z.string().min(1, 'Service name is required'),
  description: z.string().optional(),
  duration_minutes: z.string().optional(),
  base_price: z.string().min(1, 'Price is required'),
  active: z.boolean().optional(),
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

const DURATION_PRESETS = [
  { label: 'Custom', value: '' },
  { label: '30 min', value: '30' },
  { label: '60 min', value: '60' },
  { label: '90 min', value: '90' },
  { label: 'Half day (4 hr)', value: '240' },
  { label: 'Full day (8 hr)', value: '480' },
  { label: 'Overnight (24 hr)', value: '1440' },
  { label: 'Multi-night (48 hr)', value: '2880' },
]

export default function ServiceModal({ service = null, onClose, onSaved }) {
  const { user } = useAuth()
  const [saving, setSaving] = useState(false)
  const isEdit = Boolean(service)

  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      name: service?.name ?? '',
      description: service?.description ?? '',
      duration_minutes: service?.duration_minutes?.toString() ?? '',
      base_price: service?.base_price?.toString() ?? '',
      active: service?.active ?? true,
    },
  })

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
      base_price: parseFloat(data.base_price),
      duration_minutes: data.duration_minutes ? parseInt(data.duration_minutes) : null,
      active: Boolean(data.active),
    }

    const { error } = isEdit
      ? await supabase.from('services').update(payload).eq('id', service.id)
      : await supabase.from('services').insert(payload)

    setSaving(false)
    if (!error) onSaved()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-navy/40 backdrop-blur-sm" onClick={onClose} />

      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-surface-border">
          <h2 className="text-base font-bold text-navy">
            {isEdit ? 'Edit Service' : 'Add Service'}
          </h2>
          <button onClick={onClose} className="btn-ghost p-1.5 rounded-lg">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="px-6 py-4 space-y-4">
            <Field label="Service Name *" error={errors.name?.message}>
              <input
                className={cn('input', errors.name && 'border-red-400')}
                {...register('name')}
                placeholder="Overnight Stay"
                autoFocus
              />
            </Field>

            <Field label="Description">
              <textarea
                className="input resize-none"
                rows={2}
                {...register('description')}
                placeholder="What's included in this service…"
              />
            </Field>

            <div className="grid grid-cols-2 gap-4">
              <Field label="Base Price ($) *" error={errors.base_price?.message}>
                <input
                  className={cn('input', errors.base_price && 'border-red-400')}
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="75.00"
                  {...register('base_price')}
                />
              </Field>

              <Field label="Duration">
                <select className="input" {...register('duration_minutes')}>
                  {DURATION_PRESETS.map(p => (
                    <option key={p.value} value={p.value}>{p.label}</option>
                  ))}
                </select>
              </Field>
            </div>

            <div className="flex items-center gap-3">
              <input
                id="active"
                type="checkbox"
                className="w-4 h-4 rounded border-surface-border accent-teal"
                {...register('active')}
              />
              <label htmlFor="active" className="text-sm font-medium text-navy cursor-pointer">
                Active (available in booking form)
              </label>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-surface-border">
            <button type="button" onClick={onClose} className="btn-outline">Cancel</button>
            <button
              type="submit"
              className={cn('btn-primary', saving && 'opacity-70 pointer-events-none')}
            >
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              {saving ? 'Saving…' : isEdit ? 'Save Changes' : 'Add Service'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
