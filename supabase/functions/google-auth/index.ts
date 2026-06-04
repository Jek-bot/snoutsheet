import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const GOOGLE_CLIENT_ID = Deno.env.get('GOOGLE_CLIENT_ID')!
const GOOGLE_CLIENT_SECRET = Deno.env.get('GOOGLE_CLIENT_SECRET')!
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const APP_URL = Deno.env.get('APP_URL') ?? 'https://snoutsheet.vercel.app'
const REDIRECT_URI = `${APP_URL}/auth/google/callback`

serve(async (req) => {
  const url = new URL(req.url)
  const code = url.searchParams.get('code')
  const state = url.searchParams.get('state') // contains the user_id

  if (!code || !state) {
    return Response.redirect(`${APP_URL}/settings?gcal_error=missing_params`)
  }

  try {
    // Exchange code for tokens
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: GOOGLE_CLIENT_ID,
        client_secret: GOOGLE_CLIENT_SECRET,
        redirect_uri: REDIRECT_URI,
        grant_type: 'authorization_code',
      }),
    })

    const tokens = await tokenRes.json()

    if (!tokens.refresh_token) {
      return Response.redirect(`${APP_URL}/settings?gcal_error=no_refresh_token`)
    }

    // Get the user's primary calendar ID
    const calRes = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary', {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    })
    const cal = await calRes.json()

    // Store tokens in settings
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
    await supabase
      .from('settings')
      .upsert({
        user_id: state,
        gcal_connected: true,
        gcal_calendar_id: cal.id ?? 'primary',
        gcal_refresh_token: tokens.refresh_token,
      })

    return Response.redirect(`${APP_URL}/settings?gcal_success=1`)
  } catch (err) {
    console.error('google-auth error:', err)
    return Response.redirect(`${APP_URL}/settings?gcal_error=server_error`)
  }
})
