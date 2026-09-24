import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { sanitize, sanitizeNumber } from '../lib/sanitize'
import { useAuth } from '../context/AuthContext'
import { useNotifications } from './useNotifications'

export function useRewards() {
  const { user, profile, refreshProfile } = useAuth()
  const { notify } = useNotifications()
  const [rewards, setRewards] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const fetchRewards = useCallback(async () => {
    if (!user) return []
    const { data, error } = await supabase
      .from('rewards')
      .select('*')
      .eq('user_id', user.id)
      .is('claimed_at', null)
      .order('created_at', { ascending: false })
    if (error) {
      notify(error.message, 'error')
      return []
    }
    setRewards(data || [])
    return data || []
  }, [user, notify])

  const addReward = useCallback(
    async (name: string, costXp: number) => {
      if (!user) throw new Error('Usuário não autenticado.')
      const { error } = await supabase.from('rewards').insert({
        user_id: user.id,
        name: sanitize(name),
        cost_xp: sanitizeNumber(costXp) || 0,
      })
      if (error) throw error
      await fetchRewards()
      notify('Recompensa adicionada ao baú.', 'success')
    },
    [user, fetchRewards, notify],
  )

  const claimReward = useCallback(
    async (id: string, costXp: number) => {
      if (!user) throw new Error('Usuário não autenticado.')
      if ((profile?.xp || 0) < costXp) {
        notify('XP insuficiente', 'error')
        throw new Error('XP insuficiente')
      }
      const { error } = await supabase
        .from('rewards')
        .update({ claimed_at: new Date().toISOString() })
        .eq('id', id)
        .eq('user_id', user.id)
      if (error) throw error
      await supabase.from('profiles').update({ xp: (profile?.xp || 0) - costXp }).eq('id', user.id)
      await refreshProfile()
      await fetchRewards()
      notify('Recompensa reivindicada.', 'success')
    },
    [user, profile, refreshProfile, fetchRewards, notify],
  )

  useEffect(() => {
    if (!user) return
    let cancelled = false
    fetchRewards().finally(() => {
      if (!cancelled) setLoading(false)
    })
    return () => {
      cancelled = true
    }
  }, [user, fetchRewards])

  return { rewards, loading, fetchRewards, addReward, claimReward }
}
