/**
 * Recompensas resgatáveis com XP, com realtime.
 */
import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { useNotifications } from './useNotifications.jsx'

export function useRewards() {
  const { user, profile, refreshProfile } = useAuth()
  const { notify } = useNotifications()
  const [rewards, setRewards] = useState([])
  const [loading, setLoading] = useState(true)

  const report = useCallback(
    (error, fallback) => {
      console.error(error)
      notify(error?.message || fallback, 'error')
    },
    [notify],
  )

  const fetchRewards = useCallback(async () => {
    if (!user) return []
    const { data, error } = await supabase
      .from('rewards')
      .select('*')
      .eq('user_id', user.id)
      .is('claimed_at', null)
      .order('created_at', { ascending: false })

    if (error) {
      report(error, 'Não foi possível carregar as recompensas.')
      return []
    }

    setRewards(data || [])
    return data || []
  }, [user, report])

  const addReward = useCallback(
    async (name, costXp) => {
      if (!user) throw new Error('Usuário não autenticado.')
      const { error } = await supabase.from('rewards').insert({
        user_id: user.id,
        name,
        cost_xp: Number(costXp) || 0,
      })
      if (error) {
        report(error, 'Não foi possível criar a recompensa.')
        throw error
      }
      await fetchRewards()
      notify('Recompensa adicionada ao baú.', 'success')
    },
    [user, fetchRewards, notify, report],
  )

  const claimReward = useCallback(
    async (id, costXp) => {
      if (!user) throw new Error('Usuário não autenticado.')
      const cost = Number(costXp) || 0
      if ((profile?.xp || 0) < cost) {
        const error = new Error('XP insuficiente')
        report(error, 'XP insuficiente')
        throw error
      }

      const { error } = await supabase
        .from('rewards')
        .update({ claimed_at: new Date().toISOString() })
        .eq('id', id)
        .eq('user_id', user.id)

      if (error) {
        report(error, 'Não foi possível resgatar a recompensa.')
        throw error
      }

      const { error: xpError } = await supabase
        .from('profiles')
        .update({ xp: (profile?.xp || 0) - cost })
        .eq('id', user.id)

      if (xpError) {
        report(xpError, 'A recompensa foi marcada, mas o XP não foi descontado.')
        throw xpError
      }

      await refreshProfile()
      await fetchRewards()
      notify('Recompensa reivindicada.', 'success')
    },
    [user, profile, refreshProfile, fetchRewards, notify, report],
  )

  const deleteReward = useCallback(
    async (id) => {
      if (!user) throw new Error('Usuário não autenticado.')
      const { error } = await supabase.from('rewards').delete().eq('id', id).eq('user_id', user.id)
      if (error) {
        report(error, 'Não foi possível apagar a recompensa.')
        throw error
      }
      await fetchRewards()
    },
    [user, fetchRewards, report],
  )

  useEffect(() => {
    if (!user) return undefined
    let cancelled = false

    async function load() {
      setLoading(true)
      await fetchRewards()
      if (!cancelled) setLoading(false)
    }

    load()

    const channel = supabase
      .channel(`rewards-${user.id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'rewards', filter: `user_id=eq.${user.id}` },
        () => fetchRewards(),
      )
      .subscribe()

    return () => {
      cancelled = true
      supabase.removeChannel(channel)
    }
  }, [user, fetchRewards])

  return { rewards, loading, fetchRewards, addReward, claimReward, deleteReward }
}
