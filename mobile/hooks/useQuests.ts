import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { sanitize, sanitizeNumber } from '../lib/sanitize'
import { gainXP } from '../lib/xp'
import { useAuth } from '../context/AuthContext'
import { useNotifications } from './useNotifications'

export function useQuests() {
  const { user, refreshProfile } = useAuth()
  const { notify } = useNotifications()
  const [quests, setQuests] = useState<any[]>([])
  const [done, setDone] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const report = useCallback(
    (error: any, fallback: string) => {
      console.error(error)
      notify(error?.message || fallback, 'error')
    },
    [notify],
  )

  const fetchQuests = useCallback(async () => {
    if (!user) return []
    const { data, error } = await supabase
      .from('quests')
      .select('*')
      .eq('user_id', user.id)
      .is('completed_at', null)
      .order('created_at', { ascending: false })
    if (error) {
      report(error, 'Não foi possível carregar as missões.')
      return []
    }
    setQuests(data || [])
    return data || []
  }, [user, report])

  const fetchDone = useCallback(async () => {
    if (!user) return []
    const { data, error } = await supabase
      .from('quests')
      .select('*')
      .eq('user_id', user.id)
      .not('completed_at', 'is', null)
      .order('completed_at', { ascending: false })
    if (error) {
      report(error, 'Não foi possível carregar o histórico de missões.')
      return []
    }
    setDone(data || [])
    return data || []
  }, [user, report])

  const addQuest = useCallback(
    async (title: string, reward: string, xp: number) => {
      if (!user) throw new Error('Usuário não autenticado.')
      const { error } = await supabase.from('quests').insert({
        user_id: user.id,
        title: sanitize(title),
        reward: sanitize(reward) || null,
        xp: sanitizeNumber(xp) || 10,
      })
      if (error) {
        report(error, 'Não foi possível criar a missão.')
        throw error
      }
      await fetchQuests()
      notify('Missão registrada no grimório.', 'success')
    },
    [user, fetchQuests, notify, report],
  )

  const completeQuest = useCallback(
    async (id: string, xp: number) => {
      if (!user) throw new Error('Usuário não autenticado.')
      const { error } = await supabase
        .from('quests')
        .update({ completed_at: new Date().toISOString() })
        .eq('id', id)
        .eq('user_id', user.id)
      if (error) {
        report(error, 'Não foi possível concluir a missão.')
        throw error
      }
      const progress = await gainXP(xp, { userId: user.id, refreshProfile })
      await Promise.all([fetchQuests(), fetchDone()])
      return progress
    },
    [user, refreshProfile, fetchQuests, fetchDone, report],
  )

  const deleteQuest = useCallback(
    async (id: string) => {
      if (!user) throw new Error('Usuário não autenticado.')
      const { error } = await supabase.from('quests').delete().eq('id', id).eq('user_id', user.id)
      if (error) {
        report(error, 'Não foi possível apagar a missão.')
        throw error
      }
      await Promise.all([fetchQuests(), fetchDone()])
    },
    [user, fetchQuests, fetchDone, report],
  )

  useEffect(() => {
    if (!user) return
    let cancelled = false
    async function load() {
      setLoading(true)
      await Promise.all([fetchQuests(), fetchDone()])
      if (!cancelled) setLoading(false)
    }
    load()
    const channel = supabase
      .channel(`quests-mobile-${user.id}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'quests', filter: `user_id=eq.${user.id}` }, () => {
        fetchQuests()
        fetchDone()
      })
      .subscribe()
    return () => {
      cancelled = true
      supabase.removeChannel(channel)
    }
  }, [user, fetchQuests, fetchDone])

  return { quests, done, loading, fetchQuests, addQuest, completeQuest, deleteQuest }
}
