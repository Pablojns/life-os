/**
 * Atributos, rank e histórico de missões.
 */
import { useAuth } from '../context/AuthContext'
import { useQuests } from '../hooks/useQuests'
import { useHabits } from '../hooks/useHabits'
import { useNotes } from '../hooks/useNotes'
import { RANKS, rankFromLevel } from '../lib/xp'
import { useNotifications } from '../hooks/useNotifications.jsx'
import { RuneButton } from './UI'
import styles from './Stats.module.css'

const ATTRS = [
  { key: 'attr_forca', label: 'Força' },
  { key: 'attr_inteligencia', label: 'Inteligência' },
  { key: 'attr_vitalidade', label: 'Vitalidade' },
]

export default function Stats() {
  const { profile, updateProfile, refreshProfile } = useAuth()
  const { notify } = useNotifications()
  const { done, loading: questsLoading } = useQuests()
  const { habits, loading: habitsLoading } = useHabits()
  const { notes, loading: notesLoading } = useNotes()

  const level = profile?.level || 1
  const rank = profile?.rank || rankFromLevel(level)
  const spent = ATTRS.reduce((sum, attr) => sum + (Number(profile?.[attr.key]) || 0), 0)
  const available = Math.max(0, level * 2 - spent)
  const loading = questsLoading || habitsLoading || notesLoading

  async function addPoint(key) {
    if (available <= 0) return
    try {
      await updateProfile({ [key]: (Number(profile?.[key]) || 0) + 1 })
      await refreshProfile()
      notify('Ponto de atributo distribuído.', 'success')
    } catch (error) {
      console.error(error)
      notify(error.message || 'Não foi possível atualizar o atributo.', 'error')
    }
  }

  return (
    <section className={styles.section}>
      <h2>Atributos</h2>

      {loading ? <div className={styles.skeleton} /> : null}

      <div className={styles.cards}>
        <article className={styles.stat}>
          <span>Nível</span>
          <strong>{level}</strong>
        </article>
        <article className={styles.stat}>
          <span>XP total</span>
          <strong>{profile?.xp || 0}</strong>
        </article>
        <article className={styles.stat}>
          <span>Missões concluídas</span>
          <strong>{done.length}</strong>
        </article>
        <article className={styles.stat}>
          <span>Hábitos ativos</span>
          <strong>{habits.length}</strong>
        </article>
        <article className={styles.stat}>
          <span>Pergaminhos</span>
          <strong>{notes.length}</strong>
        </article>
      </div>

      <div className={styles.rankBanner}>
        <span aria-hidden="true">🏆</span>
        <div>
          <p>Rank atual</p>
          <h3>{rank}</h3>
          <div className={styles.dots}>
            {RANKS.map((item) => (
              <i key={item} className={item === rank ? styles.dotOn : styles.dot} />
            ))}
          </div>
        </div>
      </div>

      <div className={styles.attrs}>
        <p>Pontos disponíveis: {available}</p>
        {ATTRS.map((attr) => (
          <div key={attr.key} className={styles.attrRow}>
            <span>{attr.label}</span>
            <strong>{profile?.[attr.key] || 0}</strong>
            {available > 0 ? (
              <RuneButton variant="primary" onClick={() => addPoint(attr.key)}>
                +
              </RuneButton>
            ) : null}
          </div>
        ))}
      </div>

      <div>
        <h3>Histórico de missões</h3>
        {done.length === 0 ? (
          <p className={styles.empty}>Nenhuma missão concluída ainda.</p>
        ) : (
          <ul className={styles.history}>
            {done.map((quest) => (
              <li key={quest.id}>
                <span>{quest.title}</span>
                <small>{quest.xp} XP</small>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  )
}
