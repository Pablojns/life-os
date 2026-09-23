/**
 * Pergaminhos e lembretes.
 */
import { useState } from 'react'
import { useNotes } from '../hooks/useNotes'
import { RuneButton } from './UI'
import styles from './Notes.module.css'

export default function Notes() {
  const { notes, loading, addNote, deleteNote } = useNotes()
  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [reminderDate, setReminderDate] = useState('')
  const [busy, setBusy] = useState(false)

  async function handleAdd(event) {
    event.preventDefault()
    setBusy(true)
    try {
      await addNote(title.trim(), body.trim(), reminderDate || null)
      setTitle('')
      setBody('')
      setReminderDate('')
      setOpen(false)
    } catch {
      /* toast no hook */
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className={styles.section}>
      <header className={styles.head}>
        <h2>Pergaminhos</h2>
        <RuneButton onClick={() => setOpen((value) => !value)}>
          {open ? 'Fechar' : 'Novo pergaminho'}
        </RuneButton>
      </header>

      <div className={`${styles.slider} ${open ? styles.open : ''}`}>
        <form className={styles.form} onSubmit={handleAdd}>
          <label>
            Título
            <input value={title} onChange={(event) => setTitle(event.target.value)} required />
          </label>
          <label>
            Texto
            <textarea value={body} onChange={(event) => setBody(event.target.value)} rows="4" />
          </label>
          <label>
            Lembrete
            <input type="date" value={reminderDate} onChange={(event) => setReminderDate(event.target.value)} />
          </label>
          <RuneButton type="submit" variant="primary" disabled={busy}>
            Selar
          </RuneButton>
        </form>
      </div>

      {loading ? (
        <div className={styles.skeleton} />
      ) : notes.length === 0 ? (
        <div className={styles.empty}>
          <span>📜</span>
          <p>O escrínio está vazio.</p>
        </div>
      ) : (
        <ul className={styles.list}>
          {notes.map((note) => (
            <li key={note.id} className={styles.card}>
              <h3>{note.title}</h3>
              {note.body ? <p>{note.body}</p> : null}
              {note.reminder_date ? <p className={styles.meta}>Lembrete: {note.reminder_date}</p> : null}
              <RuneButton variant="danger" disabled={busy} onClick={() => deleteNote(note.id)}>
                Queimar
              </RuneButton>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
