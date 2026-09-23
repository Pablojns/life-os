/**
 * Modal de evolução de nível.
 */
import { RuneButton } from './UI'
import styles from './LevelUpModal.module.css'

export default function LevelUpModal({ open, level, onClose }) {
  if (!open) return null

  return (
    <div className={styles.overlay} onClick={onClose} role="presentation">
      <div
        className={styles.card}
        role="dialog"
        aria-modal="true"
        aria-labelledby="level-up-title"
        onClick={(event) => event.stopPropagation()}
      >
        <p className={styles.kicker}>Evolução</p>
        <h2 id="level-up-title" className={styles.title}>
          NÍVEL {level}
        </h2>
        <p className={styles.sub}>Você evoluiu, Dovahkiin</p>
        <RuneButton variant="primary" onClick={onClose}>
          Continuar Jornada
        </RuneButton>
      </div>
    </div>
  )
}
