import { useEffect, useState } from 'react'
import { LifeBuoy, ChevronDown, ChevronUp } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { formatDate } from '@/lib/utils'
import { cn } from '@/lib/utils'

const STATUSES = ['new', 'in_progress', 'resolved']
const STATUS_LABEL = { new: 'New', in_progress: 'In progress', resolved: 'Resolved' }
const STATUS_BADGE = { new: 'badge-yellow', in_progress: 'badge-navy', resolved: 'badge-teal' }

function TicketCard({ ticket, onStatus }) {
  const [open, setOpen] = useState(false)
  const meta = ticket.app_meta ?? {}

  return (
    <div className="border border-surface-border rounded-xl bg-white overflow-hidden">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-start gap-3 px-4 py-3 text-left hover:bg-surface/50 transition-colors"
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="badge badge-gray">{ticket.category}</span>
            {ticket.severity && <span className="text-xs text-navy-300">{ticket.severity}</span>}
            <span className={cn('badge', STATUS_BADGE[ticket.status] ?? 'badge-gray')}>
              {STATUS_LABEL[ticket.status] ?? ticket.status}
            </span>
          </div>
          <p className="text-sm font-semibold text-navy mt-1 truncate">{ticket.subject}</p>
          <p className="text-xs text-navy-300 mt-0.5">
            {ticket.user_email} · {formatDate(ticket.created_at)}
          </p>
        </div>
        {open ? <ChevronUp className="w-4 h-4 text-navy-300 mt-1" /> : <ChevronDown className="w-4 h-4 text-navy-300 mt-1" />}
      </button>

      {open && (
        <div className="px-4 pb-4 pt-1 space-y-3 border-t border-surface-border">
          <div>
            <p className="text-xs font-bold text-navy-300 uppercase tracking-widest mb-1">What happened</p>
            <p className="text-sm text-navy whitespace-pre-wrap">{ticket.message}</p>
          </div>

          {ticket.expected && (
            <div>
              <p className="text-xs font-bold text-navy-300 uppercase tracking-widest mb-1">Expected</p>
              <p className="text-sm text-navy whitespace-pre-wrap">{ticket.expected}</p>
            </div>
          )}

          {ticket.error_text && (
            <div>
              <p className="text-xs font-bold text-navy-300 uppercase tracking-widest mb-1">Error text</p>
              <pre className="text-xs bg-surface rounded-lg p-3 overflow-auto whitespace-pre-wrap">{ticket.error_text}</pre>
            </div>
          )}

          <div>
            <p className="text-xs font-bold text-navy-300 uppercase tracking-widest mb-1">Diagnostics</p>
            <dl className="text-xs text-navy-300 space-y-0.5">
              {ticket.page_url && <div><span className="text-navy-400">Page:</span> {ticket.page_url}</div>}
              {meta.sentry_event_id && <div><span className="text-navy-400">Sentry ID:</span> {meta.sentry_event_id}</div>}
              {meta.viewport && <div><span className="text-navy-400">Viewport:</span> {meta.viewport} · {meta.mode}</div>}
              {ticket.user_agent && <div className="truncate"><span className="text-navy-400">Browser:</span> {ticket.user_agent}</div>}
            </dl>
          </div>

          <div className="flex items-center gap-2 pt-1">
            <span className="text-xs text-navy-300 mr-1">Set status:</span>
            {STATUSES.map(s => (
              <button
                key={s}
                onClick={() => onStatus(ticket, s)}
                disabled={ticket.status === s}
                className={cn(
                  'text-xs font-semibold px-3 py-1.5 rounded-lg border transition-colors',
                  ticket.status === s
                    ? 'border-teal/30 text-teal bg-teal/5 cursor-default'
                    : 'border-surface-border text-navy-300 hover:bg-surface'
                )}
              >
                {STATUS_LABEL[s]}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default function SupportInbox() {
  const [tickets, setTickets] = useState([])
  const [loading, setLoading] = useState(true)
  const [showResolved, setShowResolved] = useState(false)

  useEffect(() => {
    supabase
      .from('support_tickets')
      .select('*')
      .order('created_at', { ascending: false })
      .then(({ data }) => { setTickets(data ?? []); setLoading(false) })
  }, [])

  async function setStatus(ticket, status) {
    await supabase.from('support_tickets').update({ status }).eq('id', ticket.id)
    setTickets(prev => prev.map(t => t.id === ticket.id ? { ...t, status } : t))
  }

  const visible = showResolved ? tickets : tickets.filter(t => t.status !== 'resolved')
  const openCount = tickets.filter(t => t.status !== 'resolved').length

  return (
    <div className="mt-8">
      <div className="flex items-center justify-between mb-3">
        <h2 className="page-title text-lg flex items-center gap-2">
          <LifeBuoy className="w-4 h-4 text-teal" /> Support
          {openCount > 0 && <span className="badge badge-yellow">{openCount} open</span>}
        </h2>
        <label className="flex items-center gap-2 text-xs text-navy-300 cursor-pointer">
          <input type="checkbox" checked={showResolved} onChange={e => setShowResolved(e.target.checked)} />
          Show resolved
        </label>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[...Array(2)].map((_, i) => <div key={i} className="h-16 bg-white rounded-xl animate-pulse" />)}
        </div>
      ) : visible.length === 0 ? (
        <div className="card p-8 text-center">
          <p className="text-sm text-navy-300">No {showResolved ? '' : 'open '}support reports.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {visible.map(t => <TicketCard key={t.id} ticket={t} onStatus={setStatus} />)}
        </div>
      )}
    </div>
  )
}
