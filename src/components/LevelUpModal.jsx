/**
 * Modal de evolução de nível.
 */
import { useTheme } from '../context/ThemeContext'
import { RuneButton } from './UI'
import styles from './LevelUpModal.module.css'

export default function LevelUpModal({ open, level, onClose }) {
  const { labels, theme, displayRank } = useTheme()
  if (!open) return null
  const rank = displayRank(level)

  return (
    <div className={styles.overlay} onClick={onClose} role="presentation">
      <div
        className={styles.card}
        role="dialog"
        aria-modal="true"
        aria-labelledby="level-up-title"
        onClick={(event) => event.stopPropagation()}
      >
        {theme === 'naruto' ? <span className="rasenshuriken" aria-hidden="true" /> : null}
        {theme === 'solo' ? <span className="solo-portal" aria-hidden="true" /> : null}
        <p className={styles.kicker}>{labels.level}</p>
        <h2 id="level-up-title" className={styles.title}>
          {rank.kanji ? `${rank.kanji} ` : ''}
          {labels.level.toUpperCase()} {level}
        </h2>
        <p className={styles.sub}>{labels.levelUp}</p>
        <p className={styles.sub}>{rank.name}</p>
        <RuneButton variant="primary" onClick={onClose}>
          Continuar Jornada
        </RuneButton>
      </div>
    </div>
  )
}
