/**
 * Contas, carteiras e transferências.
 */
import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { sanitize, sanitizeNumber } from '../lib/sanitize'
import { useAuth } from '../context/AuthContext'
import { useNotifications } from './useNotifications.jsx'
import { toISODate } from '../lib/dates'

export function useAccounts() {
  const { user } = useAuth()
  const { notify } = useNotifications()
  const [accounts, setAccounts] = useState([])
  const [loading, setLoading] = useState(true)

  const report = useCallback(
    (error, fallback) => {
      console.error(error)
      notify(error?.message || fallback, 'error')
    },
    [notify],
  )

  const fetchAccounts = useCallback(async () => {
    if (!user) return []
    const { data, error } = await supabase.from('accounts').select('*').eq('user_id', user.id).order('created_at')
    if (error) {
      report(error, 'Não foi possível carregar as contas.')
      return []
    }
    setAccounts(data || [])
    return data || []
  }, [user, report])

  const addAccount = useCallback(
    async ({ name, type, balance, color, icon }) => {
      if (!user) throw new Error('Usuário não autenticado.')
      const { error } = await supabase.from('accounts').insert({
        user_id: user.id,
        name: sanitize(name),
        type: type || 'checking',
        balance: sanitizeNumber(balance),
        color: color || '#C9A84C',
        icon: sanitize(icon) || '🏦',
      })
      if (error) {
        report(error, 'Não foi possível criar a conta.')
        throw error
      }
      await fetchAccounts()
      notify('Conta criada.', 'success')
    },
    [user, fetchAccounts, notify, report],
  )

  const updateBalance = useCallback(
    async (id, nextBalance) => {
      if (!user) throw new Error('Usuário não autenticado.')
      const { error } = await supabase
        .from('accounts')
        .update({ balance: sanitizeNumber(nextBalance) })
        .eq('id', id)
        .eq('user_id', user.id)
      if (error) {
        report(error, 'Não foi possível atualizar o saldo.')
        throw error
      }
      await fetchAccounts()
    },
    [user, fetchAccounts, report],
  )

  const adjustBalance = useCallback(
    async (id, delta) => {
      const account = accounts.find((item) => item.id === id)
      const current = Number(account?.balance || 0)
      await updateBalance(id, current + Number(delta || 0))
    },
    [accounts, updateBalance],
  )

  const deleteAccount = useCallback(
    async (id) => {
      if (!user) throw new Error('Usuário não autenticado.')
      const { error } = await supabase.from('accounts').delete().eq('id', id).eq('user_id', user.id)
      if (error) {
        report(error, 'Não foi possível excluir a conta.')
        throw error
      }
      setAccounts((current) => current.filter((item) => item.id !== id))
    },
    [user, report],
  )

  const transfer = useCallback(
    async (fromId, toId, amount) => {
      if (!user) throw new Error('Usuário não autenticado.')
      const value = sanitizeNumber(amount)
      if (fromId === toId) throw new Error('Escolha contas diferentes.')
      const from = accounts.find((item) => item.id === fromId)
      const to = accounts.find((item) => item.id === toId)
      if (!from || !to) throw new Error('Conta não encontrada.')

      const fromNext = from.type === 'credit' ? Number(from.balance) + value : Number(from.balance) - value
      const toNext = to.type === 'credit' ? Number(to.balance) - value : Number(to.balance) + value

      const { error: fromError } = await supabase
        .from('accounts')
        .update({ balance: fromNext })
        .eq('id', fromId)
        .eq('user_id', user.id)
      if (fromError) {
        report(fromError, 'Não foi possível transferir.')
        throw fromError
      }
      const { error: toError } = await supabase
        .from('accounts')
        .update({ balance: toNext })
        .eq('id', toId)
        .eq('user_id', user.id)
      if (toError) {
        report(toError, 'A origem saiu, mas o destino falhou. Ajuste o saldo.')
        throw toError
      }

      await supabase.from('transactions').insert([
        {
          user_id: user.id,
          amount: value,
          type: 'expense',
          category: 'Outros',
          description: `Transferência para ${to.name}`,
          transaction_date: toISODate(),
          account_id: fromId,
        },
        {
          user_id: user.id,
          amount: value,
          type: 'income',
          category: 'Outros',
          description: `Transferência de ${from.name}`,
          transaction_date: toISODate(),
          account_id: toId,
        },
      ])

      await fetchAccounts()
      notify('Transferência registrada.', 'success')
    },
    [user, accounts, fetchAccounts, notify, report],
  )

  useEffect(() => {
    if (!user) return undefined
    let cancelled = false
    setLoading(true)
    fetchAccounts().finally(() => {
      if (!cancelled) setLoading(false)
    })
    return () => {
      cancelled = true
    }
  }, [user, fetchAccounts])

  return { accounts, loading, fetchAccounts, addAccount, updateBalance, adjustBalance, deleteAccount, transfer }
}
