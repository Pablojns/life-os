import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { readQuiz } from '../lib/quiz'

const EXTRA_COLS =
  'id, onboarding_completed, profile_type, profile_name, quiz_answers, suggested_theme, wake_time, sleep_time, work_type, main_challenge'

function storageKey(userId) {
  return `lifeos-onboarding-${userId}`
}

function readLocal(userId) {
  if (!userId) return null
  try {
    return JSON.parse(localStorage.getItem(storageKey(userId)) || 'null')
  } catch {
    return null
  }
}

function writeLocal(userId, data) {
  localStorage.setItem(storageKey(userId), JSON.stringify(data))
}

function fromProfile(profile) {
  if (!profile) return null
  return {
    id: profile.id,
    onboarding_completed: profile.onboarding_completed,
    profile_type: profile.profile_type,
    profile_name: profile.profile_name,
    quiz_answers: profile.quiz_answers,
    suggested_theme: profile.suggested_theme,
    wake_time: profile.wake_time,
    sleep_time: profile.sleep_time,
    work_type: profile.work_type,
    main_challenge: profile.main_challenge,
  }
}

export function useUserProfile() {
  const { user } = useAuth()
  const [row, setRow] = useState(null)
  const [loading, setLoading] = useState(true)

  const fetchRow = useCallback(async () => {
    if (!user) {
      setRow(null)
      setLoading(false)
      return null
    }
    const local = readLocal(user.id)
    const extra = await supabase.from('user_profiles').select('*').eq('id', user.id).maybeSingle()
    if (!extra.error && extra.data) {
      setRow(extra.data)
      writeLocal(user.id, extra.data)
      setLoading(false)
      return extra.data
    }
    const fallback = await supabase.from('profiles').select(EXTRA_COLS).eq('id', user.id).maybeSingle()
    if (!fallback.error && fallback.data) {
      const mapped = fromProfile(fallback.data)
      setRow(mapped)
      setLoading(false)
      return mapped
    }
    setRow(local)
    setLoading(false)
    return local
  }, [user])

  useEffect(() => {
    fetchRow()
  }, [fetchRow])

  const upsert = useCallback(
    async (payload) => {
      if (!user) throw new Error('Faça login para continuar.')
      const quiz = readQuiz()
      const next = {
        id: user.id,
        profile_type: payload.profile_type || quiz?.type || row?.profile_type,
        profile_name: payload.profile_name || quiz?.name || row?.profile_name,
        quiz_answers: payload.quiz_answers || quiz?.quiz_answers || row?.quiz_answers,
        suggested_theme: payload.suggested_theme || quiz?.theme || row?.suggested_theme,
        onboarding_completed: payload.onboarding_completed ?? row?.onboarding_completed ?? false,
        wake_time: payload.wake_time ?? row?.wake_time,
        sleep_time: payload.sleep_time ?? row?.sleep_time,
        work_type: payload.work_type ?? row?.work_type,
        main_challenge: payload.main_challenge ?? row?.main_challenge,
      }
      writeLocal(user.id, next)
      const extra = await supabase.from('user_profiles').upsert(next).select().maybeSingle()
      if (!extra.error && extra.data) {
        setRow(extra.data)
        return extra.data
      }
      const fallback = await supabase.from('profiles').update(next).eq('id', user.id).select(EXTRA_COLS).maybeSingle()
      if (!fallback.error && fallback.data) {
        const mapped = fromProfile(fallback.data)
        setRow(mapped)
        return mapped
      }
      setRow(next)
      return next
    },
    [row, user],
  )

  return { row, loading, fetchRow, upsert, quiz: readQuiz() }
}
