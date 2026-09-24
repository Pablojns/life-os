/**
 * Barra superior do herói: XP, nível, rank e atalho de configurações.
 */
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { getPlan } from '../config/plans'
import { xpInCurrentLevel } from '../lib/xp'
import { useTheme } from '../context/ThemeContext'
import styles from './TopBar.module.css'

export default function TopBar() {
  const { profile } = useAuth()
  const { labels, displayRank } = useTheme()
  const navigate = useNavigate()
  const xp = profile?.total_xp ?? profile?.xp ?? 0
  const level = profile?.level || 1
  const rank = displayRank(level)
  const currentXp = xpInCurrentLevel(xp)
  const planLabel = getPlan(profile?.plan).label

  return (
    <header className={styles.bar}>
      <div className={styles.brand}>
        <h1>
          <svg className="stroke-icon" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
            <path d="M12 3l7 4v6c0 5-3.5 8-7 9-3.5-1-7-4-7-9V7z" />
          </svg>
          Life OS
        </h1>
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
          {rank.kanji || level}
        </div>
        <div>
          <span className={styles.rank}>{rank.name}</span>
          <span className={styles.planBadge}>{planLabel}</span>
        </div>
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
