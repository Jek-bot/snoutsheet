import { useEffect, useState } from 'react'
import { useEffect as useEffectSettings } from 'react'
import { Save, Link2, CheckCircle, Plus, Pencil, Trash2, Clock, UserCheck, UserX } from 'lucide-react'
import { useSearchParams } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/context/AuthContext'
import { formatCurrency, formatDate } from '@/lib/utils'
import { cn } from '@/lib/utils'
import ServiceModal from '@/components/services/ServiceModal'
import { buildGoogleAuthUrl } from '@/lib/calendarSync'

function Section({ title, children, action }) {
  return (
    <div className="card p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="section-title mb-0">{title}</h2>
        {action}
      </div>
      {children}
    </div>
  )
}

function Field({ label, children }) {
  return (
    <div>
      <label className="label">{label}</label>
      {children}
    </div>
  )
}

function formatDuration(minutes) {
  if (!minutes) return null
  if (minutes < 60) return `${minutes} min`
  if (minutes === 1440) return 'Overnight'
  if (minutes % 60 === 0) return `${minutes / 60} hr`
  return `${Math.floor(minutes / 60)}h ${minutes % 60}m`
}

function ServiceRow({ service, onEdit, onDelete }) {
  return (
    <div className={cn(
      'flex items-center gap-3 p-3 rounded-xl border transition-colors',
      service.active ? 'border-surface-border bg-white' : 'border-surface-border bg-surface opacity-60'
    )}>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-sm font-semibold text-navy">{service.name}</p>
          {!service.active && (
            <span className="badge badge-gray">Inactive</span>
          )}
        </div>
        <div className="flex items-center gap-3 mt-0.5">
          <p className="text-xs text-navy-300">{formatCurrency(service.base_price)}</p>
          {service.duration_minutes && (
            <span className="text-xs text-navy-300 flex items-center gap-1">
              <Clock className="w-3 h-3" /> {formatDuration(service.duration_minutes)}
            </span>
          )}
          {service.description && (
            <p className="text-xs text-navy-300 truncate">{service.description}</p>
          )}
        </div>
      </div>
      <div className="flex items-center gap-1 flex-shrink-0">
        <button onClick={() => onEdit(service)} className="btn-ghost p-1.5 rounded-lg" aria-label="Edit">
          <Pencil className="w-3.5 h-3.5" />
        </button>
        <button onClick={() => onDelete(service)} className="btn-ghost p-1.5 rounded-lg text-red-400 hover:text-red-600 hover:bg-red-50" aria-label="Delete">
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  )
}

