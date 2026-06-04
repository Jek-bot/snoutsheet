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
    const { token } = await req.json()

    if (!token) {
      return new Response(JSON.stringify({ error: 'Missing token' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

    // Look up client by portal token
    const { data: client, error } = await supabase
      .from('clients')
      .select('id, first_name, last_name, user_id')
      .eq('portal_token', token)
      .single()

    if (error || !client) {
      return new Response(JSON.stringify({ error: 'Invalid or expired link' }), {
        status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Fetch pets (safe fields only — no internal notes)
    const { data: pets } = await supabase
      .from('pets')
      .select('id, name, species, breed, color, dob, sex, altered, weight_lbs, photo_url, medical_notes')
      .eq('client_id', client.id)
      .order('name')

    // Fetch upcoming bookings (no price/payment info)
    const { data: bookings } = await supabase
      .from('bookings')
      .select(`
        id, status, start_date, end_date, all_day, notes,
        services(name),
        booking_pets(pets(name))
      `)
      .eq('client_id', client.id)
      .in('status', ['inquiry', 'confirmed', 'active'])
      .gte('end_date', new Date().toISOString())
      .order('start_date')

    // Fetch sitter business info
    const { data: settings } = await supabase
      .from('settings')
      .select('business_name, business_phone, business_email')
      .eq('user_id', client.user_id)
      .single()

    // Fetch vaccine records (expiry info only — useful for clients)
    const { data: vaccines } = await supabase
      .from('vaccines')
      .select('id, vaccine_name, expiry_date, pet_id')
      .in('pet_id', (pets ?? []).map((p: any) => p.id))
      .order('expiry_date')

    return new Response(JSON.stringify({
      client: {
        first_name: client.first_name,
        last_name: client.last_name,
      },
      pets: pets ?? [],
      bookings: (bookings ?? []).map((b: any) => ({
        ...b,
        pets: b.booking_pets?.map((bp: any) => bp.pets?.name).filter(Boolean),
      })),
      vaccines: vaccines ?? [],
      sitter: settings ?? {},
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (err) {
    console.error('client-portal error:', err)
    return new Response(JSON.stringify({ error: 'Server error' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
