import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const SYSTEM_PROMPT = `Você é o Coach do Life OS, um assistente de produtividade e finanças pessoais.
Responda SEMPRE em português brasileiro.
NUNCA use inglês. NUNCA use markdown com #.
Use texto corrido com quebras de linha.
Seja direto, específico e honesto.
Estruture em 3 blocos curtos, sem hashes: Conquistas da semana, Pontos de atenção, Sugestão de foco.
Máximo 200 palavras no total.`

const PROFILE_PROMPTS: Record<string, string> = {
  procrastinator: `Seja direto e sem rodeios. Este usuário procrastina.
Não valide desculpas. Seja o coach que ele precisava
mas nunca teve — honesto, firme, encorajador mas sem
paciência para desculpas. Use linguagem de ação.`,
  dovahkiin: `Seja direto e sem rodeios. Este usuário procrastina.
Não valide desculpas. Use linguagem de ação.`,
  indebted: `Este usuário tem dificuldade financeira. Seja empático
mas prático. Foque em ações concretas e pequenas.
Nunca julgue. Celebre cada pequena economia.`,
  anxious: `Este usuário se cobra demais. Sua função é validar
o que já foi feito ANTES de sugerir mais. Sempre
comece reconhecendo as conquistas. Sugira menos,
não mais.`,
  ambitious: `Este usuário tem muitos projetos abertos. Sua função
é ajudar a focar, não a adicionar mais. Faça perguntas
que forcem escolha. Seja o devil's advocate.`,
  hunter: `Este usuário tem muitos projetos abertos. Ajude a focar. Seja o devil's advocate.`,
  disorganized: `Este usuário se perde no caos. Peça 1 lista curta. Sempre reduza, nunca expanda.`,
  ninja: `Este usuário se perde no caos. Peça 1 lista curta. Sempre reduza, nunca expanda.`,
}

function coachPrompt(profileType?: string | null) {
  const extra = PROFILE_PROMPTS[profileType || ''] || ''
  return extra ? `${SYSTEM_PROMPT}\n\nTom para este perfil:\n${extra}` : SYSTEM_PROMPT
}

const BASIC_PLANS = new Set(['monthly', 'quarterly'])
const FULL_PLANS = new Set(['semiannual', 'annual'])

function buildPrompt(payload: {
  analysisType: string
  habits: unknown[]
  quests: unknown[]
  finances: Record<string, unknown>
}) {
  const emptyHabits = !payload.habits?.length
  const emptyQuests = !payload.quests?.length
  const typeLabel =
    payload.analysisType === 'daily'
      ? 'análise do dia'
      : payload.analysisType === 'monthly_report'
        ? 'relatório mensal'
        : 'análise semanal'

  return `Tipo de análise: ${typeLabel}.

Hábitos (com checks do período):
${emptyHabits ? 'Nenhum hábito registrado ainda.' : JSON.stringify(payload.habits, null, 2)}

Missões concluídas recentemente:
${emptyQuests ? 'Nenhuma missão concluída no período.' : JSON.stringify(payload.quests, null, 2)}

Finanças:
${JSON.stringify(payload.finances || {}, null, 2)}

${emptyHabits && emptyQuests ? 'O usuário está começando. Incentive com um primeiro passo concreto, sem julgar.' : 'Use números e nomes reais dos dados acima.'}`
}

serve(async (req) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  }

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const authHeader = req.headers.get('Authorization')
  if (!authHeader) {
    return new Response(JSON.stringify({ error: 'Não autorizado' }), {
      status: 401,
      headers: corsHeaders,
    })
  }

  const supabaseAdmin = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  )

  const {
    data: { user },
    error: authError,
  } = await supabaseAdmin.auth.getUser(authHeader.replace('Bearer ', ''))

  if (authError || !user) {
    return new Response(JSON.stringify({ error: 'Token inválido' }), {
      status: 401,
      headers: corsHeaders,
    })
  }

  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('plan, plan_expires_at')
    .eq('id', user.id)
    .single()
  const { data: extra } = await supabaseAdmin
    .from('user_profiles')
    .select('profile_type')
    .eq('id', user.id)
    .maybeSingle()

  const validPlans = ['monthly', 'quarterly', 'semiannual', 'annual']
  if (!validPlans.includes(profile?.plan)) {
    return new Response(JSON.stringify({ error: 'Plano insuficiente' }), {
      status: 403,
      headers: corsHeaders,
    })
  }

  if (profile?.plan_expires_at && new Date(profile.plan_expires_at) < new Date()) {
    await supabaseAdmin.from('profiles').update({ plan: 'free' }).eq('id', user.id)
    return new Response(JSON.stringify({ error: 'Plano expirado' }), {
      status: 403,
      headers: corsHeaders,
    })
  }

  try {
    const { habits, quests, finances, analysisType } = await req.json()
    const plan = profile.plan
    const userId = user.id

    if (!userId || !plan || !analysisType) {
      throw new Error('userId, plan e analysisType são obrigatórios.')
    }

    if (plan === 'free' || (!BASIC_PLANS.has(plan) && !FULL_PLANS.has(plan))) {
      throw new Error('IA Coach disponível no plano Herói Mensal.')
    }

    if (BASIC_PLANS.has(plan) && analysisType !== 'weekly') {
      throw new Error('No plano atual só a análise semanal está liberada. Faça upgrade para Semestral.')
    }

    const apiKey = Deno.env.get('ANTHROPIC_API_KEY')
    if (!apiKey) throw new Error('ANTHROPIC_API_KEY não configurada no servidor.')

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5',
        max_tokens: 600,
        system: coachPrompt(extra?.profile_type),
        messages: [
          {
            role: 'user',
            content: buildPrompt({
              analysisType,
              habits: habits || [],
              quests: quests || [],
              finances: finances || {},
            }),
          },
        ],
      }),
    })

    const data = await response.json()
    if (response.status === 429) {
      throw new Error('O Coach está descansando. Tente de novo em alguns minutos.')
    }
    if (!response.ok) {
      throw new Error(data?.error?.message || 'Não foi possível consultar o Coach agora.')
    }

    const analysis = data?.content?.map((part: { text?: string }) => part.text || '').join('\n').trim()
    if (!analysis) throw new Error('O Coach não devolveu texto desta vez.')

    return new Response(
      JSON.stringify({
        analysis,
        type: analysisType,
        generatedAt: new Date().toISOString(),
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
