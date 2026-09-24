import { useMemo, useState } from 'react'
import { useAgenda } from '../hooks/useAgenda'
import { useQuests } from '../hooks/useQuests'
import { useHabits } from '../hooks/useHabits'
import { useRecurring } from '../hooks/useRecurring'
import { toISODate } from '../lib/dates'
import { RuneButton } from './UI'
import styles from './Agenda.module.css'

const WEEKDAYS = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom']
const HOURS = Array.from({ length: 16 }, (_, i) => i + 6)

function startOfMonth(year, month) {
  return new Date(year, month, 1)
}

function monthCells(year, month) {
  const first = startOfMonth(year, month)
  const offset = (first.getDay() + 6) % 7
  const days = new Date(year, month + 1, 0).getDate()
  return Array.from({ length: 42 }, (_, i) => {
    const day = i - offset + 1
    if (day < 1 || day > days) return null
    return new Date(year, month, day)
  })
}

function sameDay(iso, date) {
  return String(iso || '').slice(0, 10) === toISODate(date)
}

export default function Agenda() {
  const { events, addEvent, moveEvent } = useAgenda()
  const { quests, done } = useQuests()
  const { checks } = useHabits()
  const { items: recurring } = useRecurring()
  const today = new Date()
  const [cursor, setCursor] = useState(new Date(today.getFullYear(), today.getMonth(), 1))
  const [view, setView] = useState('month')
  const [selected, setSelected] = useState(toISODate())
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({ title: '', date: toISODate(), time: '10:00', remind: true })
  const [dragId, setDragId] = useState(null)

  const year = cursor.getFullYear()
  const month = cursor.getMonth()

  const itemsByDay = useMemo(() => {
    const map = {}
    function push(date, item) {
      const key = String(date).slice(0, 10)
      map[key] = map[key] || []
      map[key].push(item)
    }
    events.forEach((event) => push(event.event_datetime, { ...event, kind: 'event', color: 'blue' }))
    ;[...quests, ...done].forEach((quest) => {
      if (quest.due_date) push(quest.due_date, { ...quest, kind: 'quest', color: 'yellow' })
    })
    checks.forEach((check) => push(check.check_date, { ...check, kind: 'habit', color: 'green' }))
    recurring
      .filter((item) => item.active)
      .forEach((item) => {
        const date = new Date(year, month, Math.min(item.day_of_month, 28))
        push(toISODate(date), { ...item, kind: 'recurring', color: 'red' })
      })
    return map
  }, [checks, done, events, month, quests, recurring, year])

  const selectedItems = itemsByDay[selected] || []
  const weekStart = (() => {
    const date = new Date(`${selected}T12:00:00`)
    const offset = (date.getDay() + 6) % 7
    date.setDate(date.getDate() - offset)
    return date
  })()

  async function handleCreate(event) {
    event.preventDefault()
    await addEvent({
      title: form.title,
      date: form.date,
      time: form.time,
      notifyBefore: form.remind ? [1440, 120] : [0],
    })
    setOpen(false)
    setForm({ title: '', date: form.date, time: '10:00', remind: true })
  }

  async function dropOnHour(hour) {
    if (!dragId) return
    const next = new Date(`${selected}T${String(hour).padStart(2, '0')}:00:00`)
    await moveEvent(dragId, next.toISOString())
    setDragId(null)
  }

  return (
    <section className={styles.page}>
      <header className={styles.head}>
        <h2>Agenda</h2>
        <div className={styles.tools}>
          <button type="button" onClick={() => setCursor(new Date(year, month - 1, 1))}>
            ‹
          </button>
          <strong>
            {cursor.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
          </strong>
          <button type="button" onClick={() => setCursor(new Date(year, month + 1, 1))}>
            ›
          </button>
          <button type="button" className={view === 'month' ? styles.on : ''} onClick={() => setView('month')}>
            Mês
          </button>
          <button type="button" className={view === 'week' ? styles.on : ''} onClick={() => setView('week')}>
            Semana
          </button>
          <button type="button" className={view === 'day' ? styles.on : ''} onClick={() => setView('day')}>
            Dia
          </button>
          <RuneButton onClick={() => setOpen((value) => !value)}>+ Evento</RuneButton>
        </div>
      </header>

      {open ? (
        <form className={styles.form} onSubmit={handleCreate}>
          <input
            required
            placeholder="Título"
            value={form.title}
            onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
          />
          <input type="date" value={form.date} onChange={(event) => setForm((current) => ({ ...current, date: event.target.value }))} />
          <input type="time" value={form.time} onChange={(event) => setForm((current) => ({ ...current, time: event.target.value }))} />
          <label>
            <input type="checkbox" checked={form.remind} onChange={(event) => setForm((current) => ({ ...current, remind: event.target.checked }))} />
            Lembrete
          </label>
          <RuneButton type="submit">Salvar</RuneButton>
        </form>
      ) : null}

      {view === 'month' ? (
        <div className={styles.month}>
          {WEEKDAYS.map((day) => (
            <span key={day} className={styles.wd}>
              {day}
            </span>
          ))}
          {monthCells(year, month).map((date, index) => {
            if (!date) return <div key={`e-${index}`} className={styles.empty} />
            const key = toISODate(date)
            const dots = itemsByDay[key] || []
            const isToday = key === toISODate()
            return (
              <button
                key={key}
                type="button"
                className={`${styles.cell} ${isToday ? styles.today : ''} ${key === selected ? styles.picked : ''}`}
                onClick={() => setSelected(key)}
              >
                <strong>{date.getDate()}</strong>
                <span className={styles.dots}>
                  {dots.slice(0, 4).map((item, i) => (
                    <i key={`${item.id || i}-${item.kind}`} className={styles[item.color]} />
                  ))}
                </span>
              </button>
            )
          })}
        </div>
      ) : null}

      {view === 'week' ? (
        <div className={styles.week}>
          {Array.from({ length: 7 }, (_, i) => {
            const date = new Date(weekStart)
            date.setDate(weekStart.getDate() + i)
            const key = toISODate(date)
            return (
              <div key={key} className={styles.col}>
                <strong>
                  {WEEKDAYS[i]} {date.getDate()}
                </strong>
                {HOURS.map((hour) => (
                  <div key={hour} className={styles.slot} onDragOver={(event) => event.preventDefault()} onDrop={() => {
                    setSelected(key)
                    dropOnHour(hour)
                  }}>
                    <small>{hour}:00</small>
                    {(itemsByDay[key] || [])
                      .filter((item) => item.kind === 'event' && new Date(item.event_datetime).getHours() === hour)
                      .map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          draggable
                          className={styles.chip}
                          onDragStart={() => setDragId(item.id)}
                        >
                          🔔 {item.title}
                        </button>
                      ))}
                  </div>
                ))}
              </div>
            )
          })}
        </div>
      ) : null}

      {view === 'day' || view === 'month' ? (
        <div className={styles.dayList}>
          <h3>{new Date(`${selected}T12:00:00`).toLocaleDateString('pt-BR')}</h3>
          {!selectedItems.length ? <p>Nada neste dia.</p> : null}
          {selectedItems.map((item, index) => (
            <article key={`${item.id || index}-${item.kind}`} className={`${styles.row} ${item === selectedItems[0] ? styles.next : ''}`}>
              <span>
                {item.kind === 'quest' ? '🟡' : item.kind === 'event' ? '🔔' : item.kind === 'habit' ? '🟢' : '🔴'}
              </span>
              <div>
                <strong>{item.title || item.name || 'Hábito concluído'}</strong>
                <small>{item.event_datetime ? new Date(item.event_datetime).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : item.kind}</small>
              </div>
            </article>
          ))}
        </div>
      ) : null}
    </section>
  )
}
