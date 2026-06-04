import { supabase } from './supabase'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL

export async function syncBookingToCalendar(bookingId, userId, action = 'upsert') {
  try {
    const { data, error } = await supabase.functions.invoke('calendar-sync', {
      body: { booking_id: bookingId, user_id: userId, action },
    })
    if (error) console.warn('Calendar sync error:', error)
    return data
  } catch (err) {
    console.warn('Calendar sync failed (non-blocking):', err)
  }
}

const EDGE_FUNCTION_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/google-auth`

export function buildGoogleAuthUrl(userId) {
  const params = new URLSearchParams({
    client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
    redirect_uri: EDGE_FUNCTION_URL,
    response_type: 'code',
    scope: 'https://www.googleapis.com/auth/calendar.events',
    access_type: 'offline',
    prompt: 'consent',
    state: userId,
  })
  return `https://accounts.google.com/o/oauth2/v2/auth?${params}`
}
