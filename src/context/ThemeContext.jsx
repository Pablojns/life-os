/**
 * Tema visual ativo via data-theme no <html>.
 * Persiste em profiles.skin_active.
 */
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { useAuth } from './AuthContext'
import { THEMES } from '../themes'
import { rankFromLevel } from '../lib/xp'

const ThemeContext = createContext(null)

export const availableThemes = THEMES.map((theme) => ({
  name: theme.name,
  label: theme.label,
  plan: theme.plan,
  emoji: theme.emoji,
  previewColors: theme.previewColors,
  description: theme.description,
}))

export const PLAN_LABELS = {
  free: 'Livre',
  monthly: 'Mensal',
  quarterly: 'Trimestral',
  semiannual: 'Semestral',
  annual: 'Anual',
}

function narutoRank(level) {
  if (level <= 5) return { name: 'Genin', kanji: '下忍' }
  if (level <= 10) return { name: 'Chunin', kanji: '中忍' }
  if (level <= 20) return { name: 'Jonin', kanji: '上忍' }
  if (level <= 30) return { name: 'ANBU', kanji: '暗部' }
  if (level <= 50) return { name: 'Kage', kanji: '影' }
  return { name: 'Seis Caminhos', kanji: '六道' }
}

function soloRank(level) {
  if (level <= 5) return { name: 'E-Rank' }
  if (level <= 10) return { name: 'D-Rank' }
  if (level <= 15) return { name: 'C-Rank' }
  if (level <= 20) return { name: 'B-Rank' }
  if (level <= 25) return { name: 'A-Rank' }
  if (level <= 35) return { name: 'S-Rank' }
  if (level <= 50) return { name: 'National Level' }
  return { name: 'Monarch' }
}

export function displayRankFor(themeName, level) {
  const safe = Math.max(1, Number(level) || 1)
  if (themeName === 'naruto') return narutoRank(safe)
  if (themeName === 'solo') return soloRank(safe)
  return { name: rankFromLevel(safe) }
}

const THEME_COPY = {
  skyrim: {
    quests: 'Missões',
    habits: 'Hábitos',
    notes: 'Pergaminhos',
    rewards: 'Recompensas',
    xp: 'XP',
    level: 'Nível',
    complete: '⚔ Completar',
    add: '+ Nova Missão',
    toastPrefix: '☽',
    levelUp: 'Você evoluiu, Dovahkiin',
    questComplete: (xp) => `Missão concluída. +${xp} XP`,
  },
  clean: {
    quests: 'Tarefas',
    habits: 'Hábitos',
    notes: 'Anotações',
    rewards: 'Recompensas',
    xp: 'Pontos',
    level: 'Nível',
    complete: '✓ Concluir',
    add: '+ Nova tarefa',
    toastPrefix: '',
    levelUp: 'Você subiu de nível.',
    questComplete: (xp) => `Tarefa concluída. +${xp} pontos`,
  },
  naruto: {
    quests: 'Missões de Missão',
    habits: 'Treinamento Diário',
    notes: 'Pergaminhos de Inteligência',
    rewards: 'Prêmios da Aldeia',
    xp: 'Chakra',
    level: 'Rank Ninja',
    complete: 'Missão cumprida',
    add: '+ Novo pergaminho',
    toastPrefix: '🍃',
    levelUp: 'Você ficou mais forte, ninja!',
    questComplete: (xp) => `Missão cumprida! +${xp} chakra`,
    missionRank: (xp) => {
      const value = Number(xp) || 0
      if (value >= 50) return 'S-rank'
      if (value >= 35) return 'A-rank'
      if (value >= 20) return 'B-rank'
      if (value >= 10) return 'C-rank'
      return 'D-rank'
    },
  },
  solo: {
    quests: 'Quests do Sistema',
    habits: 'Treinamento de Hunter',
    notes: 'Registros do Sistema',
    rewards: 'Drops de Dungeon',
    xp: 'EXP',
    level: 'Rank',
    complete: 'Completar quest',
    add: '+ Nova quest',
    toastPrefix: '[SISTEMA]',
    levelUp: 'Quest completada. EXP adquirida.',
    questComplete: (xp) => `Quest completada. EXP adquirida. +${xp}`,
  },
  cyberpunk: {
    quests: 'Jobs',
    habits: 'Rotina',
    notes: 'Logs',
    rewards: 'Loot',
    xp: 'XP',
    level: 'Nível',
    complete: 'Concluir',
    add: '+ Novo job',
    toastPrefix: '◆',
    levelUp: 'Upgrade instalado.',
    questComplete: (xp) => `Job fechado. +${xp} XP`,
  },
  ghibli: {
    quests: 'Missões',
    habits: 'Rituais',
    notes: 'Caderno',
    rewards: 'Presentes',
    xp: 'XP',
    level: 'Nível',
    complete: 'Concluir',
    add: '+ Nova missão',
    toastPrefix: '🍃',
    levelUp: 'O vento mudou a seu favor.',
    questComplete: (xp) => `Missão concluída. +${xp} XP`,
  },
  legendary: {
    quests: 'Missões',
    habits: 'Hábitos',
    notes: 'Pergaminhos',
    rewards: 'Tesouros',
    xp: 'XP',
    level: 'Nível',
    complete: '⚔ Completar',
    add: '+ Nova Missão',
    toastPrefix: '🐉',
    levelUp: 'A lenda cresce.',
    questComplete: (xp) => `Missão concluída. +${xp} XP`,
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

  useEffect(() => {
    if (theme !== 'clean') return undefined
    function onMove(event) {
      document.querySelectorAll('[class*="card"], [class*="account"]').forEach((node) => {
        const box = node.getBoundingClientRect()
        node.style.setProperty('--glow-x', `${event.clientX - box.left}px`)
        node.style.setProperty('--glow-y', `${event.clientY - box.top}px`)
      })
    }
    window.addEventListener('mousemove', onMove)
    return () => window.removeEventListener('mousemove', onMove)
  }, [theme])

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
  const displayRank = useCallback((level) => displayRankFor(theme, level), [theme])

  const value = useMemo(
    () => ({
      theme,
      setTheme,
      hasThemeAccess,
      availableThemes,
      labels,
      displayRank,
    }),
    [theme, setTheme, hasThemeAccess, labels, displayRank],
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
