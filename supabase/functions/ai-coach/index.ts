import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const SYSTEM_PROMPT = `Você é o Coach do Life OS, um assistente de produtividade e finanças pessoais.
Analise os dados do usuário e forneça insights práticos e motivadores em português.
Seja direto, específico e use linguagem positiva mas honesta.
Formato: 3 seções curtas — Conquistas da semana, Pontos de atenção, Sugestão de foco.
Máximo 200 palavras no total.`

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

  try {
    const { userId, plan, habits, quests, finances, analysisType } = await req.json()

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
        system: SYSTEM_PROMPT,
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
