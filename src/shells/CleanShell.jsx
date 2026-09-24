import Atmosphere from '../components/Atmosphere'
import WeatherBadge from '../components/WeatherBadge'
import { useWorld } from '../context/WorldContext'
import { getShellTabs } from './tabs'
import { useShellHero } from './useShellHero'
import styles from './CleanShell.module.css'

const PARTICLES = Array.from({ length: 14 }, (_, i) => ({
  id: i,
  left: `${(i * 13) % 97}%`,
  top: `${(i * 21) % 92}%`,
  delay: `${i * 0.4}s`,
}))

export default function CleanShell({ children, activeTab, onTabChange }) {
  const hero = useShellHero()
  const { weather, timeOfDay } = useWorld()
  const tabs = getShellTabs(hero.labels, 'clean')
  const sparkMs = weather.condition === 'Rain' || weather.condition === 'Thunderstorm' ? '3.2s' : weather.condition === 'Clouds' ? '10s' : '7s'
  const sparkColor = weather.condition === 'Thunderstorm' ? '#c4b5fd' : weather.condition === 'Rain' ? '#93c5fd' : '#ffffff'

  return (
    <div
      className={styles.root}
      data-shell="clean"
      data-tod={timeOfDay}
      data-weather={weather.condition}
      style={{ '--spark-ms': sparkMs, '--spark-color': sparkColor }}
    >
      <Atmosphere />
      <WeatherBadge />
      <div className={styles.aurora} aria-hidden="true" />
      {PARTICLES.map((dot) => (
        <span
          key={dot.id}
          className={styles.spark}
          style={{ left: dot.left, top: dot.top, animationDelay: dot.delay }}
          aria-hidden="true"
        />
      ))}

      <aside className={styles.sidebar}>
        <div className={styles.brand}>
          <strong>Life OS</strong>
          <div className={styles.user}>
            <span className={styles.avatar}>{hero.initial}</span>
            <div>
              <p>{hero.name}</p>
              <small>
                {hero.labels.level} {hero.level} · {hero.currentXp} {hero.labels.xp}
              </small>
            </div>
          </div>
        </div>
        <nav className={styles.menu} aria-label="Navegação">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              aria-selected={activeTab === tab.id}
              className={`${styles.item} ${activeTab === tab.id ? styles.active : ''}`}
              onClick={() => onTabChange(tab.id)}
            >
              <span aria-hidden="true">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </nav>
        <button type="button" className={styles.settings} onClick={() => hero.navigate('/settings#temas')}>
          Configurações
        </button>
      </aside>

      <main className={styles.main}>
        <header className={styles.mobileBar}>
          <strong>Life OS</strong>
          <button type="button" onClick={() => hero.navigate('/settings#temas')} aria-label="Configurações">
            CFG
          </button>
        </header>
        <div className={styles.stage} key={activeTab}>
          {children}
        </div>
      </main>

      <nav className={styles.bottomNav} aria-label="Navegação">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            aria-selected={activeTab === tab.id}
            className={`${styles.item} ${activeTab === tab.id ? styles.active : ''}`}
            onClick={() => onTabChange(tab.id)}
          >
            <span aria-hidden="true">{tab.icon}</span>
          </button>
        ))}
      </nav>
    </div>
  )
}
