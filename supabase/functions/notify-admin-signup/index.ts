import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')!
const ADMIN_EMAIL = 'Jek@kashork.com'
const APP_URL = 'https://snoutsheet.com'

serve(async (req) => {
  try {
    const payload = await req.json()

    // Database webhook sends the new row as payload.record
    const record = payload.record
    const email = record?.email ?? 'Unknown'

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Snoutsheet <noreply@mail.jameskashork.com>',
        to: ADMIN_EMAIL,
        subject: '🐾 New Snoutsheet sign-up pending approval',
        html: `
          <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
            <h2 style="color: #0f2044;">New user signed up</h2>
            <p style="color: #555;">A new account is waiting for your approval:</p>
            <p style="font-size: 18px; font-weight: bold; color: #0f2044;">${email}</p>
            <a href="${APP_URL}/admin" style="
              display: inline-block;
              margin-top: 16px;
              padding: 12px 24px;
              background: #00b8a2;
              color: white;
              text-decoration: none;
              border-radius: 8px;
              font-weight: bold;
            ">Review in Admin Dashboard</a>
            <p style="margin-top: 24px; color: #999; font-size: 12px;">Snoutsheet · snoutsheet.com</p>
          </div>
        `,
      }),
    })

    if (!res.ok) {
      const err = await res.text()
      console.error('Resend error:', err)
      return new Response(JSON.stringify({ error: err }), { status: 500 })
    }

    return new Response(JSON.stringify({ ok: true }), { status: 200 })
  } catch (err) {
    console.error('notify-admin-signup error:', err)
    return new Response(JSON.stringify({ error: String(err) }), { status: 500 })
  }
})
