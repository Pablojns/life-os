/**
 * Barra superior do herói: XP, nível, rank e atalho de configurações.
 */
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { rankFromLevel, xpInCurrentLevel } from '../lib/xp'
import { useTheme } from '../context/ThemeContext'
import styles from './TopBar.module.css'

export default function TopBar() {
  const { profile } = useAuth()
  const { labels } = useTheme()
  const navigate = useNavigate()
  const xp = profile?.total_xp ?? profile?.xp ?? 0
  const level = profile?.level || 1
  const rank = profile?.rank || rankFromLevel(level)
  const currentXp = xpInCurrentLevel(xp)

  return (
    <header className={styles.bar}>
      <div className={styles.brand}>
        <h1>Life OS</h1>
        <p>Diário do Herói</p>
      </div>

      <div className={styles.progress}>
        <div className={styles.xpMeta}>
          <span>{labels.xp}</span>
          <strong>
            {currentXp} / 100
          </strong>
        </div>
        <div className={styles.track} aria-hidden="true">
          <div className={styles.fill} style={{ width: `${currentXp}%` }} />
        </div>
      </div>

      <div className={styles.level}>
        <div className={styles.badge} aria-label={`${labels.level} ${level}`}>
          {level}
        </div>
        <span className={styles.rank}>{rank}</span>
      </div>

      <button
        type="button"
        className={styles.settings}
        onClick={() => navigate('/settings')}
        aria-label="Configurações"
      >
        ⚙
      </button>
    </header>
  )
}
