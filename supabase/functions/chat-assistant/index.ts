import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const SYSTEM_PROMPT = `Você é o assistente pessoal do Life OS, um app de produtividade gamificada.
Você entende linguagem natural e executa ações reais no app do usuário.

Quando o usuário pedir algo, responda SOMENTE com JSON válido (aspas duplas) neste formato:
{
  "message": "sua resposta amigável em português",
  "action": "nome_da_ação ou null",
  "params": {},
  "quickReplies": []
}

Ações disponíveis:
- create_quest: { "title", "reward", "xp", "due_date" }
- complete_quest: { "questId" ou "title" }
- create_habit: { "name", "xpPerDay" }
- add_transaction: { "amount", "type", "category", "description", "date", "method" }
  type deve ser "expense" ou "income".
  method é cartao, pix ou dinheiro.
  Se o usuário gastou e não disse o método, action=null, pergunte e use quickReplies: ["Cartão","Pix","Dinheiro"].
- schedule_event: { "title", "date", "time", "notifyBefore": [1440, 120] }
- create_goal: { "name", "targetAmount", "deadline" }
- get_summary: {}
- set_reminder: { "message", "datetime" }

Seja conciso, amigável e use o estilo do tema ativo.
Hoje é {{today}}. Tema: {{theme}}.`

function parseAssistantPayload(text: string) {
  const start = text.indexOf('{')
  const end = text.lastIndexOf('}')
  if (start === -1 || end === -1) return { message: text.trim(), action: null, params: {} }
  try {
    const parsed = JSON.parse(text.slice(start, end + 1))
    return {
      message: parsed.message || text.trim(),
      action: parsed.action || null,
      params: parsed.params || {},
      quickReplies: Array.isArray(parsed.quickReplies) ? parsed.quickReplies : [],
    }
  } catch {
    return { message: text.trim(), action: null, params: {} }
  }
}

serve(async (req) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  }

  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  const authHeader = req.headers.get('Authorization')
  if (!authHeader) {
    return new Response(JSON.stringify({ error: 'Não autorizado' }), { status: 401, headers: corsHeaders })
  }

  const supabaseAdmin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)
  const {
    data: { user },
    error: authError,
  } = await supabaseAdmin.auth.getUser(authHeader.replace('Bearer ', ''))

  if (authError || !user) {
    return new Response(JSON.stringify({ error: 'Token inválido' }), { status: 401, headers: corsHeaders })
  }

  try {
    const { message, context, theme } = await req.json()
    if (!message) throw new Error('Mensagem obrigatória.')

    const apiKey = Deno.env.get('ANTHROPIC_API_KEY')
    if (!apiKey) throw new Error('ANTHROPIC_API_KEY não configurada no servidor.')

    const today = new Date().toISOString().slice(0, 10)
    const history = (context?.messages || []).slice(-5).map((item: { role: string; content: string }) => ({
      role: item.role === 'assistant' ? 'assistant' : 'user',
      content: item.content,
    }))

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5',
        max_tokens: 700,
        system: SYSTEM_PROMPT.replace('{{today}}', today).replace('{{theme}}', theme || 'skyrim'),
        messages: [
          ...history,
          { role: 'user', content: `Contexto:\n${JSON.stringify(context || {}, null, 2)}\n\nPedido:\n${message}` },
        ],
      }),
    })

    const data = await response.json()
    if (response.status === 429) throw new Error('O assistente está descansando. Tente de novo em alguns minutos.')
    if (!response.ok) throw new Error(data?.error?.message || 'Não foi possível falar com o assistente.')
    const text = (data?.content || []).map((part: { text?: string }) => part.text || '').join('\n').trim()
    const parsed = parseAssistantPayload(text)

    return new Response(JSON.stringify({ ...parsed, userId: user.id }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
