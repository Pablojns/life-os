import Atmosphere from '../components/Atmosphere'
import WeatherBadge from '../components/WeatherBadge'
import { sceneStyle } from '../lib/scenes'
import { useWorld } from '../context/WorldContext'
import { getShellTabs } from './tabs'
import TabIcon from './TabIcon'
import { useShellHero } from './useShellHero'
import styles from './CyberpunkShell.module.css'

const RAIN = Array.from({ length: 36 }, (_, i) => ({
  id: i,
  left: `${(i * 11) % 100}%`,
  delay: `${(i % 9) * 0.12}s`,
  duration: `${0.55 + (i % 5) * 0.08}s`,
}))

export default function CyberpunkShell({ children, activeTab, onTabChange }) {
  const hero = useShellHero()
  const { weather, timeOfDay } = useWorld()
  const tabs = getShellTabs(hero.labels)

  return (
    <div
      className={styles.root}
      data-shell="cyberpunk"
      data-section={activeTab}
      data-tod={timeOfDay}
      data-weather={weather.condition}
      style={sceneStyle('cyberpunk', activeTab, { timeOfDay, weather })}
    >
      <Atmosphere />
      <WeatherBadge />
      <div className={styles.scanlines} aria-hidden="true" />
      <div className={styles.rainLayer} aria-hidden="true">
        {RAIN.map((drop) => (
          <i
            key={drop.id}
            className={styles.rain}
            style={{ left: drop.left, animationDelay: drop.delay, animationDuration: drop.duration }}
          />
        ))}
      </div>

      <aside className={styles.sidebar}>
        <p className={styles.kicker}>NETWATCH // LINK</p>
        <h1 className={styles.title}>
          Night City<span className={styles.cursor}>_</span>
        </h1>
        <p className={styles.user}>
          {hero.name}
          <small>
            {hero.labels.level} {hero.level} · {hero.rank.name}
          </small>
          <small>
            {hero.currentXp}/100 {hero.labels.xp}
          </small>
          <small>{hero.streak}</small>
        </p>
        <nav className={styles.menu} aria-label="HUD">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              aria-selected={activeTab === tab.id}
              className={`${styles.item} ${activeTab === tab.id ? styles.active : ''}`}
              data-tab={tab.id}
              onClick={() => onTabChange(tab.id)}
            >
              <TabIcon id={tab.id} />
              {tab.label}
            </button>
          ))}
        </nav>
        <button type="button" className={styles.settings} onClick={() => hero.navigate('/settings#temas')}>
          SISTEMA
        </button>
      </aside>

      <main className={styles.main}>
        <header className={styles.mobileBar}>
          <strong>
            NC<span className={styles.cursor}>_</span>
          </strong>
          <button type="button" onClick={() => hero.navigate('/settings#temas')} aria-label="Configurações">
            SYS
          </button>
        </header>
        <div className={styles.stage} key={activeTab}>
          {children}
        </div>
      </main>

      <nav className={styles.bottomNav} aria-label="HUD">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            aria-selected={activeTab === tab.id}
            className={`${styles.item} ${activeTab === tab.id ? styles.active : ''}`}
            data-tab={tab.id}
            onClick={() => onTabChange(tab.id)}
          >
            <TabIcon id={tab.id} />
            <small>{tab.short}</small>
          </button>
        ))}
      </nav>
    </div>
  )
}
