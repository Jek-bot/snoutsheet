import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { user_id } = await req.json()
    if (!user_id) throw new Error('Missing user_id')

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

    // Look up the stored refresh token so we can revoke the grant at Google.
    const { data: settings } = await supabase
      .from('settings')
      .select('gcal_refresh_token')
      .eq('user_id', user_id)
      .single()

    let revoked = false
    const token = settings?.gcal_refresh_token
    if (token) {
      // Revoking the refresh token revokes the whole grant — this is what
      // removes the app from the user's Google Account permissions page.
      const res = await fetch('https://oauth2.googleapis.com/revoke', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ token }),
      })
      revoked = res.ok
      if (!res.ok) {
        // 400 usually means the token was already invalid/revoked — still safe
        // to clear our side, but log it so real failures are visible.
        console.error('google revoke failed:', res.status, await res.text())
      }
    }

    // Clear the local connection regardless, so the app reflects disconnected.
    const { error: updateError } = await supabase
      .from('settings')
      .update({
        gcal_connected: false,
        gcal_calendar_id: null,
        gcal_refresh_token: null,
      })
      .eq('user_id', user_id)

    if (updateError) throw updateError

    return new Response(JSON.stringify({ ok: true, revoked }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    console.error('google-disconnect error:', err)
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
