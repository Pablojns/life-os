import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const TZ = 'America/Sao_Paulo'

function clock() {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: TZ,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(new Date())
  const hour = Number(parts.find((item) => item.type === 'hour')?.value || 0)
  const minute = Number(parts.find((item) => item.type === 'minute')?.value || 0)
  const day = new Intl.DateTimeFormat('en-CA', { timeZone: TZ }).format(new Date())
  return { hour, minute, day }
}

function normalizeProfile(type: string | null) {
  if (type === 'dovahkiin') return 'procrastinator'
  if (type === 'hunter') return 'ambitious'
  if (type === 'ninja') return 'disorganized'
  return type || 'procrastinator'
}

function slotFor(kind: string, hour: number, minute: number) {
  if (kind === 'procrastinator') {
    if (hour === 9) return 'p-09'
    if (hour === 16) return 'p-16'
    if (hour === 21) return 'p-21'
  }
  if (kind === 'indebted') {
    if (hour === 8) return 'e-08'
    if (hour === 18) return 'e-18'
    if (hour === 22) return 'e-22'
  }
  if (kind === 'disorganized') {
    if (hour === 7 && minute >= 20) return 'd-0730'
    if (hour === 19) return 'd-19'
  }
  if (kind === 'anxious') {
    if (hour === 9) return 'a-09'
    if (hour === 21) return 'a-21'
  }
  if (kind === 'ambitious') {
    if (hour === 8) return 'm-08'
    if (hour === 17) return 'm-17'
  }
  return null
}

async function push(token: string, title: string, body: string) {
  await fetch('https://exp.host/--/api/v2/push/send', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ to: token, title, body }),
  }).catch(() => {})
}

serve(async (req) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  }
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  const supabaseAdmin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)
  const { hour, minute, day } = clock()

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
      .select('email, expo_push_token, push_token, name')
      .eq('id', event.user_id)
      .maybeSingle()

    const token = profile?.expo_push_token || profile?.push_token
    if (token) await push(token, 'Life OS', `Lembrete: ${event.title}`)

    const resendKey = Deno.env.get('RESEND_API_KEY')
    if (resendKey && profile?.email) {
      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { Authorization: `Bearer ${resendKey}`, 'Content-Type': 'application/json' },
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

  const { data: users } = await supabaseAdmin
    .from('profiles')
    .select('id, name, expo_push_token, push_token')
    .or('expo_push_token.not.is.null,push_token.not.is.null')
    .limit(400)

  let nudges = 0
  for (const user of users || []) {
    const token = user.expo_push_token || user.push_token
    if (!token) continue
    const { data: extra } = await supabaseAdmin.from('user_profiles').select('profile_type').eq('id', user.id).maybeSingle()
    const kind = normalizeProfile(extra?.profile_type || null)
    const slot = slotFor(kind, hour, minute)
    if (!slot) continue

    const { error: lock } = await supabaseAdmin.from('notification_sends').insert({
      user_id: user.id,
      slot,
      sent_on: day,
    })
    if (lock) continue

    let body = 'Abra o Life OS.'
    if (slot === 'p-09') body = 'Sua missão mais fácil te espera. Qual é?'
    if (slot === 'p-16') {
      const start = `${day}T00:00:00`
      const { count } = await supabaseAdmin
        .from('quests')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .gte('completed_at', start)
      if ((count || 0) > 0) continue
      body = 'Dia quase acabando. 1 missão. Agora.'
    }
    if (slot === 'p-21') {
      const start = `${day}T00:00:00`
      const { count } = await supabaseAdmin
        .from('quests')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .gte('completed_at', start)
      body = `Você completou ${count || 0} missões hoje.`
    }
    if (slot === 'e-08') body = 'Bom dia. Qual foi seu primeiro gasto hoje?'
    if (slot === 'e-18') {
      const { count } = await supabaseAdmin
        .from('transactions')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('transaction_date', day)
      if ((count || 0) > 0) continue
      body = 'Você registrou seus gastos hoje?'
    }
    if (slot === 'e-22') {
      const { data: txs } = await supabaseAdmin
        .from('transactions')
        .select('amount, type')
        .eq('user_id', user.id)
        .eq('transaction_date', day)
      const expense = (txs || []).filter((item) => item.type === 'expense').reduce((sum, item) => sum + Number(item.amount || 0), 0)
      body = `Resumo do dia: R$ ${expense.toFixed(2)} em saídas.`
    }
    if (slot === 'd-0730') body = '3 coisas para fazer hoje. Defina agora.'
    if (slot === 'd-19') body = 'O que ficou para amanhã? Anote antes de dormir.'
    if (slot === 'a-09') body = 'Você não precisa fazer tudo. Escolha 3.'
    if (slot === 'a-21') body = 'Desliga. Você fez o suficiente.'
    if (slot === 'm-08') body = 'Qual é o 1 projeto que importa hoje?'
    if (slot === 'm-17') body = 'Progresso no projeto principal?'

    await push(token, 'Life OS', body)
    nudges += 1
  }

  return new Response(JSON.stringify({ ok: true, sent, nudges, hour }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
})
