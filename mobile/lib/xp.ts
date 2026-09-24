import { supabase } from './supabase'

export const RANKS = ['Iniciante', 'Aprendiz', 'Guerreiro', 'Veterano', 'Elite', 'Mestre', 'Lendário', 'Dovahkiin']

export function rankFromLevel(level: number) {
  const safeLevel = Math.max(1, Number(level) || 1)
  return RANKS[Math.min(safeLevel, RANKS.length) - 1]
}

export function levelFromXP(totalXP: number) {
  return Math.floor(Math.max(0, Number(totalXP) || 0) / 100) + 1
}

export function xpInCurrentLevel(totalXP: number) {
  return Math.max(0, Number(totalXP) || 0) % 100
}

export async function gainXP(amount: number, { userId, refreshProfile }: { userId: string; refreshProfile?: () => Promise<unknown> }) {
  const { data: current, error: readError } = await supabase
    .from('profiles')
    .select('xp, total_xp, level')
    .eq('id', userId)
    .single()
  if (readError) throw readError

  const gained = Number(amount || 0)
  const totalXP = (current?.total_xp || current?.xp || 0) + gained
  const spendableXP = (current?.xp || 0) + gained
  const previousLevel = current?.level || levelFromXP(current?.total_xp || current?.xp || 0)
  const newLevel = levelFromXP(totalXP)
  const rank = rankFromLevel(newLevel)

  const { error } = await supabase
    .from('profiles')
    .update({
      xp: spendableXP,
      total_xp: totalXP,
      level: newLevel,
      rank,
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId)
  if (error) throw error
  if (refreshProfile) await refreshProfile()
  return { leveledUp: newLevel > previousLevel, newLevel, totalXP, rank }
}