export default function Settings() {
  const { user, isAdmin } = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()
  const gcalSuccess = searchParams.get('gcal_success')
  const gcalError = searchParams.get('gcal_error')
  const [form, setForm] = useState({
    business_name: '',
    business_phone: '',
    business_email: '',
    business_address: '',
    timezone: 'America/Chicago',
    vaccine_reminder_days: 30,
    booking_reminder_days: 2,
    gcal_connected: false,
  })
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  // Services state
  const [services, setServices] = useState([])
  const [serviceModalOpen, setServiceModalOpen] = useState(false)
  const [editingService, setEditingService] = useState(null)

  // Users state (admin only)
  const [pendingUsers, setPendingUsers] = useState([])
  const [allUsers, setAllUsers] = useState([])

  useEffect(() => {
    if (!user) return
    supabase
      .from('settings')
      .select('*')
      .eq('user_id', user.id)
      .single()
      .then(({ data }) => { if (data) setForm(f => ({ ...f, ...data })) })
    loadServices()
    if (isAdmin) loadUsers()
  }, [user, isAdmin])

  // Handle gcal redirect params
  useEffectSettings(() => {
    if (gcalSuccess) {
      loadSettings()
      setSearchParams({})
    }
    if (gcalError) {
      setSearchParams({})
    }
  }, [gcalSuccess, gcalError])

  function loadSettings() {
    if (!user) return
    supabase.from('settings').select('*').eq('user_id', user.id).single()
      .then(({ data }) => { if (data) setForm(f => ({ ...f, ...data })) })
  }

  function loadServices() {
    supabase
      .from('services')
      .select('*')
      .eq('user_id', user.id)
      .order('name')
      .then(({ data }) => setServices(data ?? []))
  }

  function set(key, value) {
    setForm(f => ({ ...f, [key]: value }))
    setSaved(false)
  }

  async function save() {
    setSaving(true)
    await supabase.from('settings').upsert({ ...form, user_id: user.id }, { onConflict: 'user_id' })
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  async function loadUsers() {
    const { data } = await supabase
      .from('user_profiles_with_email')
      .select('id, approved, is_admin, created_at, email')
      .order('created_at')
    if (!data) return
    setPendingUsers(data.filter(u => !u.approved))
    setAllUsers(data.filter(u => u.approved && u.id !== user.id))
  }

  async function approveUser(id) {
    await supabase.from('user_profiles').update({ approved: true }).eq('id', id)
    loadUsers()
  }

  async function revokeUser(id) {
    if (!confirm('Revoke access for this user?')) return
    await supabase.from('user_profiles').update({ approved: false }).eq('id', id)
    loadUsers()
  }

  function openAddService() { setEditingService(null); setServiceModalOpen(true) }
  function openEditService(s) { setEditingService(s); setServiceModalOpen(true) }
  function closeServiceModal() { setServiceModalOpen(false); setEditingService(null) }
  function onServiceSaved() { closeServiceModal(); loadServices() }

  async function deleteService(service) {
    if (!confirm(`Delete "${service.name}"? Existing bookings won't be affected.`)) return
    await supabase.from('services').delete().eq('id', service.id)
    loadServices()
  }

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <div className="page-header">
        <h1 className="page-title">Settings</h1>
        <button onClick={save} className={cn('btn-primary', saving && 'opacity-70 pointer-events-none')}>
          {saved ? <CheckCircle className="w-4 h-4" /> : <Save className="w-4 h-4" />}
          {saved ? 'Saved!' : saving ? 'Saving…' : 'Save Changes'}
        </button>
      </div>

      {/* Business Info */}
      <Section title="Business Info">
        <Field label="Business Name">
          <input className="input" value={form.business_name} onChange={e => set('business_name', e.target.value)} />
        </Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Phone">
            <input className="input" value={form.business_phone} onChange={e => set('business_phone', e.target.value)} placeholder="(555) 000-0000" />
          </Field>
          <Field label="Email">
            <input className="input" type="email" value={form.business_email} onChange={e => set('business_email', e.target.value)} placeholder="you@example.com" />
          </Field>
        </div>
        <Field label="Address">
          <input className="input" value={form.business_address} onChange={e => set('business_address', e.target.value)} placeholder="123 Main St, City, ST 00000" />
        </Field>
        <Field label="Timezone">
          <select className="input" value={form.timezone} onChange={e => set('timezone', e.target.value)}>
            {[
              'America/New_York', 'America/Chicago', 'America/Denver',
              'America/Los_Angeles', 'America/Anchorage', 'Pacific/Honolulu',
            ].map(tz => (
              <option key={tz} value={tz}>
                {tz.replace('America/', '').replace('Pacific/', '').replace(/_/g, ' ')}
              </option>
            ))}
          </select>
        </Field>
      </Section>

      {/* Services */}
      <Section
        title="Services"
        action={
          <button onClick={openAddService} className="btn-teal text-sm px-3 py-1.5">
            <Plus className="w-3.5 h-3.5" /> Add Service
          </button>
        }
      >
        {services.length === 0 ? (
          <div className="text-center py-6 border border-dashed border-surface-border rounded-xl">
            <p className="text-sm text-navy-300 mb-3">No services yet — add your offerings to use them in bookings.</p>
            <button onClick={openAddService} className="btn-outline text-sm px-3 py-1.5">
              <Plus className="w-3.5 h-3.5" /> Add your first service
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            {services.map(s => (
              <ServiceRow
                key={s.id}
                service={s}
                onEdit={openEditService}
                onDelete={deleteService}
              />
            ))}
          </div>
        )}
      </Section>

      {/* Reminders */}
      <Section title="Reminders">
        <Field label="Vaccine expiry reminder (days before)">
          <input
            className="input"
            type="number"
            min={1}
            max={365}
            value={form.vaccine_reminder_days}
            onChange={e => set('vaccine_reminder_days', parseInt(e.target.value))}
          />
        </Field>
        <Field label="Booking reminder (days before)">
          <input
            className="input"
            type="number"
            min={1}
            max={30}
            value={form.booking_reminder_days}
            onChange={e => set('booking_reminder_days', parseInt(e.target.value))}
          />
        </Field>
      </Section>

      {/* Google Calendar */}
      <Section title="Google Calendar">
        {gcalSuccess && (
          <div className="flex items-center gap-2 bg-green-50 text-green-700 rounded-xl px-4 py-3 text-sm font-medium">
            <CheckCircle className="w-4 h-4 flex-shrink-0" />
            Google Calendar connected successfully!
          </div>
        )}
        {gcalError && (
          <div className="bg-red-50 text-red-600 rounded-xl px-4 py-3 text-sm">
            Connection failed ({gcalError}). Please try again.
          </div>
        )}
        <div className="flex items-center justify-between p-4 rounded-xl border border-surface-border bg-surface">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-white border border-surface-border flex items-center justify-center">
              <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none">
                <rect x="3" y="3" width="18" height="18" rx="2" fill="#4285F4" />
                <rect x="3" y="3" width="18" height="5" rx="2" fill="#1967D2" />
                <text x="12" y="16" textAnchor="middle" fill="white" fontSize="7" fontWeight="bold">G</text>
              </svg>
            </div>
            <div>
              <p className="text-sm font-semibold text-navy">Google Calendar</p>
              <p className="text-xs text-navy-300">
                {form.gcal_connected ? 'Connected — confirmed bookings sync automatically' : 'Not connected'}
              </p>
            </div>
          </div>
          {form.gcal_connected ? (
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-500" />
              <button
                onClick={async () => {
                  if (!confirm('Disconnect Google Calendar? Existing calendar events won\'t be deleted.')) return
                  await supabase.from('settings').update({
                    gcal_connected: false,
                    gcal_calendar_id: null,
                    gcal_refresh_token: null,
                  }).eq('user_id', user.id)
                  setForm(f => ({ ...f, gcal_connected: false, gcal_calendar_id: null }))
                }}
                className="btn-outline text-red-600 border-red-200 hover:bg-red-50 text-xs px-3 py-1.5"
              >
                Disconnect
              </button>
            </div>
          ) : (
            <button
              onClick={() => { window.location.href = buildGoogleAuthUrl(user.id) }}
              className="btn-outline text-xs px-3 py-1.5 flex items-center gap-1.5"
            >
              <Link2 className="w-3.5 h-3.5" /> Connect
            </button>
          )}
        </div>
        <p className="text-xs text-navy-300">
          When connected, confirmed and active bookings are automatically added to your Google Calendar and kept in sync.
        </p>
      </Section>

      {/* User Management — admin only */}
      {isAdmin && (
        <Section title="User Management">
          {pendingUsers.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-bold text-yellow-600 uppercase tracking-widest">Pending Approval ({pendingUsers.length})</p>
              {pendingUsers.map(u => (
                <div key={u.id} className="flex items-center justify-between p-3 rounded-xl border border-yellow-100 bg-yellow-50">
                  <div>
                    <p className="text-sm font-medium text-navy">{u.email}</p>
                    <p className="text-xs text-navy-300">Signed up {formatDate(u.created_at)}</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => approveUser(u.id)}
                      className="btn-teal text-xs px-3 py-1.5"
                    >
                      <UserCheck className="w-3.5 h-3.5" /> Approve
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {pendingUsers.length === 0 && allUsers.length === 0 && (
            <p className="text-sm text-navy-300">No other users yet. Share your site URL so others can sign up.</p>
          )}

          {allUsers.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-bold text-navy-300 uppercase tracking-widest">Approved Users</p>
              {allUsers.map(u => (
                <div key={u.id} className="flex items-center justify-between p-3 rounded-xl border border-surface-border bg-white">
                  <div>
                    <p className="text-sm font-medium text-navy">{u.email}</p>
                    {u.is_admin && <span className="badge badge-navy mt-0.5">Admin</span>}
                  </div>
                  <button
                    onClick={() => revokeUser(u.id)}
                    className="btn-ghost text-xs px-3 py-1.5 text-red-500 hover:bg-red-50"
                  >
                    <UserX className="w-3.5 h-3.5" /> Revoke
                  </button>
                </div>
              ))}
            </div>
          )}
        </Section>
      )}

      {/* Account */}
      <Section title="Account">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-navy">Email</p>
            <p className="text-xs text-navy-300">{user?.email}</p>
          </div>
          <button className="btn-outline text-xs px-3 py-1.5">Change Password</button>
        </div>
      </Section>

      {serviceModalOpen && (
        <ServiceModal
          service={editingService}
          onClose={closeServiceModal}
          onSaved={onServiceSaved}
        />
      )}
    </div>
  )
}
