/**
 * Orçamentos mensais por categoria.
 */
import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { sanitize, sanitizeNumber } from '../lib/sanitize'
import { useAuth } from '../context/AuthContext'
import { useNotifications } from './useNotifications.jsx'

export function useBudgets(month, year) {
  const { user } = useAuth()
  const { notify } = useNotifications()
  const [budgets, setBudgets] = useState([])
  const [loading, setLoading] = useState(true)

  const report = useCallback(
    (error, fallback) => {
      console.error(error)
      notify(error?.message || fallback, 'error')
    },
    [notify],
  )

  const fetchBudgets = useCallback(
    async (targetMonth = month, targetYear = year) => {
      if (!user) return []
      const { data, error } = await supabase
        .from('budgets')
        .select('*')
        .eq('user_id', user.id)
        .eq('month', targetMonth)
        .eq('year', targetYear)
        .order('category')
      if (error) {
        report(error, 'Não foi possível carregar os orçamentos.')
        return []
      }
      if (targetMonth === month && targetYear === year) setBudgets(data || [])
      return data || []
    },
    [user, month, year, report],
  )

  const upsertBudget = useCallback(
    async (category, limitAmount) => {
      if (!user) throw new Error('Usuário não autenticado.')
      const { error } = await supabase.from('budgets').upsert(
        {
          user_id: user.id,
          category: sanitize(category),
          limit_amount: sanitizeNumber(limitAmount),
          month,
          year,
        },
        { onConflict: 'user_id,category,month,year' },
      )
      if (error) {
        report(error, 'Não foi possível salvar o orçamento.')
        throw error
      }
      await fetchBudgets()
      notify('Orçamento atualizado.', 'success')
    },
    [user, month, year, fetchBudgets, notify, report],
  )

  const deleteBudget = useCallback(
    async (id) => {
      if (!user) throw new Error('Usuário não autenticado.')
      const { error } = await supabase.from('budgets').delete().eq('id', id).eq('user_id', user.id)
      if (error) {
        report(error, 'Não foi possível excluir o orçamento.')
        throw error
      }
      setBudgets((current) => current.filter((item) => item.id !== id))
    },
    [user, report],
  )

  useEffect(() => {
    if (!user) return undefined
    let cancelled = false
    setLoading(true)
    fetchBudgets().finally(() => {
      if (!cancelled) setLoading(false)
    })
    return () => {
      cancelled = true
    }
  }, [user, fetchBudgets])

  return { budgets, loading, fetchBudgets, upsertBudget, deleteBudget }
}
