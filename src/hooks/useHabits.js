/**
 * Hábitos e checks mensais no Supabase, com realtime.
 */
import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { sanitize, sanitizeNumber } from '../lib/sanitize'
import { daysInMonth, monthDate, normalizeDate, toISODate } from '../lib/dates'
import { gainXP } from '../lib/xp'
import { useAuth } from '../context/AuthContext'
import { useNotifications } from './useNotifications.jsx'

export function getPct(habitId, checks, totalDays) {
  if (!totalDays) return 0
  const count = checks.filter((check) => check.habit_id === habitId).length
  return Math.round((count / totalDays) * 100)
}

export function useHabits() {
  const { user, refreshProfile } = useAuth()
  const { notify } = useNotifications()
  const [habits, setHabits] = useState([])
  const [checks, setChecks] = useState([])
  const [loading, setLoading] = useState(true)

  const report = useCallback(
    (error, fallback) => {
      console.error(error)
      notify(error?.message || fallback, 'error')
    },
    [notify],
  )

  const fetchHabits = useCallback(async () => {
    if (!user) return []
    const { data, error } = await supabase
      .from('habits')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: true })

    if (error) {
      report(error, 'Não foi possível carregar os hábitos.')
      return []
    }

    setHabits(data || [])
    return data || []
  }, [user, report])

  const fetchChecks = useCallback(
    async (month, year) => {
      if (!user) return []
      const start = monthDate(year, month, 1)
      const end = monthDate(year, month, daysInMonth(month, year))
      const { data, error } = await supabase
        .from('habit_checks')
        .select('*')
        .eq('user_id', user.id)
        .gte('check_date', start)
        .lte('check_date', end)

      if (error) {
        report(error, 'Não foi possível carregar os checks do mês.')
        return []
      }

      setChecks(data || [])
      return data || []
    },
    [user, report],
  )

  const addHabit = useCallback(
    async (name, xpPerDay) => {
      if (!user) throw new Error('Usuário não autenticado.')
      const { error } = await supabase.from('habits').insert({
        user_id: user.id,
        name: sanitize(name),
        xp_per_day: sanitizeNumber(xpPerDay) || 5,
      })
      if (error) {
        report(error, 'Não foi possível criar o hábito.')
        throw error
      }
      await fetchHabits()
      notify('Hábito adicionado à rotina.', 'success')
    },
    [user, fetchHabits, notify, report],
  )

  const toggleCheck = useCallback(
    async (habitId, date) => {
      if (!user) throw new Error('Usuário não autenticado.')
      const existing = checks.find(
        (check) => check.habit_id === habitId && normalizeDate(check.check_date || check.date) === date,
      )

      if (existing) {
        const { error } = await supabase
          .from('habit_checks')
          .delete()
          .eq('id', existing.id)
          .eq('user_id', user.id)
        if (error) {
          report(error, 'Não foi possível desmarcar o hábito.')
          throw error
        }
        setChecks((current) => current.filter((check) => check.id !== existing.id))
        return null
      }

      const { data, error } = await supabase
        .from('habit_checks')
        .insert({ user_id: user.id, habit_id: habitId, check_date: date })
        .select()
        .single()

      if (error) {
        report(error, 'Não foi possível marcar o hábito.')
        throw error
      }

      setChecks((current) => [...current, data])

      const { data: mainGoal } = await supabase
        .from('financial_goals')
        .select('id, current_amount')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true })
        .limit(1)
        .maybeSingle()

      if (mainGoal?.id) {
        await supabase
          .from('financial_goals')
          .update({ current_amount: Number(mainGoal.current_amount || 0) + 1 })
          .eq('id', mainGoal.id)
          .eq('user_id', user.id)
        notify('Hábito concluído! +R$ 1,00 na sua meta 🎯', 'success')
      }

      if (date === toISODate()) {
        const habit = habits.find((item) => item.id === habitId)
        return gainXP(habit?.xp_per_day || 0, { userId: user.id, refreshProfile })
      }

      return null
    },
    [user, checks, habits, refreshProfile, report, notify],
  )

  const deleteHabit = useCallback(
    async (id) => {
      if (!user) throw new Error('Usuário não autenticado.')
      const { error: checkError } = await supabase
        .from('habit_checks')
        .delete()
        .eq('habit_id', id)
        .eq('user_id', user.id)
      if (checkError) {
        report(checkError, 'Não foi possível limpar os checks do hábito.')
        throw checkError
      }

      const { error } = await supabase.from('habits').delete().eq('id', id).eq('user_id', user.id)
      if (error) {
        report(error, 'Não foi possível apagar o hábito.')
        throw error
      }

      setHabits((current) => current.filter((habit) => habit.id !== id))
      setChecks((current) => current.filter((check) => check.habit_id !== id))
    },
    [user, report],
  )

  useEffect(() => {
    if (!user) return undefined
    const now = new Date()
    let cancelled = false

    async function load() {
      setLoading(true)
      await Promise.all([fetchHabits(), fetchChecks(now.getMonth() + 1, now.getFullYear())])
      if (!cancelled) setLoading(false)
    }

    load()

    const habitsChannel = supabase
      .channel(`habits-${user.id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'habits', filter: `user_id=eq.${user.id}` },
        () => fetchHabits(),
      )
      .subscribe()

    const checksChannel = supabase
      .channel(`habit-checks-${user.id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'habit_checks', filter: `user_id=eq.${user.id}` },
        () => fetchChecks(now.getMonth() + 1, now.getFullYear()),
      )
      .subscribe()

    return () => {
      cancelled = true
      supabase.removeChannel(habitsChannel)
      supabase.removeChannel(checksChannel)
    }
  }, [user, fetchHabits, fetchChecks])

  return {
    habits,
    checks,
    loading,
    fetchHabits,
    fetchChecks,
    addHabit,
    toggleCheck,
    deleteHabit,
    getPct,
  }
}
