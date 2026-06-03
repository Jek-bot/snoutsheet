import { useEffect, useState } from 'react'
import { ChevronLeft, ChevronRight, CalendarRange } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/context/AuthContext'
import { cn } from '@/lib/utils'

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December']

const STATUS_DOT = {
  inquiry: 'bg-yellow-400',
  confirmed: 'bg-teal',
  active: 'bg-green-400',
  completed: 'bg-gray-300',
  cancelled: 'bg-red-400',
}

function getCalendarDays(year, month) {
  const first = new Date(year, month, 1)
  const last = new Date(year, month + 1, 0)
  const days = []
  for (let i = 0; i < first.getDay(); i++) days.push(null)
  for (let d = 1; d <= last.getDate(); d++) days.push(new Date(year, month, d))
  return days
}

export default function Schedule() {
  const { user } = useAuth()
  const today = new Date()
  const [year, setYear] = useState(today.getFullYear())
  const [month, setMonth] = useState(today.getMonth())
  const [bookings, setBookings] = useState([])

  useEffect(() => {
    if (!user) return
    const start = new Date(year, month, 1).toISOString()
    const end = new Date(year, month + 1, 0, 23, 59, 59).toISOString()
    supabase
      .from('bookings')
      .select('*, clients(first_name,last_name), services(name)')
      .eq('user_id', user.id)
      .lte('start_date', end)
      .gte('end_date', start)
      .then(({ data }) => setBookings(data ?? []))
  }, [user, year, month])

  function bookingsOnDay(date) {
    if (!date) return []
    return bookings.filter(b => {
      const s = new Date(b.start_date)
      const e = new Date(b.end_date)
      return date >= new Date(s.getFullYear(), s.getMonth(), s.getDate()) &&
        date <= new Date(e.getFullYear(), e.getMonth(), e.getDate())
    })
  }

  function prev() {
    if (month === 0) { setYear(y => y - 1); setMonth(11) }
    else setMonth(m => m - 1)
  }
  function next() {
    if (month === 11) { setYear(y => y + 1); setMonth(0) }
    else setMonth(m => m + 1)
  }

  const days = getCalendarDays(year, month)

  return (
    <div className="max-w-4xl mx-auto">
      <div className="page-header">
        <h1 className="page-title">Schedule</h1>
      </div>

      <div className="card p-5">
        {/* Month nav */}
        <div className="flex items-center justify-between mb-5">
          <button onClick={prev} className="btn-ghost p-2 rounded-lg">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <h2 className="text-base font-bold text-navy">{MONTHS[month]} {year}</h2>
          <button onClick={next} className="btn-ghost p-2 rounded-lg">
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Day headers */}
        <div className="grid grid-cols-7 mb-2">
          {DAYS.map(d => (
            <div key={d} className="text-center text-xs font-semibold text-navy-300 py-1">{d}</div>
          ))}
        </div>

        {/* Days grid */}
        <div className="grid grid-cols-7 gap-1">
          {days.map((date, i) => {
            const dayBookings = bookingsOnDay(date)
            const isToday = date && date.toDateString() === today.toDateString()
            return (
              <div
                key={i}
                className={cn(
                  'min-h-[80px] rounded-xl p-1.5 border transition-colors',
                  date ? 'bg-white border-surface-border hover:border-teal-200' : 'bg-transparent border-transparent',
                  isToday && 'border-teal bg-teal-50'
                )}
              >
                {date && (
                  <>
                    <p className={cn(
                      'text-xs font-semibold mb-1 w-6 h-6 flex items-center justify-center rounded-full',
                      isToday ? 'bg-teal text-navy' : 'text-navy-400'
                    )}>
                      {date.getDate()}
                    </p>
                    <div className="space-y-0.5">
                      {dayBookings.slice(0, 2).map(b => (
                        <div key={b.id} className="flex items-center gap-1">
                          <div className={cn('w-1.5 h-1.5 rounded-full flex-shrink-0', STATUS_DOT[b.status] ?? 'bg-gray-300')} />
                          <p className="text-xs text-navy truncate leading-tight">
                            {b.clients?.first_name}
                          </p>
                        </div>
                      ))}
                      {dayBookings.length > 2 && (
                        <p className="text-xs text-navy-300">+{dayBookings.length - 2}</p>
                      )}
                    </div>
                  </>
                )}
              </div>
            )
          })}
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 mt-4 pt-4 border-t border-surface-border flex-wrap">
          {Object.entries(STATUS_DOT).map(([status, color]) => (
            <div key={status} className="flex items-center gap-1.5">
              <div className={cn('w-2 h-2 rounded-full', color)} />
              <span className="text-xs text-navy-300 capitalize">{status}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
