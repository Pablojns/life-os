import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { sanitize, sanitizeNumber } from '../lib/sanitize'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import { toISODate } from '../lib/dates'
import { toNumber } from '../lib/money'
import { gainXP } from '../lib/xp'

function normalizeMethod(value) {
  const raw = String(value || '').toLowerCase()
  if (raw.includes('pix')) return 'pix'
  if (raw.includes('cart')) return 'cartao'
  if (raw.includes('dinheir') || raw.includes('cash')) return 'dinheiro'
  return ''
}

function normalizeTx(params = {}) {
  const methods = ['cartao', 'cartão', 'pix', 'dinheiro', 'card']
  let method = normalizeMethod(params.method || params.payment)
  let kind = String(params.type || '').toLowerCase()
  if (methods.includes(kind)) {
    method = normalizeMethod(kind)
    kind = 'expense'
  }
  if (kind !== 'income' && kind !== 'expense') kind = 'expense'
  return {
    amount: Number(params.amount) || 0,
    type: kind,
    category: params.category || 'Outros',
    description: params.description || params.title || '',
    date: params.date || toISODate(),
    method,
  }
}

async function invokeChat(payload) {
  const {
    data: { session },
  } = await supabase.auth.getSession()
  const headers = {
    'Content-Type': 'application/json',
    ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
  }

  if (import.meta.env.DEV) {
    const response = await fetch('/api/chat-assistant', {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    })
    const local = await response.json()
    if (!response.ok || local.error) throw new Error(local.error || 'Falha no assistente local.')
    return local
  }

  const { data, error } = await supabase.functions.invoke('chat-assistant', { body: payload })
  if (error) throw error
  if (data?.error) throw new Error(data.error)
  return data
}

