/**
 * Dívidas, parcelas e simuladores.
 */
import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { sanitize, sanitizeNumber } from '../lib/sanitize'
import { useAuth } from '../context/AuthContext'
import { useNotifications } from './useNotifications.jsx'

export function useDebts() {
  const { user } = useAuth()
  const { notify } = useNotifications()
  const [debts, setDebts] = useState([])
  const [loading, setLoading] = useState(true)

  const report = useCallback(
    (error, fallback) => {
      console.error(error)
      notify(error?.message || fallback, 'error')
    },
    [notify],
  )

  const fetchDebts = useCallback(async () => {
    if (!user) return []
    const { data, error } = await supabase.from('debts').select('*').eq('user_id', user.id).order('created_at')
    if (error) {
      report(error, 'Não foi possível carregar as dívidas.')
      return []
    }
    setDebts(data || [])
    return data || []
  }, [user, report])

  const addDebt = useCallback(
    async (payload) => {
      if (!user) throw new Error('Usuário não autenticado.')
      const { error } = await supabase.from('debts').insert({
        user_id: user.id,
        name: sanitize(payload.name),
        total_amount: sanitizeNumber(payload.total_amount),
        remaining_amount: sanitizeNumber(payload.remaining_amount ?? payload.total_amount),
        interest_rate: sanitizeNumber(payload.interest_rate),
        monthly_payment: sanitizeNumber(payload.monthly_payment),
        due_day: payload.due_day ? Number(payload.due_day) : null,
        category: sanitize(payload.category) || 'outros',
      })
      if (error) {
        report(error, 'Não foi possível cadastrar a dívida.')
        throw error
      }
      await fetchDebts()
      notify('Dívida registrada. Agora ela tem um plano.', 'success')
    },
    [user, fetchDebts, notify, report],
  )

  const payDebt = useCallback(
    async (id, amount) => {
      if (!user) throw new Error('Usuário não autenticado.')
      const debt = debts.find((item) => item.id === id)
      if (!debt) throw new Error('Dívida não encontrada.')
      const next = Math.max(0, Number(debt.remaining_amount) - sanitizeNumber(amount))
      const { error } = await supabase
        .from('debts')
        .update({ remaining_amount: next })
        .eq('id', id)
        .eq('user_id', user.id)
      if (error) {
        report(error, 'Não foi possível registrar o pagamento.')
        throw error
      }
      await fetchDebts()
      notify(next === 0 ? 'Dívida quitada.' : 'Pagamento lançado.', 'success')
    },
    [user, debts, fetchDebts, notify, report],
  )

  const deleteDebt = useCallback(
    async (id) => {
      if (!user) throw new Error('Usuário não autenticado.')
      const { error } = await supabase.from('debts').delete().eq('id', id).eq('user_id', user.id)
      if (error) {
        report(error, 'Não foi possível excluir a dívida.')
        throw error
      }
      setDebts((current) => current.filter((item) => item.id !== id))
    },
    [user, report],
  )

  useEffect(() => {
    if (!user) return undefined
    let cancelled = false
    setLoading(true)
    fetchDebts().finally(() => {
      if (!cancelled) setLoading(false)
    })
    return () => {
      cancelled = true
    }
  }, [user, fetchDebts])

  return { debts, loading, fetchDebts, addDebt, payDebt, deleteDebt }
}
