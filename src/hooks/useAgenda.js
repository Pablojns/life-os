import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { sanitize } from '../lib/sanitize'
import { useAuth } from '../context/AuthContext'
import { useNotifications } from './useNotifications.jsx'

function toDateTime(date, time) {
  const stamp = `${date}T${time || '09:00'}:00`
  return new Date(stamp)
}

export function useAgenda() {
  const { user } = useAuth()
  const { notify } = useNotifications()
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchEvents = useCallback(async () => {
    if (!user) return []
    const { data, error } = await supabase
      .from('scheduled_events')
      .select('*')
      .eq('user_id', user.id)
      .order('event_datetime', { ascending: true })
    if (error) {
      notify(error.message || 'Não foi possível carregar a agenda.', 'error')
      return []
    }
    setEvents(data || [])
    return data || []
  }, [user, notify])

  const addEvent = useCallback(
    async ({ title, date, time, notifyBefore = [1440, 120], datetime }) => {
      if (!user) throw new Error('Usuário não autenticado.')
      const when = datetime ? new Date(datetime) : toDateTime(date, time)
      if (Number.isNaN(when.getTime())) throw new Error('Data inválida.')
      const minutes = Array.isArray(notifyBefore) && notifyBefore.length ? notifyBefore : [120]
      const rows = minutes.map((offset) => ({
        user_id: user.id,
        title: sanitize(title),
        event_datetime: when.toISOString(),
        notify_at: new Date(when.getTime() - Number(offset) * 60 * 1000).toISOString(),
        notified: false,
        notification_type: 'reminder',
      }))
      const { error } = await supabase.from('scheduled_events').insert(rows)
      if (error) {
        notify(error.message || 'Não foi possível agendar.', 'error')
        throw error
      }
      await fetchEvents()
      notify('Evento agendado.', 'success')
    },
    [user, fetchEvents, notify],
  )

  const moveEvent = useCallback(
    async (id, nextIso) => {
      if (!user) throw new Error('Usuário não autenticado.')
      const { error } = await supabase
        .from('scheduled_events')
        .update({ event_datetime: nextIso, notify_at: nextIso })
        .eq('id', id)
        .eq('user_id', user.id)
      if (error) throw error
      setEvents((current) => current.map((item) => (item.id === id ? { ...item, event_datetime: nextIso } : item)))
    },
    [user],
  )

  useEffect(() => {
    if (!user) return undefined
    fetchEvents().finally(() => setLoading(false))
    const channel = supabase
      .channel(`events-${user.id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'scheduled_events', filter: `user_id=eq.${user.id}` },
        () => fetchEvents(),
      )
      .subscribe()
    return () => supabase.removeChannel(channel)
  }, [user, fetchEvents])

  return { events, loading, fetchEvents, addEvent, moveEvent }
}