export function useChatAssistant() {
  const { user, profile, refreshProfile } = useAuth()
  const { theme, labels } = useTheme()
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(false)

  const loadMessages = useCallback(async () => {
    if (!user) return []
    const { data } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(20)
    const rows = (data || []).reverse()
    setMessages(rows)
    return rows
  }, [user])

  useEffect(() => {
    loadMessages()
  }, [loadMessages])

  const persist = useCallback(
    async (role, content, actionTaken) => {
      if (!user) return
      const { data } = await supabase
        .from('chat_messages')
        .insert({
          user_id: user.id,
          role,
          content,
          action_taken: actionTaken || null,
        })
        .select()
        .single()
      if (data) setMessages((current) => [...current.slice(-19), data])
    },
    [user],
  )

  const applyAction = useCallback(
    async (action, params = {}) => {
      if (!user || !action) return { feedback: '', action: null }
      if (action === 'create_quest') {
        const { error } = await supabase.from('quests').insert({
          user_id: user.id,
          title: sanitize(params.title),
          reward: sanitize(params.reward) || null,
          xp: sanitizeNumber(params.xp) || 10,
          due_date: params.due_date || params.dueDate || null,
        })
        if (error) throw error
        return { feedback: '✓ Missão criada!', action: 'quest_created' }
      }
      if (action === 'complete_quest') {
        const { data: active } = await supabase.from('quests').select('id, title, xp').eq('user_id', user.id).is('completed_at', null)
        const match =
          (active || []).find((item) => item.id === params.questId) ||
          (active || []).find((item) => item.title?.toLowerCase() === String(params.title || '').toLowerCase())
        if (!match) return { feedback: 'Não achei essa missão ativa.', action }
        await supabase.from('quests').update({ completed_at: new Date().toISOString() }).eq('id', match.id).eq('user_id', user.id)
        await gainXP(match.xp, { userId: user.id, refreshProfile })
        return { feedback: '✓ Missão concluída!', action: 'quest_completed' }
      }
      if (action === 'create_habit') {
        const { error } = await supabase.from('habits').insert({
          user_id: user.id,
          name: sanitize(params.name),
          xp_per_day: sanitizeNumber(params.xpPerDay) || 5,
        })
        if (error) throw error
        return { feedback: '✓ Hábito criado!', action: 'habit_created' }
      }
      if (action === 'add_transaction') {
        const tx = normalizeTx(params)
        if (!tx.method) return { feedback: '', action: 'need_method', pending: tx }
        const { error } = await supabase.from('transactions').insert({
          user_id: user.id,
          amount: tx.amount,
          type: tx.type,
          category: sanitize(tx.category),
          description: sanitize(`${tx.description} · ${tx.method}`),
          transaction_date: tx.date,
          payment_method: tx.method,
        })
        if (error) throw error
        return { feedback: '✓ Transação registrada!', action: 'transaction_added' }
      }
      if (action === 'schedule_event' || action === 'set_reminder') {
        const when = params.datetime ? new Date(params.datetime) : new Date(`${params.date}T${params.time || '09:00'}:00`)
        if (Number.isNaN(when.getTime())) throw new Error('Data inválida para o evento.')
        const minutes = params.notifyBefore || [1440, 120]
        const rows = minutes.map((offset) => ({
          user_id: user.id,
          title: sanitize(params.title || params.message || 'Lembrete'),
          event_datetime: when.toISOString(),
          notify_at: new Date(when.getTime() - Number(offset) * 60 * 1000).toISOString(),
          notified: false,
          notification_type: 'reminder',
        }))
        const { error } = await supabase.from('scheduled_events').insert(rows)
        if (error) throw error
        return { feedback: '✓ Evento agendado!', action: 'event_scheduled' }
      }
      if (action === 'create_goal') {
        const { error } = await supabase.from('financial_goals').insert({
          user_id: user.id,
          name: sanitize(params.name),
          target_amount: sanitizeNumber(params.targetAmount),
          current_amount: 0,
          deadline: params.deadline || null,
        })
        if (error) throw error
        return { feedback: '✓ Meta criada!', action: 'goal_created' }
      }
      if (action === 'get_summary') {
        const now = new Date()
        const start = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`
        const [{ count: questCount }, { data: txs }] = await Promise.all([
          supabase.from('quests').select('id', { count: 'exact', head: true }).eq('user_id', user.id).is('completed_at', null),
          supabase.from('transactions').select('amount, type').eq('user_id', user.id).gte('transaction_date', start),
        ])
        const expense = (txs || []).filter((item) => item.type === 'expense').reduce((sum, item) => sum + toNumber(item.amount), 0)
        return { feedback: `Missões ativas: ${questCount || 0}. Gastos do mês: R$ ${expense.toFixed(2)}.`, action }
      }
      return { feedback: '', action }
    },
    [refreshProfile, user],
  )

  const send = useCallback(
    async (text) => {
      if (!user || !text?.trim()) return null
      const content = text.trim()
      await persist('user', content)
      setLoading(true)
      try {
        const [{ data: questRows }, { data: habitRows }, { data: txRows }] = await Promise.all([
          supabase.from('quests').select('id, title, xp').eq('user_id', user.id).is('completed_at', null).limit(8),
          supabase.from('habits').select('name').eq('user_id', user.id),
          supabase.from('transactions').select('amount, type').eq('user_id', user.id).limit(20),
        ])
        const result = await invokeChat({
          message: content,
          userId: user.id,
          theme,
          context: {
            messages: messages.slice(-5).map((item) => ({ role: item.role, content: item.content })),
            plan: profile?.plan || 'free',
            theme,
            pendingQuests: questRows || [],
            habits: (habitRows || []).map((item) => item.name),
            finance: {
              monthSpend: (txRows || [])
                .filter((item) => item.type === 'expense')
                .reduce((sum, item) => sum + toNumber(item.amount), 0),
            },
          },
        })
        const applied = await applyAction(result.action, result.params || {})
        const extra = applied.feedback ? `\n${applied.feedback}` : ''
        await persist('assistant', `${result.message}${extra}`, applied.action)
        return { ...result, ...applied }
      } catch (error) {
        const fallback = error.message || 'Não consegui responder agora.'
        await persist('assistant', fallback)
        throw error
      } finally {
        setLoading(false)
      }
    },
    [applyAction, messages, persist, profile?.plan, theme, user],
  )

  const placeholders = {
    skyrim: 'O que deseja, viajante?',
    naruto: 'Qual é a missão, ninja?',
    solo: '[SISTEMA] Aguardando comando...',
    clean: 'Como posso ajudar?',
  }

  return {
    messages,
    loading,
    send,
    applyAction,
    persist,
    placeholder: placeholders[theme] || placeholders.clean,
    labels,
  }
}
