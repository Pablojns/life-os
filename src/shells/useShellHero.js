import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import { getPlan } from '../config/plans'
import { xpInCurrentLevel } from '../lib/xp'

export function useShellHero() {
  const { profile, user } = useAuth()
  const { labels, displayRank, theme } = useTheme()
  const navigate = useNavigate()
  const name = profile?.name || user?.user_metadata?.name || 'Aventureiro'
  const initial = name.trim().charAt(0).toUpperCase() || 'A'
  const xp = profile?.total_xp ?? profile?.xp ?? 0
  const level = profile?.level || 1
  const rank = displayRank(level)
  const currentXp = xpInCurrentLevel(xp)
  const planLabel = getPlan(profile?.plan).label

  return {
    theme,
    labels,
    name,
    initial,
    xp,
    level,
    rank,
    currentXp,
    planLabel,
    navigate,
  }
}
