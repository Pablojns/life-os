import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { readQuiz } from '../lib/quiz'

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
    const { data, error } = await supabase.from('user_profiles').select('*').eq('id', user.id).maybeSingle()
    if (error) {
      setRow(null)
      setLoading(false)
      return null
    }
    setRow(data)
    setLoading(false)
    return data
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
      const { data, error } = await supabase.from('user_profiles').upsert(next).select().single()
      if (error) throw error
      setRow(data)
      return data
    },
    [row, user],
  )

  return { row, loading, fetchRow, upsert, quiz: readQuiz() }
}
