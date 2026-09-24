import { useTheme } from '../context/ThemeContext'
import { useWorld } from '../context/WorldContext'
import { prefersReducedMotion } from '../lib/randomEvents'
import styles from './Atmosphere.module.css'

function Flakes({ className, count }) {
  return Array.from({ length: count }, (_, i) => (
    <span
      key={i}
      className={className}
      style={{
        left: `${(i * 37) % 100}%`,
        animationDelay: `${(i % 12) * 0.35}s`,
        animationDuration: `${6 + (i % 5)}s`,
      }}
    />
  ))
}

function Clouds() {
  return (
    <div className={styles.clouds} aria-hidden="true">
      {[0, 1, 2, 3].map((i) => (
        <svg key={i} className={styles.cloud} viewBox="0 0 120 48" style={{ top: `${8 + i * 10}%`, animationDelay: `${i * 4}s` }}>
          <ellipse cx="38" cy="28" rx="28" ry="14" fill="currentColor" />
          <ellipse cx="62" cy="22" rx="22" ry="16" fill="currentColor" />
          <ellipse cx="86" cy="28" rx="20" ry="12" fill="currentColor" />
        </svg>
      ))}
    </div>
  )
}

export default function Atmosphere() {
  const { theme } = useTheme()
  const { weather, timeOfDay, event } = useWorld()
  const reduced = prefersReducedMotion()
  const condition = weather.condition
  const isSnowTheme = theme === 'skyrim' && (condition === 'Rain' || condition === 'Snow')
  const isRain = !isSnowTheme && (condition === 'Rain' || condition === 'Drizzle')
  const storm = condition === 'Thunderstorm'
  const clear = condition === 'Clear'
  const cloudy = condition === 'Clouds'
  const extraPetals = theme === 'naruto' && (clear || event?.id === 'petals')
  const blizzard = event?.id === 'blizzard'

  return (
    <div
      className={styles.wrap}
      data-atmo={theme}
      data-tod={timeOfDay}
      data-weather={condition}
      aria-hidden="true"
    >
      <div className={styles.sky} />
      {theme !== 'solo' ? <div className={styles.stars} /> : null}
      {theme !== 'solo' ? <div className={styles.celestial} /> : null}
      {theme === 'naruto' && (timeOfDay === 'dawn' || timeOfDay === 'morning') ? <div className={styles.smoke} /> : null}
      {theme === 'naruto' && (timeOfDay === 'evening' || timeOfDay === 'midnight') ? <div className={styles.lanterns} /> : null}
      {theme === 'solo' ? <div className={styles.soloWash} /> : null}
      {theme === 'solo' && timeOfDay === 'midnight' ? <p className={styles.dungeonBanner}>DUNGEON BREAK</p> : null}
      {storm && theme === 'solo' ? <p className={styles.dungeonBanner}>[SISTEMA] DUNGEON BREAK DETECTADO</p> : null}

      {!reduced && isSnowTheme ? <div className={`${styles.field} ${blizzard ? styles.heavy : ''}`}>{Flakes({ className: styles.flake, count: blizzard ? 42 : 24 })}</div> : null}
      {!reduced && (condition === 'Snow' && theme !== 'skyrim') ? <div className={styles.field}>{Flakes({ className: styles.flake, count: 20 })}</div> : null}
      {!reduced && (isRain || storm) && theme !== 'skyrim' && theme !== 'solo' ? (
        <div className={`${styles.field} ${storm ? styles.heavy : ''}`}>{Flakes({ className: styles.drop, count: storm ? 40 : 28 })}</div>
      ) : null}
      {!reduced && storm ? <div className={styles.flash} /> : null}
      {!reduced && storm && theme === 'naruto' ? <div className={styles.rasengan} /> : null}
      {!reduced && cloudy ? <Clouds /> : null}
      {!reduced && extraPetals ? <div className={styles.field}>{Flakes({ className: styles.petalBurst, count: 18 })}</div> : null}
      {theme === 'naruto' && (isRain || storm) ? <div className={styles.wet} /> : null}
    </div>
  )
}
