/**
 * Conta, aparência e sessão.
 */
import { useEffect, useRef } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { getPlan } from '../config/plans'
import { PLAN_LABELS, useTheme } from '../context/ThemeContext'
import { useNotifications } from '../hooks/useNotifications.jsx'
import { RuneButton } from '../components/UI'
import styles from './Settings.module.css'

export default function Settings() {
  const { profile, user, signOut, refreshProfile, updateProfile } = useAuth()
  const { theme, setTheme, hasThemeAccess, availableThemes } = useTheme()
  const { notify } = useNotifications()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const stripeReturnHandled = useRef(false)

  useEffect(() => {
    if (window.location.hash === '#temas') {
      document.getElementById('temas')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }, [])

  useEffect(() => {
    if (stripeReturnHandled.current) return
    const success = searchParams.get('success') === 'true'
    const canceled = searchParams.get('canceled') === 'true'
    if (!success && !canceled) return

    stripeReturnHandled.current = true
    const planFromStripe = searchParams.get('plan')
    const expiryDays = { monthly: 31, quarterly: 92, semiannual: 183, annual: 365 }

    ;(async () => {
      if (success) {
        if (planFromStripe && planFromStripe !== 'free') {
          const days = expiryDays[planFromStripe] ?? 31
          const expires = new Date()
          expires.setUTCDate(expires.getUTCDate() + days)
          try {
            await updateProfile({ plan: planFromStripe, plan_expires_at: expires.toISOString() })
          } catch (error) {
            console.error(error)
          }
        }
        notify('Plano ativado com sucesso!', 'success')
        await refreshProfile()
      } else {
        notify('Pagamento cancelado.', 'error')
      }
      navigate('/settings', { replace: true })
    })()
  }, [navigate, notify, refreshProfile, searchParams, updateProfile])

  async function handleTheme(item) {
    if (!hasThemeAccess(item.name)) {
      notify(`Disponível no plano ${PLAN_LABELS[item.plan]}`, 'error')
      return
    }
    await setTheme(item.name)
  }

  async function handleSignOut() {
    await signOut()
    navigate('/login', { replace: true })
  }

  return (
    <section className={styles.page}>
      <header>
        <h1>Configurações</h1>
        <p>Cada tema é um app diferente: grimório, HUD de caçador, vila ninja ou glass premium.</p>
      </header>

      <section id="temas">
        <h2>Aparência</h2>
        <div className={styles.grid}>
          {availableThemes.map((item) => {
            const allowed = hasThemeAccess(item.name)
            const active = theme === item.name
            return (
              <button
                key={item.name}
                type="button"
                data-theme-name={item.name}
                className={`${styles.card} ${active ? styles.active : ''} ${!allowed ? styles.locked : ''}`}
                onClick={() => handleTheme(item)}
              >
                <span className={styles.emoji}>{item.emoji}</span>
                <strong>{item.label}</strong>
                {item.previewColors ? (
                  <span className={styles.swatches} aria-hidden="true">
                    {item.previewColors.map((color) => (
                      <i key={color} style={{ background: color }} />
                    ))}
                  </span>
                ) : null}
                {item.description ? <small className={styles.desc}>{item.description}</small> : null}
                <span className={styles.badge}>{PLAN_LABELS[item.plan]}</span>
                {active ? <span className={styles.check}>✓</span> : null}
                {!allowed ? (
                  <span className={styles.lock}>
                    🔒
                    <small>Plano {PLAN_LABELS[item.plan]} necessário</small>
                  </span>
                ) : null}
              </button>
            )
          })}
        </div>
      </section>

      <section className={styles.account}>
        <h2>Plano</h2>
        <p>
          Plano atual:{' '}
          <strong className={styles.planName}>{getPlan(profile?.plan).label}</strong>
        </p>
        <Link className={styles.plansLink} to="/plans">
          Ver planos e assinar
        </Link>
      </section>

      <section className={styles.account}>
        <h2>Conta</h2>
        <p>
          <strong>{profile?.name || user?.user_metadata?.name || 'Aventureiro'}</strong>
        </p>
        <p className={styles.email}>{profile?.email || user?.email}</p>
        <RuneButton variant="danger" onClick={handleSignOut}>
          Sair
        </RuneButton>
      </section>
    </section>
  )
}
