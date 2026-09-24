/**
 * Diário do Herói: o shell do tema ativo envolve o conteúdo.
 */
import { useState } from 'react'
import { useTheme } from '../context/ThemeContext'
import { getShell } from '../shells'
import Quests from '../components/Quests'
import Habits from '../components/Habits'
import Notes from '../components/Notes'
import Rewards from '../components/Rewards'
import Stats from '../components/Stats'
import Finance from '../components/Finance'
import AICoach from '../components/AICoach'
import LevelUpModal from '../components/LevelUpModal'

export default function Dashboard() {
  const { theme } = useTheme()
  const [tab, setTab] = useState('quests')
  const [levelUp, setLevelUp] = useState(null)
  const Shell = getShell(theme)

  const panels = {
    quests: <Quests onLevelUp={setLevelUp} />,
    habits: <Habits onLevelUp={setLevelUp} />,
    notes: <Notes />,
    rewards: <Rewards />,
    stats: <Stats />,
    finance: <Finance />,
    coach: <AICoach />,
  }

  return (
    <>
      <Shell activeTab={tab} onTabChange={setTab}>
        {panels[tab]}
      </Shell>
      <LevelUpModal open={Boolean(levelUp)} level={levelUp} onClose={() => setLevelUp(null)} />
    </>
  )
}
