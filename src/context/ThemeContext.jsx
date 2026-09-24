/**
 * Tema visual ativo via data-theme no <html>.
 * Persiste em profiles.skin_active.
 */
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { useAuth } from './AuthContext'
import { THEMES } from '../themes'
import { getRankMeta } from '../lib/rankByTheme'

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

export function displayRankFor(themeName, level) {
  return getRankMeta(level, themeName)
}

const THEME_COPY = {
  skyrim: {
    quests: 'Missões',
    habits: 'Disciplina Diária',
    notes: 'Tomo de Conhecimento',
    rewards: 'Saque da Taverna',
    stats: 'Atributos do Herói',
    finance: 'Tesouro do Reino',
    agenda: 'Agenda do Reino',
    coach: 'Oráculo',
    arena: 'Arena',
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
    notes: 'Notas',
    rewards: 'Recompensas',
    stats: 'Atributos',
    finance: 'Finanças',
    agenda: 'Agenda',
    coach: 'Coach',
    arena: 'Arena',
    xp: 'Pontos',
    level: 'Nível',
    complete: '✓ Concluir',
    add: '+ Nova tarefa',
    toastPrefix: '',
    levelUp: 'Você subiu de nível.',
    questComplete: (xp) => `Tarefa concluída. +${xp} pontos`,
  },
  naruto: {
    quests: 'Missões da Aldeia',
    habits: 'Treinamento Ninja',
    notes: 'Inteligência da ANBU',
    rewards: 'Prêmios da Aldeia',
    stats: 'Ficha do Ninja',
    finance: 'Tesouraria da Aldeia',
    agenda: 'Agenda da Aldeia',
    coach: 'Conselho da Hokage',
    arena: 'Arena',
    xp: 'Chakra',
    level: 'Rank',
    complete: '✓ Missão Cumprida',
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
    habits: 'Treinamento de Caçador',
    notes: 'Registros do Sistema',
    rewards: 'Drops de Dungeon',
    stats: 'Status do Caçador',
    finance: 'Inventário de Recursos',
    agenda: 'Agenda do Sistema',
    coach: 'Assistente do Sistema',
    arena: 'Arena',
    xp: 'EXP',
    level: 'Rank',
    complete: '▶ Completar Quest',
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
    stats: 'Stats',
    finance: 'Creds',
    coach: 'Netrunner',
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
    stats: 'Espírito',
    finance: 'Poupanca',
    coach: 'Guia',
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
    stats: 'Atributos',
    finance: 'Tesouro',
    coach: 'Oráculo',
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
