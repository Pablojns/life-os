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
  const { weather, timeOfDay } = useWorld()
  const tabs = getShellTabs(hero.labels, 'naruto')
  const petalCount = weather.condition === 'Clear' ? PETALS.length : Math.max(4, PETALS.length - 4)

  return (
    <div
      className={styles.root}
      data-shell="naruto"
      data-section={activeTab}
      data-tod={timeOfDay}
      data-weather={weather.condition}
      style={sceneStyle('naruto', activeTab)}
    >
      <Atmosphere />
      <SceneFX theme="naruto" tab={activeTab} timeOfDay={timeOfDay} weather={weather} />
      <WeatherBadge />
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
              <span aria-hidden="true">{tab.icon}</span>
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
            <span aria-hidden="true">{tab.icon}</span>
            <small>{tab.short}</small>
          </button>
        ))}
      </nav>
    </div>
  )
}
