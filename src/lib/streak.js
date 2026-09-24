import { supabase } from './supabase'
import { toISODate } from './dates'

export const STREAK_LABELS = {
  procrastinator: 'Dias sem empurrar',
  dovahkiin: 'Dias sem empurrar',
  indebted: 'Dias registrando gastos',
  anxious: 'Dias completando sem exagerar',
  ambitious: 'Dias com foco em 1 projeto',
  hunter: 'Dias com foco em 1 projeto',
  disorganized: 'Dias consecutivos',
  ninja: 'Dias consecutivos',
}

export function streakLabel(profileType) {
  return STREAK_LABELS[profileType] || 'Dias consecutivos'
}

export function streakLine(theme, days, profileType) {
  const count = Number(days) || 0
  const name = streakLabel(profileType)
  if (theme === 'skyrim') return `🔥 Streak: ${count} dias como Dovahkiin · ${name}`
  if (theme === 'naruto') return `Sequência: ${count} dias de treinamento ninja · ${name}`
  if (theme === 'solo') return `[STREAK] ${count} dias de atividade contínua · ${name}`
  return `${count} dias consecutivos · ${name}`
}

function yesterdayISO(today = toISODate()) {
  const date = new Date(`${today}T12:00:00`)
  date.setDate(date.getDate() - 1)
  return toISODate(date)
}

export async function updateStreak(userId) {
  if (!userId) return null
  const today = toISODate()
  const { data: current, error } = await supabase
    .from('profiles')
    .select('streak_days, last_active_date, longest_streak')
    .eq('id', userId)
    .single()
  if (error) return null

  const last = current?.last_active_date ? String(current.last_active_date).slice(0, 10) : null
  let streak = Number(current?.streak_days) || 0
  if (last === today) {
    return { streak_days: streak, last_active_date: last, longest_streak: current?.longest_streak || streak }
  }
  if (last === yesterdayISO(today)) streak += 1
  else streak = 1

  const longest = Math.max(Number(current?.longest_streak) || 0, streak)
  const next = { streak_days: streak, last_active_date: today, longest_streak: longest }
  await supabase.from('profiles').update(next).eq('id', userId)
  return next
}
