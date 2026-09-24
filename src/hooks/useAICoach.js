/**
 * IA Coach: busca dados do herói, chama o backend e guarda o histórico.
 */
import { useCallback, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

function weekAgoISO() {
  const date = new Date()
  date.setDate(date.getDate() - 7)
  return date.toISOString()
}

function weekAgoDate() {
  return weekAgoISO().slice(0, 10)
}

function friendlyError(error) {
  const text = error?.message || ''
  if (/rate|429|too many/i.test(text)) return 'O Coach está descansando. Tente de novo em alguns minutos.'
  return text || 'Não foi possível consultar o Coach.'
}

async function invokeCoach(payload) {
  if (import.meta.env.DEV) {
    const {
      data: { session },
    } = await supabase.auth.getSession()
    const response = await fetch('/api/ai-coach', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
      },
      body: JSON.stringify(payload),
    })
    const local = await response.json()
    if (!response.ok || local.error) throw new Error(local.error || 'Falha no Coach local.')
    return local
  }

  const { data, error } = await supabase.functions.invoke('ai-coach', { body: payload })
  if (error) throw error
  if (data?.error) throw new Error(data.error)
  if (!data?.analysis) throw new Error('O Coach não devolveu análise.')
  return data
}

export function useAICoach() {
  const { user, profile, hasAccess } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [history, setHistory] = useState([])

  const getHistory = useCallback(async () => {
    if (!user) return []
    const { data, error: queryError } = await supabase
      .from('ai_analyses')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(10)

    if (queryError) throw queryError
    setHistory(data || [])
    return data || []
  }, [user])

  const getAnalysis = useCallback(
    async (type) => {
      if (!user) throw new Error('Entre na jornada para falar com o Coach.')
      if (!hasAccess('monthly')) throw new Error('IA Coach disponível no plano Herói Mensal.')

      const plan = profile?.plan || 'free'
      if ((plan === 'monthly' || plan === 'quarterly') && type !== 'weekly') {
        throw new Error('No plano atual só a análise semanal está liberada. Faça upgrade para Semestral.')
      }

      setLoading(true)
      setError('')
      try {
        const since = weekAgoISO()
        const sinceDate = weekAgoDate()

        const [habitsRes, checksRes, questsRes, financesRes] = await Promise.all([
          supabase.from('habits').select('id, name, xp_per_day').eq('user_id', user.id),
          supabase.from('habit_checks').select('habit_id, check_date').eq('user_id', user.id).gte('check_date', sinceDate),
          supabase
            .from('quests')
            .select('id, title, xp, completed_at')
            .eq('user_id', user.id)
            .not('completed_at', 'is', null)
            .gte('completed_at', since),
          supabase.from('finances').select('income, fixed_costs, goal_name, goal_amount, goal_current').eq('user_id', user.id).maybeSingle(),
        ])

        const habits = (habitsRes.data || []).map((habit) => ({
          name: habit.name,
          xp_per_day: habit.xp_per_day,
          checks: (checksRes.data || []).filter((check) => check.habit_id === habit.id).map((check) => check.check_date),
        }))

        const payload = {
          userId: user.id,
          plan,
          habits,
          quests: questsRes.data || [],
          finances: financesRes.data || {},
          analysisType: type,
        }

        const result = await invokeCoach(payload)
        const { error: insertError } = await supabase.from('ai_analyses').insert({
          user_id: user.id,
          analysis: result.analysis,
          analysis_type: result.type || type,
          plan_at_time: plan,
        })
        if (insertError) throw insertError

        await getHistory()
        return result.analysis
      } catch (err) {
        const message = friendlyError(err)
        setError(message)
        throw new Error(message)
      } finally {
        setLoading(false)
      }
    },
    [getHistory, hasAccess, profile?.plan, user],
  )

  return { getAnalysis, getHistory, history, loading, error }
}
