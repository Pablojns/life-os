/**
 * Diário do Herói: abas, toasts e evolução de nível.
 */
import { useState } from 'react'
import TopBar from '../components/TopBar'
import NavTabs from '../components/NavTabs'
import Quests from '../components/Quests'
import Habits from '../components/Habits'
import Notes from '../components/Notes'
import Rewards from '../components/Rewards'
import Stats from '../components/Stats'
import Finance from '../components/Finance'
import AICoach from '../components/AICoach'
import LevelUpModal from '../components/LevelUpModal'
import styles from './Dashboard.module.css'

export default function Dashboard() {
  const [tab, setTab] = useState('quests')
  const [levelUp, setLevelUp] = useState(null)

  return (
    <div className={styles.layout}>
      <TopBar />
      <NavTabs active={tab} onChange={setTab} />
      <div className={styles.panel} key={tab}>
        {tab === 'quests' ? <Quests onLevelUp={setLevelUp} /> : null}
        {tab === 'habits' ? <Habits onLevelUp={setLevelUp} /> : null}
        {tab === 'notes' ? <Notes /> : null}
        {tab === 'rewards' ? <Rewards /> : null}
        {tab === 'stats' ? <Stats /> : null}
        {tab === 'finance' ? <Finance /> : null}
        {tab === 'coach' ? <AICoach /> : null}
      </div>
      <LevelUpModal open={Boolean(levelUp)} level={levelUp} onClose={() => setLevelUp(null)} />
    </div>
  )
}
