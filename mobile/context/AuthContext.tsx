import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import * as Linking from 'expo-linking'
import * as WebBrowser from 'expo-web-browser'
import { supabase } from '../lib/supabase'

WebBrowser.maybeCompleteAuthSession()

const PLAN_HIERARCHY = ['free', 'monthly', 'quarterly', 'semiannual', 'annual']
const AuthContext = createContext<any>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  const loadProfile = useCallback(async (userId?: string) => {
    if (!userId) {
      setProfile(null)
      return null
    }
    const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).single()
    if (error) {
      setProfile(null)
      throw error
    }
    setProfile(data)
    return data
  }, [])

  useEffect(() => {
    let cancelled = false
    async function restore() {
      const { data } = await supabase.auth.getSession()
      if (cancelled) return
      const nextUser = data.session?.user ?? null
      setUser(nextUser)
      if (nextUser) {
        try {
          await loadProfile(nextUser.id)
        } catch {
          if (!cancelled) setProfile(null)
        }
      }
      if (!cancelled) setLoading(false)
    }
    restore()
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      const nextUser = session?.user ?? null
      setUser(nextUser)
      queueMicrotask(async () => {
        if (cancelled) return
        if (nextUser) {
          try {
            await loadProfile(nextUser.id)
          } catch {
            if (!cancelled) setProfile(null)
          }
        } else {
          setProfile(null)
        }
      })
    })
    return () => {
      cancelled = true
      data.subscription.unsubscribe()
    }
  }, [loadProfile])

  const signIn = useCallback(async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
    return data
  }, [])

  const signUp = useCallback(
    async (email: string, password: string, name: string) => {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { name }, emailRedirectTo: Linking.createURL('/') },
      })
      if (error) throw error
      if (data.user?.id) {
        await supabase.from('profiles').update({ name }).eq('id', data.user.id)
        if (data.session) await loadProfile(data.user.id)
      }
      return data
    },
    [loadProfile],
  )

  const signInWithGoogle = useCallback(async () => {
    const redirectTo = Linking.createURL('auth/callback')
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo, skipBrowserRedirect: true },
    })
    if (error) throw error
    if (data.url) {
      const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo)
      if (result.type === 'success' && result.url) {
        const url = new URL(result.url)
        const code = url.searchParams.get('code')
        if (code) await supabase.auth.exchangeCodeForSession(code)
      }
    }
    return data
  }, [])

  const signOut = useCallback(async () => {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
    setUser(null)
    setProfile(null)
  }, [])

  const updateProfile = useCallback(
    async (updates: Record<string, unknown>) => {
      if (!user) throw new Error('É preciso estar autenticado para atualizar o perfil.')
      const { data, error } = await supabase.from('profiles').update(updates).eq('id', user.id).select().single()
      if (error) throw error
      setProfile(data)
      return data
    },
    [user],
  )

  const refreshProfile = useCallback(async () => {
    if (!user?.id) return null
    try {
      return await loadProfile(user.id)
    } catch (error) {
      console.error(error)
      return null
    }
  }, [user, loadProfile])

  const hasAccess = useCallback(
    (requiredPlan: string) => {
      const currentIndex = PLAN_HIERARCHY.indexOf(profile?.plan || 'free')
      const requiredIndex = PLAN_HIERARCHY.indexOf(requiredPlan)
      if (requiredIndex === -1) return false
      return currentIndex >= requiredIndex
    },
    [profile],
  )

  const value = useMemo(
    () => ({
      user,
      profile,
      loading,
      signIn,
      signUp,
      signInWithGoogle,
      signOut,
      updateProfile,
      hasAccess,
      loadProfile,
      refreshProfile,
    }),
    [user, profile, loading, signIn, signUp, signInWithGoogle, signOut, updateProfile, hasAccess, loadProfile, refreshProfile],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth deve ser usado dentro de AuthProvider')
  return context
}
