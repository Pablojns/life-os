/**
 * Navegação das 7 abas do Diário do Herói.
 */
import { useTheme } from '../context/ThemeContext'
import styles from './NavTabs.module.css'

export default function NavTabs({ active, onChange }) {
  const { labels } = useTheme()
  const tabs = [
    { id: 'quests', label: labels.quests, icon: '⚔' },
    { id: 'habits', label: labels.habits, icon: '📅' },
    { id: 'notes', label: labels.notes, icon: '📜' },
    { id: 'rewards', label: labels.rewards, icon: '🍖' },
    { id: 'stats', label: 'Atributos', icon: '📊' },
    { id: 'finance', label: 'Finanças', icon: '💰' },
    { id: 'coach', label: 'IA Coach', icon: '🤖' },
  ]

  return (
    <nav className={styles.wrap} aria-label="Abas do diário">
      <div className={styles.scroller} role="tablist">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={active === tab.id}
            className={`${styles.tab} ${active === tab.id ? styles.active : ''}`}
            onClick={() => onChange(tab.id)}
          >
            <span aria-hidden="true">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>
    </nav>
  )
}
