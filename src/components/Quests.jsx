/**
 * Aba de missões ativas.
 */
import { useState } from 'react'
import { sanitize, sanitizeNumber } from '../lib/sanitize'
import { useQuests } from '../hooks/useQuests'
import { useNotifications } from '../hooks/useNotifications.jsx'
import { useTheme } from '../context/ThemeContext'
import { RuneButton } from './UI'
import styles from './Quests.module.css'

export default function Quests({ onLevelUp }) {
  const { quests, loading, addQuest, completeQuest, deleteQuest } = useQuests()
  const { notify } = useNotifications()
  const { labels } = useTheme()
  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState('')
  const [reward, setReward] = useState('')
  const [xp, setXp] = useState(10)
  const [busy, setBusy] = useState(false)

  async function handleAdd(event) {
    event.preventDefault()
    setBusy(true)
    try {
      await addQuest(sanitize(title), sanitize(reward), sanitizeNumber(xp))
      setTitle('')
      setReward('')
      setXp(10)
      setOpen(false)
    } catch {
      /* toast já disparado no hook */
    } finally {
      setBusy(false)
    }
  }

  async function handleComplete(quest) {
    setBusy(true)
    try {
      const result = await completeQuest(quest.id, quest.xp)
      notify(labels.questComplete(quest.xp), 'success')
      if (result?.leveledUp) onLevelUp?.(result.newLevel)
    } catch {
      /* toast já disparado no hook */
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className={styles.section}>
      <header className={styles.head}>
        <h2>{labels.quests}</h2>
        <RuneButton onClick={() => setOpen((value) => !value)}>
          {open ? 'Fechar' : labels.add}
        </RuneButton>
      </header>

      <div className={`${styles.slider} ${open ? styles.open : ''}`}>
        <form className={styles.form} onSubmit={handleAdd}>
          <label>
            Título
            <input value={title} onChange={(event) => setTitle(event.target.value)} required />
          </label>
          <label>
            Recompensa
            <input value={reward} onChange={(event) => setReward(event.target.value)} placeholder="Opcional" />
          </label>
          <label>
            {labels.xp}
            <input type="number" min="1" value={xp} onChange={(event) => setXp(event.target.value)} />
          </label>
          <RuneButton type="submit" variant="primary" disabled={busy}>
            Registrar
          </RuneButton>
        </form>
      </div>

      {loading ? (
        <div className={styles.skeleton} />
      ) : quests.length === 0 ? (
        <div className={styles.empty}>
          <span>⚔</span>
          <p>Nenhuma missão ativa. Aceite um contrato.</p>
        </div>
      ) : (
        <ul className={styles.list}>
          {quests.map((quest) => (
            <li key={quest.id} className={styles.card}>
              {labels.missionRank ? (
                <p className={styles.banner}>{labels.missionRank(quest.xp)}</p>
              ) : null}
              {quest.reward ? <p className={styles.banner}>Recompensa: {quest.reward}</p> : null}
              <h3>{quest.title}</h3>
              <p className={styles.meta}>{quest.xp} {labels.xp}</p>
              <div className={styles.actions}>
                <RuneButton variant="primary" disabled={busy} onClick={() => handleComplete(quest)}>
                  {labels.complete}
                </RuneButton>
                <RuneButton variant="danger" disabled={busy} onClick={() => deleteQuest(quest.id)}>
                  Excluir
                </RuneButton>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
