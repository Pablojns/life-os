/**
 * Criação de conta — nome, e-mail e senha.
 */
import { useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { readQuiz } from '../lib/quiz'
import { supabase } from '../lib/supabase'
import logo from '../assets/logo.svg'
import styles from './Register.module.css'

function toAuthMessage(error) {
  const text = error?.message || ''
  if (/already registered/i.test(text)) return 'Este e-mail já possui uma conta.'
  if (/password/i.test(text) && /least/i.test(text)) return 'A senha deve ter pelo menos 6 caracteres.'
  return text || 'Não foi possível criar a conta.'
}

export default function Register() {
  const { user, loading, signUp } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [name, setName] = useState('')
  const [email, setEmail] = useState(() => searchParams.get('email') || '')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!loading && user) navigate('/dashboard', { replace: true })
  }, [user, loading, navigate])

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setMessage('')

    if (password.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres.')
      return
    }

    if (password !== confirmPassword) {
      setError('As senhas não coincidem.')
      return
    }

    setSubmitting(true)
    try {
      const { session, user: created } = await signUp(email.trim(), password, name.trim())
      const quiz = readQuiz()
      if (created?.id && quiz) {
        await supabase.from('user_profiles').upsert({
          id: created.id,
          profile_type: quiz.type,
          profile_name: quiz.name,
          quiz_answers: quiz.quiz_answers,
          suggested_theme: quiz.theme,
          onboarding_completed: false,
        })
        if (quiz.theme) {
          await supabase.from('profiles').update({ skin_active: quiz.theme, name: name.trim() }).eq('id', created.id)
        }
      }
      if (session) {
        navigate(quiz ? '/onboarding' : '/dashboard')
        return
      }
      setMessage('Conta criada. Confirme o e-mail enviado pelo Supabase para entrar na jornada.')
    } catch (err) {
      setError(toAuthMessage(err))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section className={styles.screen}>
      <div className={styles.panel}>
        <img src={logo} alt="" className={styles.logo} />
        <h1 className={styles.title}>Life OS</h1>
        <p className={styles.lead}>Forje seu herói e comece a registrar missões, hábitos e tesouros.</p>

        <form className={styles.form} onSubmit={handleSubmit}>
          <label className={styles.field}>
            <span>Nome</span>
            <input
              type="text"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Nome do herói"
              required
              autoComplete="name"
              disabled={submitting}
            />
          </label>

          <label className={styles.field}>
            <span>E-mail</span>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="heroi@lifeos.app"
              required
              autoComplete="email"
              disabled={submitting}
            />
          </label>

          <label className={styles.field}>
            <span>Senha</span>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Mínimo de 6 caracteres"
              required
              minLength={6}
              autoComplete="new-password"
              disabled={submitting}
            />
          </label>

          <label className={styles.field}>
            <span>Confirmar senha</span>
            <input
              type="password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              placeholder="Repita a palavra de poder"
              required
              minLength={6}
              autoComplete="new-password"
              disabled={submitting}
            />
          </label>

          <button type="submit" className={styles.primary} disabled={submitting}>
            {submitting ? 'Forjando a conta...' : 'Começar a Jornada'}
          </button>
        </form>

        {error ? <p className={styles.error}>{error}</p> : null}
        {message ? <p className={styles.success}>{message}</p> : null}

        <p className={styles.footer}>
          Já tem conta? <Link to="/login">Entrar na Jornada</Link>
        </p>
      </div>
    </section>
  )
}
