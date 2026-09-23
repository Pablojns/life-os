/**
 * Tema visual ativo via data-theme no <html>.
 * Persiste em profiles.skin_active.
 */
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { useAuth } from './AuthContext'

const ThemeContext = createContext(null)

export const availableThemes = [
  { name: 'skyrim', label: 'Skyrim', plan: 'free', emoji: '🏰' },
  { name: 'clean', label: 'Clean', plan: 'free', emoji: '✨' },
  { name: 'naruto', label: 'Naruto', plan: 'quarterly', emoji: '🍥' },
  { name: 'solo', label: 'Solo Leveling', plan: 'quarterly', emoji: '🗡️' },
  { name: 'cyberpunk', label: 'Cyberpunk', plan: 'semiannual', emoji: '🌃' },
  { name: 'ghibli', label: 'Ghibli', plan: 'semiannual', emoji: '🍃' },
  { name: 'legendary', label: 'Legendary', plan: 'annual', emoji: '🐉' },
]

export const PLAN_LABELS = {
  free: 'Livre',
  monthly: 'Mensal',
  quarterly: 'Trimestral',
  semiannual: 'Semestral',
  annual: 'Anual',
}

const THEME_COPY = {
  skyrim: {
    quests: 'Missões',
    xp: 'XP',
    level: 'Nível',
    complete: '⚔ Completar',
    add: '+ Nova Missão',
  },
  clean: {
    quests: 'Tarefas',
    xp: 'Pontos',
    level: 'Nível',
    complete: '✓ Concluir',
    add: '+ Nova tarefa',
  },
}

function requiredPlanFor(themeName) {
  if (themeName === 'skyrim' || themeName === 'clean') return 'free'
  if (themeName === 'naruto' || themeName === 'solo') return 'quarterly'
  if (themeName === 'cyberpunk' || themeName === 'ghibli') return 'semiannual'
  if (themeName === 'legendary') return 'annual'
  return 'annual'
}

function applyToDocument(themeName) {
  document.documentElement.setAttribute('data-theme', themeName)
}

export function ThemeProvider({ children }) {
  const { profile, updateProfile, hasAccess } = useAuth()
  const [theme, setThemeState] = useState('skyrim')

  useEffect(() => {
    applyToDocument(theme)
  }, [theme])

  useEffect(() => {
    const saved = profile?.skin_active
    if (saved) setThemeState(saved)
  }, [profile?.skin_active])

  const hasThemeAccess = useCallback(
    (themeName) => {
      const required = requiredPlanFor(themeName)
      if (required === 'free') return true
      return hasAccess(required)
    },
    [hasAccess],
  )

  const setTheme = useCallback(
    async (newTheme) => {
      if (!hasThemeAccess(newTheme)) return false
      setThemeState(newTheme)
      applyToDocument(newTheme)
      try {
        await updateProfile({ skin_active: newTheme })
      } catch (error) {
        console.error(error)
      }
      return true
    },
    [hasThemeAccess, updateProfile],
  )

  const labels = THEME_COPY[theme] || THEME_COPY.skyrim

  const value = useMemo(
    () => ({
      theme,
      setTheme,
      hasThemeAccess,
      availableThemes,
      labels,
    }),
    [theme, setTheme, hasThemeAccess, labels],
  )

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme deve ser usado dentro de ThemeProvider')
  }
  return context
}
