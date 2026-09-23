/**
 * Grade mensal de hábitos.
 */
import { useMemo, useState } from 'react'
import { daysInMonth, monthDate, normalizeDate, toISODate } from '../lib/dates'
import { useHabits } from '../hooks/useHabits'
import { useNotifications } from '../hooks/useNotifications.jsx'
import { RuneButton } from './UI'
import styles from './Habits.module.css'

export default function Habits({ onLevelUp }) {
  const now = useMemo(() => new Date(), [])
  const month = now.getMonth() + 1
  const year = now.getFullYear()
  const totalDays = daysInMonth(month, year)
  const today = toISODate()
  const { habits, checks, loading, addHabit, toggleCheck, deleteHabit, getPct } = useHabits()
  const { notify } = useNotifications()
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [xpPerDay, setXpPerDay] = useState(5)
  const [busy, setBusy] = useState(false)

  const days = useMemo(() => Array.from({ length: totalDays }, (_, index) => index + 1), [totalDays])

  async function handleAdd(event) {
    event.preventDefault()
    setBusy(true)
    try {
      await addHabit(name.trim(), xpPerDay)
      setName('')
      setXpPerDay(5)
      setOpen(false)
    } catch {
      /* toast no hook */
    } finally {
      setBusy(false)
    }
  }

  async function handleToggle(habitId, date, future) {
    if (future || busy) return
    setBusy(true)
    try {
      const result = await toggleCheck(habitId, date)
      if (result?.leveledUp) onLevelUp?.(result.newLevel)
      if (result) notify('Hábito cumprido. XP concedido.', 'success')
    } catch {
      /* toast no hook */
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className={styles.section}>
      <header className={styles.head}>
        <h2>Hábitos</h2>
        <RuneButton onClick={() => setOpen((value) => !value)}>
          {open ? 'Fechar' : 'Novo hábito'}
        </RuneButton>
      </header>

      <div className={`${styles.slider} ${open ? styles.open : ''}`}>
        <form className={styles.form} onSubmit={handleAdd}>
          <label>
            Nome
            <input value={name} onChange={(event) => setName(event.target.value)} required />
          </label>
          <label>
            XP por dia
            <input type="number" min="1" value={xpPerDay} onChange={(event) => setXpPerDay(event.target.value)} />
          </label>
          <RuneButton type="submit" variant="primary" disabled={busy}>
            Adicionar
          </RuneButton>
        </form>
      </div>

      {loading ? (
        <div className={styles.skeleton} />
      ) : habits.length === 0 ? (
        <div className={styles.empty}>
          <span>📅</span>
          <p>Nenhum hábito ainda. Comece uma rotina.</p>
        </div>
      ) : (
        <div className={styles.scroller}>
          <div
            className={styles.grid}
            style={{ gridTemplateColumns: `minmax(110px, 1.5fr) repeat(${totalDays}, 28px) 48px` }}
          >
            <div />
            {days.map((day) => (
              <div key={day} className={styles.dayHead}>
                {day}
              </div>
            ))}
            <div className={styles.dayHead}>%</div>

            {habits.map((habit) => (
              <HabitRow
                key={habit.id}
                habit={habit}
                days={days}
                month={month}
                year={year}
                today={today}
                checks={checks}
                pct={getPct(habit.id, checks, totalDays)}
                busy={busy}
                onToggle={handleToggle}
                onDelete={() => deleteHabit(habit.id)}
              />
            ))}
          </div>
        </div>
      )}
    </section>
  )
}

function HabitRow({ habit, days, month, year, today, checks, pct, busy, onToggle, onDelete }) {
  return (
    <>
      <div className={styles.habitName}>
        <strong>{habit.name}</strong>
        <button type="button" className={styles.delete} onClick={onDelete} disabled={busy}>
          ×
        </button>
      </div>
      {days.map((day) => {
        const date = monthDate(year, month, day)
        const future = date > today
        const checked = checks.some(
          (check) => check.habit_id === habit.id && normalizeDate(check.check_date || check.date) === date,
        )
        return (
          <button
            key={`${habit.id}-${day}`}
            type="button"
            disabled={future || busy}
            className={`${styles.cell} ${checked ? styles.checked : ''} ${date === today ? styles.today : ''} ${future ? styles.future : ''}`}
            onClick={() => onToggle(habit.id, date, future)}
            aria-label={`${habit.name} dia ${day}`}
          />
        )
      })}
      <div className={styles.pct}>{pct}%</div>
    </>
  )
}
