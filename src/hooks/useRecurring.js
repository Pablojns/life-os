/**
 * Lançamentos recorrentes (salário, aluguel, streaming).
 */
import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { sanitize, sanitizeNumber } from '../lib/sanitize'
import { useAuth } from '../context/AuthContext'
import { useNotifications } from './useNotifications.jsx'

export function useRecurring() {
  const { user } = useAuth()
  const { notify } = useNotifications()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)

  const report = useCallback(
    (error, fallback) => {
      console.error(error)
      notify(error?.message || fallback, 'error')
    },
    [notify],
  )

  const fetchRecurring = useCallback(async () => {
    if (!user) return []
    const { data, error } = await supabase.from('recurring').select('*').eq('user_id', user.id).order('day_of_month')
    if (error) {
      report(error, 'Não foi possível carregar os recorrentes.')
      return []
    }
    setItems(data || [])
    return data || []
  }, [user, report])

  const addRecurring = useCallback(
    async (payload) => {
      if (!user) throw new Error('Usuário não autenticado.')
      const { error } = await supabase.from('recurring').insert({
        user_id: user.id,
        name: sanitize(payload.name),
        amount: sanitizeNumber(payload.amount),
        type: payload.type === 'income' ? 'income' : 'expense',
        category: sanitize(payload.category) || 'Outros',
        day_of_month: Number(payload.day_of_month) || 1,
        active: true,
      })
      if (error) {
        report(error, 'Não foi possível criar o recorrente.')
        throw error
      }
      await fetchRecurring()
      notify('Recorrente cadastrado.', 'success')
    },
    [user, fetchRecurring, notify, report],
  )

  const toggleRecurring = useCallback(
    async (id, active) => {
      if (!user) throw new Error('Usuário não autenticado.')
      const { error } = await supabase.from('recurring').update({ active }).eq('id', id).eq('user_id', user.id)
      if (error) {
        report(error, 'Não foi possível atualizar o recorrente.')
        throw error
      }
      setItems((current) => current.map((item) => (item.id === id ? { ...item, active } : item)))
    },
    [user, report],
  )

  const deleteRecurring = useCallback(
    async (id) => {
      if (!user) throw new Error('Usuário não autenticado.')
      const { error } = await supabase.from('recurring').delete().eq('id', id).eq('user_id', user.id)
      if (error) {
        report(error, 'Não foi possível excluir o recorrente.')
        throw error
      }
      setItems((current) => current.filter((item) => item.id !== id))
    },
    [user, report],
  )

  useEffect(() => {
    if (!user) return undefined
    let cancelled = false
    setLoading(true)
    fetchRecurring().finally(() => {
      if (!cancelled) setLoading(false)
    })
    return () => {
      cancelled = true
    }
  }, [user, fetchRecurring])

  return { items, loading, fetchRecurring, addRecurring, toggleRecurring, deleteRecurring }
}
