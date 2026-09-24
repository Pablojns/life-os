import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { sanitize, sanitizeNumber } from '../lib/sanitize'
import { daysInMonth, monthDate, normalizeDate, toISODate } from '../lib/dates'
import { gainXP } from '../lib/xp'
import { useAuth } from '../context/AuthContext'
import { useNotifications } from './useNotifications'

export function getPct(habitId: string, checks: any[], totalDays: number) {
  if (!totalDays) return 0
  return Math.round((checks.filter((check) => check.habit_id === habitId).length / totalDays) * 100)
}

export function useHabits() {
  const { user, refreshProfile } = useAuth()
  const { notify } = useNotifications()
  const [habits, setHabits] = useState<any[]>([])
  const [checks, setChecks] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const report = useCallback(
    (error: any, fallback: string) => {
      console.error(error)
      notify(error?.message || fallback, 'error')
    },
    [notify],
  )

  const fetchHabits = useCallback(async () => {
    if (!user) return []
    const { data, error } = await supabase.from('habits').select('*').eq('user_id', user.id).order('created_at')
    if (error) {
      report(error, 'Não foi possível carregar os hábitos.')
      return []
    }
    setHabits(data || [])
    return data || []
  }, [user, report])

  const fetchChecks = useCallback(
    async (month: number, year: number) => {
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
    async (name: string, xpPerDay: number) => {
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
    async (habitId: string, date: string) => {
      if (!user) throw new Error('Usuário não autenticado.')
      const existing = checks.find((check) => check.habit_id === habitId && normalizeDate(check.check_date) === date)
      if (existing) {
        const { error } = await supabase.from('habit_checks').delete().eq('id', existing.id).eq('user_id', user.id)
        if (error) throw error
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
      if (date === toISODate()) {
        const habit = habits.find((item) => item.id === habitId)
        return gainXP(habit?.xp_per_day || 0, { userId: user.id, refreshProfile })
      }
      return null
    },
    [user, checks, habits, refreshProfile, report],
  )

  useEffect(() => {
    if (!user) return
    const now = new Date()
    let cancelled = false
    async function load() {
      setLoading(true)
      await Promise.all([fetchHabits(), fetchChecks(now.getMonth() + 1, now.getFullYear())])
      if (!cancelled) setLoading(false)
    }
    load()
    return () => {
      cancelled = true
    }
  }, [user, fetchHabits, fetchChecks])

  return { habits, checks, loading, fetchHabits, addHabit, toggleCheck, getPct }
}
