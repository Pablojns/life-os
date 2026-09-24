/**
 * Finanças: configuração, metas, transações e importação CSV.
 */
import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { sanitize, sanitizeNumber } from '../lib/sanitize'
import { useAuth } from '../context/AuthContext'
import { useApp } from '../context/AppContext'
import { useNotifications } from './useNotifications.jsx'
import { parseBankCSV } from '../lib/csvBanks'
import { monthDate, daysInMonth } from '../lib/dates'
import { toNumber } from '../lib/money'

export function useFinances() {
  const { user } = useAuth()
  const { plan } = useApp()
  const { notify } = useNotifications()
  const [finances, setFinances] = useState(null)
  const [goals, setGoals] = useState([])
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)

  const report = useCallback(
    (error, fallback) => {
      console.error(error)
      notify(error?.message || fallback, 'error')
    },
    [notify],
  )

  const fetchFinances = useCallback(async () => {
    if (!user) return null
    const { data, error } = await supabase.from('finances').select('*').eq('user_id', user.id).maybeSingle()
    if (error) {
      report(error, 'Não foi possível carregar a configuração financeira.')
      return null
    }
    setFinances(data)
    return data
  }, [user, report])

  const saveFinances = useCallback(
    async (payload) => {
      if (!user) throw new Error('Usuário não autenticado.')
      const { data, error } = await supabase
        .from('finances')
        .upsert(
          {
            user_id: user.id,
            income: sanitizeNumber(payload.income),
            fixed_costs: sanitizeNumber(payload.fixed_costs),
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'user_id' },
        )
        .select()
        .single()
      if (error) {
        report(error, 'Não foi possível salvar a configuração financeira.')
        throw error
      }
      setFinances(data)
      notify('Configuração financeira salva.', 'success')
      return data
    },
    [user, notify, report],
  )

  const fetchGoals = useCallback(async () => {
    if (!user) return []
    const { data, error } = await supabase
      .from('financial_goals')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: true })
    if (error) {
      report(error, 'Não foi possível carregar as metas.')
      return []
    }
    setGoals(data || [])
    return data || []
  }, [user, report])

  const addGoal = useCallback(
    async (name, targetAmount, deadline, icon, color) => {
      if (!user) throw new Error('Usuário não autenticado.')
      const { error } = await supabase.from('financial_goals').insert({
        user_id: user.id,
        name: sanitize(name),
        target_amount: sanitizeNumber(targetAmount),
        current_amount: 0,
        deadline: deadline || null,
        icon: sanitize(icon) || '🎯',
        color: color || '#C9A84C',
      })
      if (error) {
        report(error, 'Não foi possível criar a meta.')
        throw error
      }
      await fetchGoals()
      notify('Meta financeira registrada.', 'success')
    },
    [user, fetchGoals, notify, report],
  )

  const updateGoalProgress = useCallback(
    async (id, amount) => {
      if (!user) throw new Error('Usuário não autenticado.')
      let goal = goals.find((item) => item.id === id)
      if (!goal) {
        const { data } = await supabase.from('financial_goals').select('*').eq('id', id).eq('user_id', user.id).single()
        goal = data
      }
      if (!goal) throw new Error('Meta não encontrada.')
      const next = sanitizeNumber(goal.current_amount) + sanitizeNumber(amount)
      const { error } = await supabase.from('financial_goals').update({ current_amount: next }).eq('id', id).eq('user_id', user.id)
      if (error) {
        report(error, 'Não foi possível atualizar a meta.')
        throw error
      }
      await fetchGoals()
    },
    [user, goals, fetchGoals, report],
  )

  const deleteGoal = useCallback(
    async (id) => {
      if (!user) throw new Error('Usuário não autenticado.')
      const { error } = await supabase.from('financial_goals').delete().eq('id', id).eq('user_id', user.id)
      if (error) {
        report(error, 'Não foi possível excluir a meta.')
        throw error
      }
      setGoals((current) => current.filter((goal) => goal.id !== id))
    },
    [user, report],
  )

  const fetchTransactions = useCallback(
    async (month, year, monthsBack = 0) => {
      if (!user) return []
      const startDate = new Date(year, month - 1 - monthsBack, 1)
      const start = monthDate(startDate.getFullYear(), startDate.getMonth() + 1, 1)
      const end = monthDate(year, month, daysInMonth(month, year))
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user.id)
        .gte('transaction_date', start)
        .lte('transaction_date', end)
        .order('transaction_date', { ascending: false })
      if (error) {
        report(error, 'Não foi possível carregar as transações.')
        return []
      }
      setTransactions(data || [])
      return data || []
    },
    [user, report],
  )

  const addTransaction = useCallback(
    async (amount, type, category, description, date, accountId) => {
      if (!user) throw new Error('Usuário não autenticado.')
      const value = sanitizeNumber(amount)
      const row = {
        user_id: user.id,
        amount: value,
        type,
        category: sanitize(category),
        description: sanitize(description) || null,
        transaction_date: date,
      }
      if (accountId) row.account_id = accountId
      const { error } = await supabase.from('transactions').insert(row)
      if (error) {
        report(error, 'Não foi possível registrar a transação.')
        throw error
      }

      if (accountId) {
        const { data: account } = await supabase
          .from('accounts')
          .select('id, type, balance')
          .eq('id', accountId)
          .eq('user_id', user.id)
          .maybeSingle()
        if (account) {
          const current = Number(account.balance || 0)
          const signed = type === 'income' ? value : -value
          const next = account.type === 'credit' ? current - signed : current + signed
          await supabase.from('accounts').update({ balance: next }).eq('id', account.id).eq('user_id', user.id)
        }
      }

      if (type === 'income') {
        const { data: main } = await supabase
          .from('financial_goals')
          .select('id, current_amount')
          .eq('user_id', user.id)
          .order('created_at', { ascending: true })
          .limit(1)
          .maybeSingle()
        if (main?.id) await updateGoalProgress(main.id, amount)
      }

      const now = new Date()
      await fetchTransactions(now.getMonth() + 1, now.getFullYear(), 5)
      notify('Transação registrada.', 'success')
    },
    [user, fetchTransactions, updateGoalProgress, notify, report],
  )

  const deleteTransaction = useCallback(
    async (id) => {
      if (!user) throw new Error('Usuário não autenticado.')
      const { error } = await supabase.from('transactions').delete().eq('id', id).eq('user_id', user.id)
      if (error) {
        report(error, 'Não foi possível excluir a transação.')
        throw error
      }
      setTransactions((current) => current.filter((item) => item.id !== id))
    },
    [user, report],
  )

  const getSummary = useCallback(
    async (month, year) => {
      const rows = await fetchTransactions(month, year)
      const totalIncome = rows.filter((item) => item.type === 'income').reduce((sum, item) => sum + toNumber(item.amount), 0)
      const totalExpense = rows.filter((item) => item.type === 'expense').reduce((sum, item) => sum + toNumber(item.amount), 0)
      return { totalIncome, totalExpense, balance: totalIncome - totalExpense }
    },
    [fetchTransactions],
  )

  const importCSV = useCallback(
    async (file) => {
      const text = await file.text()
      const parsed = parseBankCSV(text)
      let imported = 0
      let errors = parsed.errors
      const preview = []
      for (const row of parsed.rows) {
        try {
          await addTransaction(row.amount, row.type, row.category, `${parsed.bank}: ${row.description}`, row.date)
          imported += 1
          if (preview.length < 5) preview.push(row)
        } catch {
          errors += 1
        }
      }
      return { imported, errors, preview, bank: parsed.bank }
    },
    [addTransaction],
  )

  useEffect(() => {
    if (!user) return undefined
    const now = new Date()
    let cancelled = false
    async function load() {
      setLoading(true)
      await Promise.all([fetchFinances(), fetchGoals(), fetchTransactions(now.getMonth() + 1, now.getFullYear(), 5)])
      if (!cancelled) setLoading(false)
    }
    load()
    return () => {
      cancelled = true
    }
  }, [user, fetchFinances, fetchGoals, fetchTransactions])

  return {
    finances,
    goals,
    transactions,
    loading,
    hasFullFinance: plan.hasFullFinance,
    hasOpenFinance: plan.hasOpenFinance,
    fetchFinances,
    saveFinances,
    fetchGoals,
    addGoal,
    updateGoalProgress,
    deleteGoal,
    fetchTransactions,
    addTransaction,
    deleteTransaction,
    getSummary,
    importCSV,
  }
}
