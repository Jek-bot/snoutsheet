import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const GOOGLE_CLIENT_ID = Deno.env.get('GOOGLE_CLIENT_ID')!
const GOOGLE_CLIENT_SECRET = Deno.env.get('GOOGLE_CLIENT_SECRET')!
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

async function getAccessToken(refreshToken: string): Promise<string> {
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: GOOGLE_CLIENT_ID,
      client_secret: GOOGLE_CLIENT_SECRET,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    }),
  })
  const data = await res.json()
  if (!data.access_token) throw new Error('Failed to refresh access token')
  return data.access_token
}

function buildEvent(booking: any): any {
  const clientName = booking.clients
    ? `${booking.clients.first_name} ${booking.clients.last_name}`
    : 'Client'
  const serviceName = booking.services?.name ?? 'Pet Sitting'
  const pets = booking.booking_pets?.map((bp: any) => bp.pets?.name).filter(Boolean).join(', ')

  return {
    summary: `${serviceName} — ${clientName}${pets ? ` (${pets})` : ''}`,
    description: [
      pets ? `Pets: ${pets}` : null,
      booking.notes ? `Notes: ${booking.notes}` : null,
      `Status: ${booking.status}`,
      booking.price ? `Price: $${booking.price}` : null,
    ].filter(Boolean).join('\n'),
    start: booking.all_day
      ? { date: booking.start_date.split('T')[0] }
      : { dateTime: booking.start_date, timeZone: 'UTC' },
    end: booking.all_day
      ? { date: booking.end_date.split('T')[0] }
      : { dateTime: booking.end_date, timeZone: 'UTC' },
    colorId: booking.status === 'confirmed' ? '2' : booking.status === 'active' ? '5' : '8',
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { action, booking_id, user_id } = await req.json()

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

    // Get user settings (tokens + calendar id)
    const { data: settings } = await supabase
      .from('settings')
      .select('gcal_connected, gcal_calendar_id, gcal_refresh_token')
      .eq('user_id', user_id)
      .single()

    if (!settings?.gcal_connected || !settings?.gcal_refresh_token) {
      return new Response(JSON.stringify({ skipped: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const accessToken = await getAccessToken(settings.gcal_refresh_token)
    const calendarId = encodeURIComponent(settings.gcal_calendar_id ?? 'primary')
    const baseUrl = `https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events`

    // Delete action
    if (action === 'delete') {
      const { data: booking } = await supabase
        .from('bookings')
        .select('gcal_event_id')
        .eq('id', booking_id)
        .single()

      if (booking?.gcal_event_id) {
        await fetch(`${baseUrl}/${booking.gcal_event_id}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${accessToken}` },
        })
        await supabase.from('bookings').update({ gcal_event_id: null }).eq('id', booking_id)
      }
      return new Response(JSON.stringify({ ok: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Fetch full booking for create/update
    const { data: booking } = await supabase
      .from('bookings')
      .select('*, clients(first_name,last_name), services(name), booking_pets(pets(name))')
      .eq('id', booking_id)
      .single()

    if (!booking) throw new Error('Booking not found')

    // Only sync confirmed/active bookings
    if (!['confirmed', 'active'].includes(booking.status)) {
      // If it was synced before but status changed, remove from calendar
      if (booking.gcal_event_id) {
        await fetch(`${baseUrl}/${booking.gcal_event_id}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${accessToken}` },
        })
        await supabase.from('bookings').update({ gcal_event_id: null }).eq('id', booking_id)
      }
      return new Response(JSON.stringify({ skipped: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const event = buildEvent(booking)

    let gcalEventId = booking.gcal_event_id
    if (gcalEventId) {
      // Update existing event
      await fetch(`${baseUrl}/${gcalEventId}`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(event),
      })
    } else {
      // Create new event
      const res = await fetch(baseUrl, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(event),
      })
      const created = await res.json()
      gcalEventId = created.id
      await supabase.from('bookings').update({ gcal_event_id: gcalEventId }).eq('id', booking_id)
    }

    return new Response(JSON.stringify({ ok: true, gcal_event_id: gcalEventId }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    console.error('calendar-sync error:', err)
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
