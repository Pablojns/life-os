import { parseEnvFile } from './stripe-catalog.mjs'
import fs from 'fs'
import path from 'path'

export const SYSTEM_PROMPT = `Você é o Coach do Life OS, um assistente de produtividade e finanças pessoais.
Analise os dados do usuário e forneça insights práticos e motivadores em português.
Seja direto, específico e use linguagem positiva mas honesta.
Formato: 3 seções curtas — Conquistas da semana, Pontos de atenção, Sugestão de foco.
Máximo 200 palavras no total.`

export function readServerEnv() {
  const root = path.resolve(process.cwd())
  const values = {}
  for (const file of [path.join(root, 'supabase', '.env'), path.join(root, '.env.local')]) {
    if (!fs.existsSync(file)) continue
    Object.assign(values, parseEnvFile(fs.readFileSync(file, 'utf8')))
  }
  return values
}

export function assertCoachAccess(plan, analysisType) {
  if (plan === 'monthly' || plan === 'quarterly') {
    if (analysisType !== 'weekly') {
      throw new Error('No plano atual só a análise semanal está liberada. Faça upgrade para Semestral.')
    }
    return
  }
  if (plan === 'semiannual' || plan === 'annual') return
  throw new Error('IA Coach disponível no plano Herói Mensal.')
}

export function buildCoachPrompt({ analysisType, habits, quests, finances }) {
  const emptyHabits = !habits?.length
  const emptyQuests = !quests?.length
  const typeLabel =
    analysisType === 'daily'
      ? 'análise do dia'
      : analysisType === 'monthly_report'
        ? 'relatório mensal'
        : 'análise semanal'

  return `Tipo de análise: ${typeLabel}.

Hábitos (com checks do período):
${emptyHabits ? 'Nenhum hábito registrado ainda.' : JSON.stringify(habits, null, 2)}

Missões concluídas recentemente:
${emptyQuests ? 'Nenhuma missão concluída no período.' : JSON.stringify(quests, null, 2)}

Finanças:
${JSON.stringify(finances || {}, null, 2)}

${emptyHabits && emptyQuests ? 'O usuário está começando. Incentive com um primeiro passo concreto, sem julgar.' : 'Use números e nomes reais dos dados acima.'}`
}

export async function requestCoachAnalysis({ apiKey, analysisType, habits, quests, finances }) {
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
      messages: [{ role: 'user', content: buildCoachPrompt({ analysisType, habits, quests, finances }) }],
    }),
  })

  const data = await response.json()
  if (response.status === 429) {
    throw new Error('O Coach está descansando. Tente de novo em alguns minutos.')
  }
  if (!response.ok) {
    throw new Error(data?.error?.message || 'Não foi possível consultar o Coach agora.')
  }

  const analysis = (data.content || []).map((part) => part.text || '').join('\n').trim()
  if (!analysis) throw new Error('O Coach não devolveu texto desta vez.')
  return analysis
}
