import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { sanitize, sanitizeNumber } from '../lib/sanitize'
import { daysInMonth, monthDate } from '../lib/dates'
import { toNumber } from '../lib/money'
import { useAuth } from '../context/AuthContext'
import { useNotifications } from './useNotifications'

export function useFinances() {
  const { user } = useAuth()
  const { notify } = useNotifications()
  const [transactions, setTransactions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const fetchTransactions = useCallback(async () => {
    if (!user) return []
    const now = new Date()
    const start = monthDate(now.getFullYear(), now.getMonth() + 1, 1)
    const end = monthDate(now.getFullYear(), now.getMonth() + 1, daysInMonth(now.getMonth() + 1, now.getFullYear()))
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', user.id)
      .gte('transaction_date', start)
      .lte('transaction_date', end)
      .order('transaction_date', { ascending: false })
    if (error) {
      notify(error.message, 'error')
      return []
    }
    setTransactions(data || [])
    return data || []
  }, [user, notify])

  const addTransaction = useCallback(
    async (amount: number, type: 'income' | 'expense', category: string, description: string, date: string) => {
      if (!user) throw new Error('Usuário não autenticado.')
      const { error } = await supabase.from('transactions').insert({
        user_id: user.id,
        amount: sanitizeNumber(amount),
        type,
        category: sanitize(category),
        description: sanitize(description) || null,
        transaction_date: date,
      })
      if (error) {
        notify(error.message, 'error')
        throw error
      }
      await fetchTransactions()
      notify('Transação registrada.', 'success')
    },
    [user, fetchTransactions, notify],
  )

  useEffect(() => {
    if (!user) return
    let cancelled = false
    fetchTransactions().finally(() => {
      if (!cancelled) setLoading(false)
    })
    return () => {
      cancelled = true
    }
  }, [user, fetchTransactions])

  const summary = {
    income: transactions.filter((item) => item.type === 'income').reduce((sum, item) => sum + toNumber(item.amount), 0),
    expense: transactions.filter((item) => item.type === 'expense').reduce((sum, item) => sum + toNumber(item.amount), 0),
  }

  return { transactions, loading, fetchTransactions, addTransaction, summary, balance: summary.income - summary.expense }
}
