import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  }
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  const supabaseAdmin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)

  const { data: due, error } = await supabaseAdmin
    .from('scheduled_events')
    .select('id, user_id, title, event_datetime')
    .lte('notify_at', new Date().toISOString())
    .eq('notified', false)
    .limit(50)

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 400, headers: corsHeaders })
  }

  let sent = 0
  for (const event of due || []) {
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('email, expo_push_token, name')
      .eq('id', event.user_id)
      .maybeSingle()

    if (profile?.expo_push_token) {
      await fetch('https://exp.host/--/api/v2/push/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: profile.expo_push_token,
          title: 'Life OS',
          body: `Lembrete: ${event.title}`,
        }),
      }).catch(() => {})
    }

    const resendKey = Deno.env.get('RESEND_API_KEY')
    if (resendKey && profile?.email) {
      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${resendKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'Life OS <reminders@lifeos.app>',
          to: [profile.email],
          subject: `Lembrete: ${event.title}`,
          html: `<p>Olá ${profile.name || ''},</p><p>Seu evento <strong>${event.title}</strong> está próximo.</p>`,
        }),
      }).catch(() => {})
    }

    await supabaseAdmin.from('scheduled_events').update({ notified: true }).eq('id', event.id)
    sent += 1
  }

  return new Response(JSON.stringify({ ok: true, sent }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
})
