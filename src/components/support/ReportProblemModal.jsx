import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { X, Loader2, CheckCircle, LifeBuoy } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/context/AuthContext'
import { lastSentryEventId } from '@/lib/sentry'
import { cn } from '@/lib/utils'

const CATEGORIES = [
  'Bug',
  'Error message',
  'Calendar sync',
  'Login & access',
  'Billing',
  'Feature request',
  'Other',
]

const schema = z.object({
  category: z.string().min(1),
  subject: z.string().min(1, 'Add a short subject'),
  message: z.string().min(1, 'Describe what happened'),
  expected: z.string().optional(),
  severity: z.string().optional(),
  error_text: z.string().optional(),
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

/** Context we attach automatically so the user doesn't have to describe it. */
function gatherDiagnostics() {
  return {
    page_url: window.location.href,
    user_agent: navigator.userAgent,
    app_meta: {
      route: window.location.pathname,
      viewport: `${window.innerWidth}×${window.innerHeight}`,
      screen: `${window.screen.width}×${window.screen.height}`,
      mode: import.meta.env.MODE,
      language: navigator.language,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      sentry_event_id: lastSentryEventId(),
      submitted_at: new Date().toISOString(),
    },
  }
}

export default function ReportProblemModal({ onClose }) {
  const { user } = useAuth()
  const [saving, setSaving] = useState(false)
  const [sent, setSent] = useState(false)
  const [submitError, setSubmitError] = useState('')

  const { register, handleSubmit, watch, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { category: 'Bug', subject: '', message: '', expected: '', severity: '', error_text: '' },
  })

  const category = watch('category')

  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  async function onSubmit(data) {
    setSaving(true)
    setSubmitError('')
    const diag = gatherDiagnostics()
    const { error } = await supabase.from('support_tickets').insert({
      user_id: user.id,
      user_email: user.email,
      category: data.category,
      subject: data.subject,
      message: data.message,
      expected: data.expected || null,
      severity: data.severity || null,
      error_text: data.category === 'Error message' ? (data.error_text || null) : null,
      page_url: diag.page_url,
      user_agent: diag.user_agent,
      app_meta: diag.app_meta,
    })
    setSaving(false)
    if (error) { setSubmitError(error.message); return }
    setSent(true)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-navy/40 backdrop-blur-sm" onClick={onClose} />

      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-surface-border flex-shrink-0">
          <h2 className="text-base font-bold text-navy flex items-center gap-2">
            <LifeBuoy className="w-4 h-4 text-teal" /> Report a problem
          </h2>
          <button onClick={onClose} className="btn-ghost p-1.5 rounded-lg" aria-label="Close">
            <X className="w-4 h-4" />
          </button>
        </div>

        {sent ? (
          <div className="px-6 py-10 text-center">
            <div className="w-12 h-12 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-6 h-6 text-green-500" />
            </div>
            <h3 className="text-base font-bold text-navy mb-1">Thanks — report sent</h3>
            <p className="text-sm text-navy-300 mb-6">
              We've received your report and will take a look. You can close this window.
            </p>
            <button onClick={onClose} className="btn-primary mx-auto">Done</button>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col flex-1 overflow-hidden">
            <div className="overflow-y-auto px-6 py-4 space-y-4">
              <Field label="Issue type">
                <select className="input" {...register('category')}>
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </Field>

              <Field label="Subject *" error={errors.subject?.message}>
                <input
                  className={cn('input', errors.subject && 'border-red-400 focus:ring-red-400')}
                  {...register('subject')}
                  placeholder="Brief summary of the problem"
                  autoFocus
                />
              </Field>

              <Field label="What happened? *" error={errors.message?.message}>
                <textarea
                  className={cn('input resize-none', errors.message && 'border-red-400 focus:ring-red-400')}
                  rows={4}
                  {...register('message')}
                  placeholder="Tell us what you were doing and what went wrong…"
                />
              </Field>

              {category === 'Error message' && (
                <Field label="Error text">
                  <textarea
                    className="input resize-none font-mono text-xs"
                    rows={3}
                    {...register('error_text')}
                    placeholder="Copy and paste any error message or code you saw"
                  />
                </Field>
              )}

              <Field label="What did you expect to happen?">
                <textarea
                  className="input resize-none"
                  rows={2}
                  {...register('expected')}
                  placeholder="Optional"
                />
              </Field>

              <Field label="Severity">
                <select className="input" {...register('severity')}>
                  <option value="">Not sure</option>
                  <option value="Workaround exists">I can work around it</option>
                  <option value="Blocking me">It's blocking me</option>
                </select>
              </Field>

              <p className="text-xs text-navy-300 leading-relaxed">
                To help us debug, this report also includes technical details: the page
                you're on, your browser, screen size, and a diagnostic reference. No client
                or pet data is included.
              </p>

              {submitError && (
                <div className="bg-red-50 text-red-600 rounded-xl px-4 py-3 text-sm">
                  Couldn't send report: {submitError}
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-surface-border flex-shrink-0">
              <button type="button" onClick={onClose} className="btn-outline">Cancel</button>
              <button
                type="submit"
                className={cn('btn-primary', saving && 'opacity-70 pointer-events-none')}
              >
                {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                {saving ? 'Sending…' : 'Send report'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
