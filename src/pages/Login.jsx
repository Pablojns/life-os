/**
 * Entrada da jornada — e-mail/senha e Google.
 */
import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { SKIP_AUTO_LOGIN_KEY, TEST_USER } from '../config/testUser'
import logo from '../assets/logo.svg'
import styles from './Login.module.css'

function toAuthMessage(error) {
  const text = error?.message || ''
  if (/invalid login/i.test(text)) return 'E-mail ou senha incorretos.'
  if (/email not confirmed/i.test(text)) return 'Confirme seu e-mail antes de entrar.'
  return text || 'Não foi possível entrar na jornada.'
}

function GoogleIcon() {
  return (
    <svg className={styles.googleIcon} viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M23.49 12.27c0-.79-.07-1.54-.2-2.27H12v4.3h6.46a5.52 5.52 0 0 1-2.4 3.63v3.02h3.88c2.27-2.09 3.55-5.17 3.55-8.68z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.24 0 5.96-1.08 7.95-2.92l-3.88-3.02c-1.08.72-2.47 1.15-4.07 1.15-3.13 0-5.78-2.11-6.73-4.96H1.27v3.11A12 12 0 0 0 12 24z"
      />
      <path
        fill="#FBBC05"
        d="M5.27 14.25A7.21 7.21 0 0 1 4.89 12c0-.78.13-1.53.38-2.25V6.64H1.27A12 12 0 0 0 0 12c0 1.94.46 3.77 1.27 5.36l4-3.11z"
      />
      <path
        fill="#EA4335"
        d="M12 4.75c1.76 0 3.34.61 4.58 1.8l3.43-3.43C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.69 1.27 6.64l4 3.11C6.22 6.86 8.87 4.75 12 4.75z"
      />
    </svg>
  )
}

export default function Login() {
  const { user, loading, signIn, signInWithGoogle } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [testLoading, setTestLoading] = useState(false)

  useEffect(() => {
    if (!loading && user) navigate('/dashboard', { replace: true })
  }, [user, loading, navigate])

  useEffect(() => {
    if (loading || user || !import.meta.env.DEV) return
    if (sessionStorage.getItem(SKIP_AUTO_LOGIN_KEY)) return
    let cancelled = false
    setTestLoading(true)
    signIn(TEST_USER.email, TEST_USER.password)
      .then(() => {
        if (!cancelled) navigate('/dashboard', { replace: true })
      })
      .catch((err) => {
        if (!cancelled) setError(toAuthMessage(err))
      })
      .finally(() => {
        if (!cancelled) setTestLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [loading, user, navigate, signIn])

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      await signIn(email.trim(), password)
      navigate('/dashboard')
    } catch (err) {
      setError(toAuthMessage(err))
    } finally {
      setSubmitting(false)
    }
  }

  async function handleTestUser() {
    setError('')
    setTestLoading(true)
    sessionStorage.removeItem(SKIP_AUTO_LOGIN_KEY)
    try {
      await signIn(TEST_USER.email, TEST_USER.password)
      navigate('/dashboard', { replace: true })
    } catch (err) {
      setError(toAuthMessage(err))
    } finally {
      setTestLoading(false)
    }
  }

  async function handleGoogle() {
    setError('')
    setGoogleLoading(true)
    try {
      await signInWithGoogle()
    } catch (err) {
      setError(toAuthMessage(err))
      setGoogleLoading(false)
    }
  }

  const busy = submitting || googleLoading || testLoading

  return (
    <section className={styles.screen}>
      <div className={styles.panel}>
        <img src={logo} alt="" className={styles.logo} />
        <h1 className={styles.title}>Life OS</h1>
        <p className={styles.lead}>Entre na jornada e retome o controle do seu destino.</p>

        <form className={styles.form} onSubmit={handleSubmit}>
          <label className={styles.field}>
            <span>E-mail</span>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="heroi@lifeos.app"
              required
              autoComplete="email"
              disabled={busy}
            />
          </label>

          <label className={styles.field}>
            <span>Senha</span>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Sua palavra de poder"
              required
              autoComplete="current-password"
              disabled={busy}
            />
          </label>

          <button type="submit" className={styles.primary} disabled={busy}>
            {submitting ? 'Abrindo o portal...' : 'Entrar na Jornada'}
          </button>
        </form>

        {import.meta.env.DEV ? (
          <button type="button" className={styles.test} onClick={handleTestUser} disabled={busy}>
            {testLoading ? 'Entrando como herói de teste...' : 'Entrar como usuário teste'}
          </button>
        ) : null}

        <button type="button" className={styles.google} onClick={handleGoogle} disabled={busy}>
          <GoogleIcon />
          {googleLoading ? 'Conectando ao Google...' : 'Entrar com Google'}
        </button>

        {error ? <p className={styles.error}>{error}</p> : null}

        <p className={styles.footer}>
          Ainda não tem conta? <Link to="/register">Comece sua jornada</Link>
        </p>
      </div>
    </section>
  )
}
