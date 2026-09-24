/**
 * Autenticação e perfil do usuário (Supabase Auth + tabela profiles).
 */
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabase'
import { SKIP_AUTO_LOGIN_KEY } from '../config/testUser'

const PLAN_HIERARCHY = ['free', 'monthly', 'quarterly', 'semiannual', 'annual']

const AuthContext = createContext(null)

function getProfilePlan(profile) {
  return profile?.plan || profile?.plan_id || 'free'
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  const loadProfile = useCallback(async (userId) => {
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

    async function restoreSession() {
      const {
        data: { session },
      } = await supabase.auth.getSession()
      if (cancelled) return

      const nextUser = session?.user ?? null
      setUser(nextUser)

      if (nextUser) {
        try {
          await loadProfile(nextUser.id)
        } catch {
          if (!cancelled) setProfile(null)
        }
      } else {
        setProfile(null)
      }

      if (!cancelled) setLoading(false)
    }

    restoreSession()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      const nextUser = session?.user ?? null
      setUser(nextUser)

      // Evita deadlock do supabase-js ao consultar o banco dentro do callback.
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
      subscription.unsubscribe()
    }
  }, [loadProfile])

  useEffect(() => {
    if (!user?.id) return undefined

    const channel = supabase
      .channel(`profile-${user.id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'profiles', filter: `id=eq.${user.id}` },
        (payload) => {
          if (payload.new) setProfile(payload.new)
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [user?.id])

  const signUp = useCallback(
    async (email, password, name) => {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { name },
          emailRedirectTo: `${window.location.origin}/dashboard`,
        },
      })
      if (error) throw error

      if (data.user?.id) {
        await supabase.from('profiles').update({ name }).eq('id', data.user.id)
        if (data.session) {
          try {
            await loadProfile(data.user.id)
          } catch {
            setProfile(null)
          }
        }
      }

      return data
    },
    [loadProfile],
  )

  const signIn = useCallback(async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
    return data
  }, [])

  const signInWithGoogle = useCallback(async () => {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/dashboard`,
      },
    })
    if (error) throw error
    return data
  }, [])

  const signOut = useCallback(async () => {
    sessionStorage.setItem(SKIP_AUTO_LOGIN_KEY, '1')
    const { error } = await supabase.auth.signOut()
    if (error) throw error
    setUser(null)
    setProfile(null)
  }, [])

  const updateProfile = useCallback(
    async (updates) => {
      if (!user) throw new Error('É preciso estar autenticado para atualizar o perfil.')

      const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.id)
        .select()
        .maybeSingle()

      if (error) throw error
      if (!data) {
        const { data: created, error: insertError } = await supabase
          .from('profiles')
          .insert({ id: user.id, ...updates })
          .select()
          .maybeSingle()
        if (insertError) throw insertError
        setProfile(created)
        return created
      }
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
    (requiredPlan) => {
      const currentIndex = PLAN_HIERARCHY.indexOf(getProfilePlan(profile))
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
      signUp,
      signIn,
      signInWithGoogle,
      signOut,
      updateProfile,
      hasAccess,
      loadProfile,
      refreshProfile,
    }),
    [user, profile, loading, signUp, signIn, signInWithGoogle, signOut, updateProfile, hasAccess, loadProfile, refreshProfile],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de AuthProvider')
  }
  return context
}
