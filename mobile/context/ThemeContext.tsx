import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { getTheme, type ThemeTokens } from '../themes'
import { useAuth } from './AuthContext'

const ThemeContext = createContext<{ theme: ThemeTokens; name: string } | null>(null)

export function ThemeProvider({ children }: { children: ReactNode }) {
  const { profile } = useAuth()
  const [name, setName] = useState('skyrim')

  useEffect(() => {
    if (profile?.skin_active) setName(profile.skin_active)
  }, [profile?.skin_active])

  const theme = useMemo(() => getTheme(name), [name])
  return <ThemeContext.Provider value={{ theme, name }}>{children}</ThemeContext.Provider>
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (!context) throw new Error('useTheme deve ser usado dentro de ThemeProvider')
  return context
}
