import hexgrid from '../assets/svg/solo-hexgrid.svg'
import portal from '../assets/svg/solo-portal.svg'
import { getShellTabs } from './tabs'
import { useShellHero } from './useShellHero'
import styles from './SoloShell.module.css'

const PARTICLES = Array.from({ length: 18 }, (_, i) => ({
  id: i,
  left: `${(i * 17) % 96}%`,
  top: `${(i * 29) % 90}%`,
  delay: `${(i % 9) * 0.35}s`,
  color: i % 3 === 0 ? '#7b2fbe' : i % 3 === 1 ? '#1e90ff' : '#e8e8ff',
}))

export default function SoloShell({ children, activeTab, onTabChange }) {
  const hero = useShellHero()
  const tabs = getShellTabs(hero.labels, 'solo')

  return (
    <div className={styles.root} data-shell="solo">
      <div className={styles.hex} style={{ backgroundImage: `url(${hexgrid})` }} aria-hidden="true" />
      <div className={styles.scan} aria-hidden="true" />
      {PARTICLES.map((dot) => (
        <span
          key={dot.id}
          className={styles.particle}
          style={{ left: dot.left, top: dot.top, animationDelay: dot.delay, background: dot.color }}
          aria-hidden="true"
        />
      ))}
      <img src={portal} alt="" className={styles.portal} aria-hidden="true" />

      <aside className={styles.hud}>
        <div className={styles.avatar} aria-hidden="true">
          {hero.initial}
        </div>
        <p className={styles.hunterName}>{hero.name}</p>
        <p className={styles.rankLine}>
          {hero.labels.level}: {hero.rank.name}
        </p>
        <div className={styles.expMeta}>
          <span>EXP {hero.currentXp}/100</span>
          <strong>LV {hero.level}</strong>
        </div>
        <div className={styles.expTrack}>
          <div className={styles.expFill} style={{ width: `${hero.currentXp}%` }} />
        </div>
        <div className={styles.divider} />
        <nav className={styles.menu} aria-label="Menu do sistema">
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
        <p className={styles.alive}>
          <i /> SISTEMA ATIVO
        </p>
        <button type="button" className={styles.settings} onClick={() => hero.navigate('/settings')}>
          CONFIG
        </button>
      </aside>

      <main className={styles.stage}>
        <p className={styles.welcome}>
          {`> ACESSO AUTORIZADO · ${hero.name.toUpperCase()}`}
        </p>
        <div className={styles.window} key={activeTab}>
          {children}
        </div>
      </main>

      <nav className={styles.bottomNav} aria-label="Menu do sistema">
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
