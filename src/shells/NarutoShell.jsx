import hokage from '../assets/svg/naruto-hokage.svg'
import bamboo from '../assets/svg/naruto-bamboo.svg'
import konoha from '../assets/svg/naruto-konoha.svg'
import petal from '../assets/svg/naruto-petal.svg'
import Atmosphere from '../components/Atmosphere'
import WeatherBadge from '../components/WeatherBadge'
import SceneFX from '../components/SceneFX'
import { sceneStyle } from '../lib/scenes'
import { useWorld } from '../context/WorldContext'
import { getShellTabs } from './tabs'
import TabIcon from './TabIcon'
import { useShellHero } from './useShellHero'
import styles from './NarutoShell.module.css'

const PETALS = Array.from({ length: 10 }, (_, i) => ({
  id: i,
  left: `${6 + ((i * 9) % 88)}%`,
  delay: `${i * 0.7}s`,
  duration: `${9 + (i % 4)}s`,
}))

export default function NarutoShell({ children, activeTab, onTabChange }) {
  const hero = useShellHero()
  const { weather, timeOfDay, event } = useWorld()
  const tabs = getShellTabs(hero.labels)
  const petalCount = weather.condition === 'Clear' ? PETALS.length : Math.max(4, PETALS.length - 4)

  return (
    <div
      className={styles.root}
      data-shell="naruto"
      data-section={activeTab}
      data-tod={timeOfDay}
      data-weather={weather.condition}
      style={sceneStyle('naruto', activeTab, { timeOfDay, weather, event })}
    >
      <Atmosphere />
      <SceneFX theme="naruto" tab={activeTab} timeOfDay={timeOfDay} weather={weather} />
      <WeatherBadge />
      {event?.id === 'itachi' ? (
        <svg className={styles.itachi} viewBox="0 0 80 140" aria-hidden="true">
          <path fill="#0a0504" d="M40 18c12 4 16 20 8 32l14 22-24-8-12 18-10-24c-10-8-4-28 10-34 4-10 10-10 14-6z" />
          <path fill="#7a1010" d="M22 56h32l-8 26H34z" />
          <rect x="37" y="78" width="6" height="56" fill="#2a160c" />
        </svg>
      ) : null}
      <img src={bamboo} alt="" className={styles.bambooLeft} aria-hidden="true" />
      <img src={bamboo} alt="" className={styles.bambooRight} aria-hidden="true" />
      {PETALS.slice(0, petalCount).map((item) => (
        <img
          key={item.id}
          src={petal}
          alt=""
          className={styles.petal}
          style={{ left: item.left, animationDelay: item.delay, animationDuration: item.duration }}
          aria-hidden="true"
        />
      ))}

      <header className={styles.sky}>
        <img src={hokage} alt="" className={styles.mountain} />
        <div className={styles.brand}>
          <img src={konoha} alt="" className={styles.logo} />
          <div>
            <p className={styles.kicker}>Escritório da Hokage</p>
            <h1>Konoha</h1>
          </div>
          <button type="button" className={styles.gear} onClick={() => hero.navigate('/settings#temas')} aria-label="Configurações">
            CFG
          </button>
        </div>
        <p className={styles.heroLine}>
          {hero.name} · {hero.rank.name}
          {hero.rank.kanji ? ` ${hero.rank.kanji}` : ''} · {hero.labels.xp} {hero.currentXp}/100
        </p>
        <p className={styles.heroLine}>{hero.streak}</p>
        <nav className={styles.seals} aria-label="Selos de jutsu">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              aria-selected={activeTab === tab.id}
              className={`${styles.seal} ${activeTab === tab.id ? styles.lit : ''}`}
              data-tab={tab.id}
              onClick={() => onTabChange(tab.id)}
              title={tab.label}
            >
              <TabIcon id={tab.id} />
              <small>{tab.label}</small>
            </button>
          ))}
        </nav>
      </header>

      <main className={styles.mural} key={activeTab}>
        {children}
      </main>

      <nav className={styles.bottomNav} aria-label="Selos de jutsu">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            aria-selected={activeTab === tab.id}
            className={`${styles.seal} ${activeTab === tab.id ? styles.lit : ''}`}
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
