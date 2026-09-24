import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { useTheme } from '../context/ThemeContext'
import { useWorld } from '../context/WorldContext'
import { prefersReducedMotion } from '../lib/randomEvents'
import styles from './RandomEvent.module.css'

function EventArt({ id }) {
  if (id === 'dragon') {
    return (
      <svg className={`${styles.art} ${styles.fly}`} viewBox="0 0 160 56">
        <path fill="#C9A84C" d="M6 34c18-16 42-24 70-16 8-8 18-14 28-16l-8 12c14 2 24 8 32 16l-16-2c8 8 10 16 8 22-10-6-22-8-34-6l-8 8-6-8C48 48 28 46 10 40l12-2C14 36 8 36 6 34z" />
      </svg>
    )
  }
  if (id === 'werewolf') {
    return (
      <svg className={`${styles.art} ${styles.lurk}`} viewBox="0 0 80 70">
        <path fill="#0b0b0b" d="M12 62c8-22 16-34 28-34 6-10 14-16 18-10 8 2 14 16 10 28-2 8 8 16 2 20H12z" />
        <path fill="#0b0b0b" d="M34 22l-8-16 10 8 6-12 4 14 12-8-8 16z" />
      </svg>
    )
  }
  if (id === 'vampire') {
    return (
      <svg className={`${styles.art} ${styles.fade}`} viewBox="0 0 60 90">
        <path fill="#140a12" d="M30 8c10 0 16 10 16 20 0 8-4 14-8 16v10l18 28H4l18-28V44c-4-2-8-8-8-16 0-10 6-20 16-20z" />
      </svg>
    )
  }
  if (id === 'meteors') {
    return (
      <div className={styles.meteors}>
        {Array.from({ length: 7 }, (_, i) => (
          <i key={i} style={{ top: `${10 + i * 8}%`, left: `${8 + i * 12}%`, animationDelay: `${i * 0.18}s` }} />
        ))}
      </div>
    )
  }
  if (id === 'eye') {
    return (
      <svg className={`${styles.art} ${styles.eye}`} viewBox="0 0 80 48">
        <ellipse cx="40" cy="24" rx="34" ry="16" fill="#1a0505" stroke="#c9a84c" />
        <circle cx="40" cy="24" r="8" fill="#8b1e1e" />
        <circle cx="40" cy="24" r="3" fill="#1a0505" />
      </svg>
    )
  }
  if (id === 'itachi') {
    return (
      <svg className={`${styles.art} ${styles.perch}`} viewBox="0 0 70 120">
        <rect x="32" y="40" width="6" height="80" fill="#3d2410" />
        <path fill="#1a0505" d="M36 18c10 4 14 18 6 28l12 20-22-8-10 16-8-22c-8-6-4-24 8-30 4-8 10-8 14-4z" />
        <path fill="#7a1010" d="M18 46h28l-6 22H28z" />
      </svg>
    )
  }
  if (id === 'kyuubi') {
    return (
      <svg className={`${styles.art} ${styles.tails}`} viewBox="0 0 400 90">
        {Array.from({ length: 9 }, (_, i) => (
          <path
            key={i}
            d={`M${40 + i * 38} 90c10-40 8-70 4-86`}
            fill="none"
            stroke="#1a0f05"
            strokeWidth="10"
          />
        ))}
      </svg>
    )
  }
  if (id === 'tsukuyomi') {
    return (
      <svg className={`${styles.art} ${styles.moon}`} viewBox="0 0 80 80">
        <circle cx="40" cy="40" r="28" fill="#c81d25" />
        <g className={styles.tomoe}>
          <path d="M40 18c8 6 10 14 4 20-8-2-12-10-4-20z" fill="#1a0505" />
          <path d="M58 48c-8 8-18 8-24 2 6-6 16-6 24-2z" fill="#1a0505" />
          <path d="M22 50c0-10 6-18 16-20-2 8-8 16-16 20z" fill="#1a0505" />
        </g>
      </svg>
    )
  }
  if (id === 'ninja') {
    return (
      <svg className={`${styles.art} ${styles.dash}`} viewBox="0 0 80 40">
        <path fill="#111" d="M8 28c10-12 22-16 36-10 8-8 16-10 22-6l-8 8c8 2 14 6 16 12H8z" />
        <path className={styles.trail} d="M0 30h28" stroke="#ddd" strokeWidth="3" />
      </svg>
    )
  }
  if (id === 'chidori') {
    return <div className={styles.chidori} />
  }
  if (id === 'jinwoo') {
    return (
      <svg className={`${styles.art} ${styles.haunt}`} viewBox="0 0 70 110">
        <path fill="#0a0a14" d="M35 10c12 0 20 12 20 24 0 10-6 18-12 22v16l18 30H9l18-30V56C21 52 15 44 15 34 15 22 23 10 35 10z" />
        <circle cx="28" cy="32" r="3" fill="#7b2fbe" />
        <circle cx="42" cy="32" r="3" fill="#7b2fbe" />
      </svg>
    )
  }
  if (id === 'dungeon') {
    return <div className={styles.extraPortal} />
  }
  if (id === 'shadows') {
    return (
      <div className={styles.army}>
        {Array.from({ length: 6 }, (_, i) => (
          <span key={i} style={{ animationDelay: `${i * 0.25}s` }} />
        ))}
      </div>
    )
  }
  if (id === 'alert') {
    return <p className={styles.alert}>[SISTEMA] AMEAÇA DETECTADA</p>
  }
  if (id === 'boss') {
    return (
      <svg className={`${styles.art} ${styles.boss}`} viewBox="0 0 220 140">
        <path fill="#120814" d="M20 130c20-50 40-90 90-90s70 40 90 90H20z" />
        <circle cx="80" cy="70" r="6" fill="#ff3366" />
        <circle cx="140" cy="70" r="6" fill="#ff3366" />
      </svg>
    )
  }
  if (id === 'monarch') {
    return (
      <svg className={`${styles.art} ${styles.hover}`} viewBox="0 0 140 120">
        <path fill="#07070f" d="M70 20c16 0 24 16 24 30 0 12-8 20-14 24v18l40 20H20l40-20V74C54 70 46 62 46 50 46 36 54 20 70 20z" />
        <path fill="#0b0b14" d="M20 50c18-8 30 4 36 16L20 86zM120 50c-18-8-30 4-36 16L120 86z" />
      </svg>
    )
  }
  return null
}

export default function RandomEvent() {
  const { theme } = useTheme()
  const { event, triggerEvent } = useWorld()

  useEffect(() => {
    if (prefersReducedMotion()) return undefined
    const params = new URLSearchParams(window.location.search)
    const forced = params.get('event')
    if (forced === 'off' || forced === 'none') return undefined
    if (forced) {
      triggerEvent(theme, forced)
      return undefined
    }
    if (Math.random() < 0.3) triggerEvent(theme)
    const id = window.setInterval(() => {
      if (Math.random() < 0.15) triggerEvent(theme)
    }, 10 * 60 * 1000)
    return () => window.clearInterval(id)
  }, [theme, triggerEvent])

  if (!event || prefersReducedMotion()) return null

  return createPortal(
    <div className={styles.layer} data-random-event={event.id} aria-hidden="true">
      <EventArt id={event.id} />
    </div>,
    document.body,
  )
}
