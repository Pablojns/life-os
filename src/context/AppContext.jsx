/**
 * Estado global do app: plano, XP e gamificação.
 * O perfil autenticado vem do AuthContext (tabela profiles).
 */
import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { DEFAULT_PLAN_ID, getPlan } from '../config/plans'
import { useAuth } from './AuthContext'

const AppContext = createContext(null)

export function AppProvider({ children }) {
  const { user, profile: authProfile } = useAuth()
  const [planId, setPlanId] = useState(DEFAULT_PLAN_ID)
  const [level, setLevel] = useState(1)
  const [xp, setXp] = useState(0)

  useEffect(() => {
    const nextPlan = authProfile?.plan || authProfile?.plan_id
    if (nextPlan) setPlanId(nextPlan)
    if (typeof authProfile?.level === 'number') setLevel(authProfile.level)
    if (typeof authProfile?.xp === 'number') setXp(authProfile.xp)
  }, [authProfile])

  const plan = useMemo(() => getPlan(planId), [planId])

  const profile = useMemo(() => {
    if (!user && !authProfile) return null
    return {
      ...authProfile,
      id: authProfile?.id || user?.id,
      email: authProfile?.email || user?.email,
      name: authProfile?.name || user?.user_metadata?.name || '',
      displayName:
        authProfile?.name ||
        user?.user_metadata?.name ||
        user?.email?.split('@')[0] ||
        'Aventureiro',
    }
  }, [user, authProfile])

  const value = useMemo(
    () => ({
      profile,
      planId,
      plan,
      setPlanId,
      level,
      setLevel,
      xp,
      setXp,
    }),
    [profile, planId, plan, level, xp],
  )

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export function useApp() {
  const context = useContext(AppContext)
  if (!context) {
    throw new Error('useApp deve ser usado dentro de AppProvider')
  }
  return context
}
