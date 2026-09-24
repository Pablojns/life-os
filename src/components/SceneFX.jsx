import styles from './SceneFX.module.css'

const SNOW = Array.from({ length: 18 }, (_, i) => ({
  id: i,
  left: `${(i * 17) % 100}%`,
  delay: `${(i % 9) * 0.4}s`,
  duration: `${8 + (i % 5)}s`,
}))

const RAIN = Array.from({ length: 24 }, (_, i) => ({
  id: i,
  left: `${(i * 13) % 100}%`,
  delay: `${(i % 8) * 0.15}s`,
}))

export default function SceneFX({ theme, tab, timeOfDay, weather }) {
  const raining = /Rain|Thunder|Drizzle/i.test(weather?.condition || '')
  const night = /evening|midnight|sunset/i.test(timeOfDay || '')

  return (
    <div className={styles.fx} aria-hidden="true">
      {theme === 'skyrim' ? (
        <>
          {SNOW.map((flake) => (
            <i key={flake.id} className={styles.snow} style={{ left: flake.left, animationDelay: flake.delay, animationDuration: flake.duration }} />
          ))}
          {tab === 'stats' ? <span className={styles.dragonFly} /> : null}
        </>
      ) : null}

      {theme === 'naruto' ? (
        <>
          {raining
            ? RAIN.map((drop) => (
                <i key={drop.id} className={styles.rain} style={{ left: drop.left, animationDelay: drop.delay }} />
              ))
            : null}
          {tab === 'agenda' && night ? <span className={styles.moon} /> : null}
        </>
      ) : null}

      {theme === 'solo' ? (
        <>
          <span className={styles.bolt} />
          <p className={styles.system} key={tab}>
            [SISTEMA] {tab.toUpperCase()} ONLINE
          </p>
          {tab === 'arena' ? <span className={styles.army} /> : null}
        </>
      ) : null}
    </div>
  )
}
