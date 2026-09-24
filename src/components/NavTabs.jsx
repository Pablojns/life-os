/**
 * Navegação das abas do Diário do Herói.
 */
import { useTheme } from '../context/ThemeContext'
import TabIcon from '../shells/TabIcon'
import styles from './NavTabs.module.css'

export default function NavTabs({ active, onChange }) {
  const { labels } = useTheme()
  const tabs = [
    { id: 'quests', label: labels.quests },
    { id: 'habits', label: labels.habits },
    { id: 'notes', label: labels.notes },
    { id: 'rewards', label: labels.rewards },
    { id: 'stats', label: labels.stats || 'Atributos' },
    { id: 'finance', label: labels.finance || 'Finanças' },
    { id: 'coach', label: labels.coach || 'IA Coach' },
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
            <TabIcon id={tab.id} />
            {tab.label}
          </button>
        ))}
      </div>
    </nav>
  )
}
