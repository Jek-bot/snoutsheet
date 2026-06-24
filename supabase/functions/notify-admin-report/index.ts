import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')!
const ADMIN_EMAIL = 'Jek@kashork.com'
const APP_URL = 'https://snoutsheet.com'

function esc(s: unknown): string {
  return String(s ?? '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

function row(label: string, value: unknown): string {
  if (value === null || value === undefined || value === '') return ''
  return `<tr>
    <td style="padding:4px 12px 4px 0; color:#999; font-size:12px; vertical-align:top; white-space:nowrap;">${esc(label)}</td>
    <td style="padding:4px 0; color:#333; font-size:13px;">${esc(value)}</td>
  </tr>`
}

serve(async (req) => {
  try {
    const payload = await req.json()
    // Database webhook delivers the inserted row as payload.record.
    const t = payload.record ?? {}
    const meta = t.app_meta ?? {}

    const html = `
      <div style="font-family: sans-serif; max-width: 560px; margin: 0 auto;">
        <h2 style="color:#0f2044; margin-bottom:4px;">🐾 New support report</h2>
        <p style="color:#666; margin-top:0;">
          <strong>${esc(t.category)}</strong>${t.severity ? ` · ${esc(t.severity)}` : ''}
        </p>
        <h3 style="color:#0f2044; margin-bottom:6px;">${esc(t.subject)}</h3>
        <p style="color:#333; white-space:pre-wrap; line-height:1.5;">${esc(t.message)}</p>
        ${t.expected ? `<p style="color:#555;"><strong>Expected:</strong><br>${esc(t.expected)}</p>` : ''}
        ${t.error_text ? `<pre style="background:#f5f5f5; border-radius:8px; padding:12px; font-size:12px; overflow:auto; white-space:pre-wrap;">${esc(t.error_text)}</pre>` : ''}

        <table style="margin-top:16px; border-top:1px solid #eee; padding-top:12px; width:100%;">
          ${row('From', t.user_email)}
          ${row('Page', t.page_url)}
          ${row('Route', meta.route)}
          ${row('Sentry ID', meta.sentry_event_id)}
          ${row('Build', meta.mode)}
          ${row('Viewport', meta.viewport)}
          ${row('Browser', t.user_agent)}
          ${row('Submitted', meta.submitted_at)}
        </table>

        <a href="${APP_URL}/admin" style="
          display:inline-block; margin-top:20px; padding:12px 24px;
          background:#00b8a2; color:white; text-decoration:none;
          border-radius:8px; font-weight:bold;">Open Admin Dashboard</a>
        <p style="margin-top:24px; color:#999; font-size:12px;">Snoutsheet · snoutsheet.com</p>
      </div>
    `

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Snoutsheet <noreply@mail.jameskashork.com>',
        to: ADMIN_EMAIL,
        reply_to: t.user_email || undefined,
        subject: `🐾 Support: ${t.subject ?? 'New report'}`,
        html,
      }),
    })

    if (!res.ok) {
      const err = await res.text()
      console.error('Resend error:', err)
      return new Response(JSON.stringify({ error: err }), { status: 500 })
    }

    return new Response(JSON.stringify({ ok: true }), { status: 200 })
  } catch (err) {
    console.error('notify-admin-report error:', err)
    return new Response(JSON.stringify({ error: String(err) }), { status: 500 })
  }
})
