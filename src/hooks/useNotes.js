/**
 * Pergaminhos (notas) no Supabase, com realtime.
 */
import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { sanitize, sanitizeNumber } from '../lib/sanitize'
import { useAuth } from '../context/AuthContext'
import { useNotifications } from './useNotifications.jsx'

export function useNotes() {
  const { user } = useAuth()
  const { notify } = useNotifications()
  const [notes, setNotes] = useState([])
  const [loading, setLoading] = useState(true)

  const report = useCallback(
    (error, fallback) => {
      console.error(error)
      notify(error?.message || fallback, 'error')
    },
    [notify],
  )

  const fetchNotes = useCallback(async () => {
    if (!user) return []
    const { data, error } = await supabase
      .from('notes')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      report(error, 'Não foi possível carregar os pergaminhos.')
      return []
    }

    setNotes(data || [])
    return data || []
  }, [user, report])

  const addNote = useCallback(
    async (title, body, reminderDate) => {
      if (!user) throw new Error('Usuário não autenticado.')
      const { error } = await supabase.from('notes').insert({
        user_id: user.id,
        title: sanitize(title),
        body: sanitize(body) || null,
        reminder_date: reminderDate || null,
      })
      if (error) {
        report(error, 'Não foi possível gravar o pergaminho.')
        throw error
      }
      await fetchNotes()
      notify('Pergaminho selado.', 'success')
    },
    [user, fetchNotes, notify, report],
  )

  const deleteNote = useCallback(
    async (id) => {
      if (!user) throw new Error('Usuário não autenticado.')
      const { error } = await supabase.from('notes').delete().eq('id', id).eq('user_id', user.id)
      if (error) {
        report(error, 'Não foi possível queimar o pergaminho.')
        throw error
      }
      await fetchNotes()
    },
    [user, fetchNotes, report],
  )

  useEffect(() => {
    if (!user) return undefined
    let cancelled = false

    async function load() {
      setLoading(true)
      await fetchNotes()
      if (!cancelled) setLoading(false)
    }

    load()

    const channel = supabase
      .channel(`notes-${user.id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'notes', filter: `user_id=eq.${user.id}` },
        () => fetchNotes(),
      )
      .subscribe()

    return () => {
      cancelled = true
      supabase.removeChannel(channel)
    }
  }, [user, fetchNotes])

  return { notes, loading, fetchNotes, addNote, deleteNote }
}
