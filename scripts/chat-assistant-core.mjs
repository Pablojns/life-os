export const CHAT_SYSTEM_PROMPT = `Você é o assistente pessoal do Life OS, um app de produtividade gamificada.
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
  Se categoria não informada, deduza pelo contexto.
- schedule_event: { "title", "date", "time", "notifyBefore": [1440, 120] }
  date em YYYY-MM-DD, time em HH:MM (24h).
- create_goal: { "name", "targetAmount", "deadline" }
- get_summary: {}
- set_reminder: { "message", "datetime" }
- generate_quiz: {}
- generate_challenge: {}

Exemplos:
"gastei 50 no ifood" → perguntar método com quickReplies
"agendar prova de inglês sexta às 14h" → schedule_event
"criei o hábito de correr" → create_habit
"como tá meu financeiro?" → get_summary

Seja conciso, amigável e use o estilo do tema ativo (medieval/ninja/sistema/clean).
Se não entender, peça esclarecimento em 1 pergunta.
Hoje é {{today}}.
Tema ativo: {{theme}}.`

export function parseAssistantPayload(text) {
  if (!text) return { message: 'Não entendi. Pode repetir?', action: null, params: {} }
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
      quiz: parsed.quiz || null,
      challenge: parsed.challenge || null,
    }
  } catch {
    return { message: text.trim(), action: null, params: {} }
  }
}

export async function requestChatReply({ apiKey, message, context, theme }) {
  const today = new Date().toISOString().slice(0, 10)
  const system = CHAT_SYSTEM_PROMPT.replace('{{today}}', today).replace('{{theme}}', theme || 'skyrim')
  const history = (context?.messages || []).slice(-5).map((item) => ({
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
      system,
      messages: [
        ...history,
        {
          role: 'user',
          content: `Contexto do herói:\n${JSON.stringify(context || {}, null, 2)}\n\nPedido:\n${message}`,
        },
      ],
    }),
  })

  const data = await response.json()
  if (response.status === 429) throw new Error('O assistente está descansando. Tente de novo em alguns minutos.')
  if (!response.ok) throw new Error(data?.error?.message || 'Não foi possível falar com o assistente.')
  const text = (data?.content || []).map((part) => part.text || '').join('\n').trim()
  return parseAssistantPayload(text)
}
