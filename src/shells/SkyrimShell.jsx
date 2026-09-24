import mountains from '../assets/svg/skyrim-mountains.svg'
import dragon from '../assets/svg/skyrim-dragon.svg'
import Atmosphere from '../components/Atmosphere'
import WeatherBadge from '../components/WeatherBadge'
import SceneFX from '../components/SceneFX'
import { useWorld } from '../context/WorldContext'
import { sceneStyle } from '../lib/scenes'
import { getShellTabs } from './tabs'
import { useShellHero } from './useShellHero'
import styles from './SkyrimShell.module.css'

function Spine() {
  return (
    <svg className={styles.spineArt} viewBox="0 0 28 720" preserveAspectRatio="none" aria-hidden="true">
      <path d="M14 0v720" stroke="#8B6914" strokeWidth="2" />
      <path d="M8 0v720" stroke="#C9A84C" strokeWidth="1" opacity=".55" />
      <path d="M20 0v720" stroke="#C9A84C" strokeWidth="1" opacity=".55" />
      {Array.from({ length: 18 }, (_, i) => {
        const y = 28 + i * 38
        return <path key={y} d={`M4 ${y}c6 8 14 8 20 0`} fill="none" stroke="#C9A84C" strokeWidth="1.2" />
      })}
    </svg>
  )
}

export default function SkyrimShell({ children, activeTab, onTabChange }) {
  const hero = useShellHero()
  const { weather, timeOfDay } = useWorld()
  const tabs = getShellTabs(hero.labels, 'skyrim')

  return (
    <div
      className={styles.root}
      data-shell="skyrim"
      data-section={activeTab}
      data-tod={timeOfDay}
      data-weather={weather.condition}
      style={sceneStyle('skyrim', activeTab)}
    >
      <Atmosphere />
      <SceneFX theme="skyrim" tab={activeTab} timeOfDay={timeOfDay} weather={weather} />
      <WeatherBadge />
      <div className={styles.aurora} aria-hidden="true" />
      <div className={styles.mountains} aria-hidden="true">
        <img src={mountains} alt="" className={styles.mtnFar} />
        <img src={mountains} alt="" className={styles.mtnMid} />
        <img src={mountains} alt="" className={styles.mtnNear} />
      </div>
      <img src={dragon} alt="" className={styles.dragon} aria-hidden="true" />
      <div className={styles.mist} aria-hidden="true" />

      <header className={styles.mobileHeader}>
        <div>
          <p className={styles.kicker}>Grimório do Dovahkiin</p>
          <h1>Life OS</h1>
        </div>
        <button type="button" className={styles.gear} onClick={() => hero.navigate('/settings#temas')} aria-label="Configurações">
          CFG
        </button>
        <div className={styles.xpBlock}>
          <span>
            {hero.labels.xp} {hero.currentXp}/100 · {hero.labels.level} {hero.level}
          </span>
          <small>{hero.streak}</small>
          <div className={styles.xpTrack}>
            <div className={styles.xpFill} style={{ width: `${hero.currentXp}%` }} />
          </div>
        </div>
      </header>

      <div className={styles.book}>
        <aside className={styles.leftPage}>
          <div className={styles.pageGrain} />
          <div className={styles.heroCard}>
            <div className={styles.alduin} aria-hidden="true">
              <svg viewBox="0 0 48 48">
                <path
                  d="M24 4c6 6 10 8 16 8-4 6-4 10 0 16-6 0-10 2-16 8-6-6-10-8-16-8 4-6 4-10 0-16 6 0 10-2 16-8z"
                  fill="none"
                  stroke="#C9A84C"
                  strokeWidth="1.6"
                />
                <circle cx="24" cy="24" r="5" fill="#C9A84C" />
              </svg>
            </div>
            <p className={styles.heroName}>{hero.name}</p>
            <p className={styles.heroRank}>{hero.rank.name}</p>
            <p className={styles.heroLevel}>
              {hero.labels.level} {hero.level} · {hero.labels.xp} {hero.currentXp}/100
            </p>
            <p className={styles.heroLevel}>{hero.streak}</p>
            <div className={styles.xpTrack}>
              <div className={styles.xpFill} style={{ width: `${hero.currentXp}%` }} />
            </div>
            <button type="button" className={styles.gear} onClick={() => hero.navigate('/settings#temas')} aria-label="Configurações">
              CFG
            </button>
          </div>
          <nav className={styles.sideNav} aria-label="Abas do grimório">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={activeTab === tab.id}
                className={`${styles.scroll} ${activeTab === tab.id ? styles.unfurled : ''}`}
                data-tab={tab.id}
                onClick={() => onTabChange(tab.id)}
              >
                <span aria-hidden="true">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </nav>
        </aside>

        <div className={styles.spine} aria-hidden="true">
          <Spine />
        </div>

        <main className={styles.rightPage}>
          <div className={styles.pageGrain} />
          <div className={styles.parchment} key={activeTab}>
            {children}
          </div>
        </main>
      </div>

      <nav className={styles.bottomNav} aria-label="Abas do grimório">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            aria-selected={activeTab === tab.id}
            className={`${styles.scroll} ${activeTab === tab.id ? styles.unfurled : ''}`}
            data-tab={tab.id}
            onClick={() => onTabChange(tab.id)}
          >
            <span aria-hidden="true">{tab.icon}</span>
            <small>{tab.label}</small>
          </button>
        ))}
      </nav>
    </div>
  )
}
