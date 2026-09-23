/**
 * Primitivos de UI reutilizáveis do Life OS.
 */
import { NavLink } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useApp } from '../context/AppContext'
import styles from './UI.module.css'

export function RuneButton({ children, variant = 'primary', type = 'button', disabled, onClick }) {
  return (
    <button
      type={type}
      className={`${styles.rune} ${styles[variant] ?? ''}`}
      disabled={disabled}
      onClick={onClick}
    >
      {children}
    </button>
  )
}

export function Button({ children, variant = 'primary', type = 'button', disabled, onClick }) {
  return (
    <button
      type={type}
      className={`${styles.button} ${styles[variant] ?? ''}`}
      disabled={disabled}
      onClick={onClick}
    >
      {children}
    </button>
  )
}

export function Input({ label, type = 'text', value, onChange, placeholder, required, autoComplete }) {
  return (
    <label className={styles.field}>
      <span>{label}</span>
      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        autoComplete={autoComplete}
      />
    </label>
  )
}

export function Card({ title, children, locked = false }) {
  return (
    <article className={`${styles.card} ${locked ? styles.locked : ''}`}>
      {title ? <h3>{title}</h3> : null}
      {children}
      {locked ? <p className={styles.lockHint}>Recurso do plano pago</p> : null}
    </article>
  )
}

export function Spinner() {
  return <div className={styles.spinner} aria-label="Carregando" />
}

export function PageLoader() {
  return (
    <div className={styles.loader}>
      <Spinner />
      <p>Invocando o grimório...</p>
    </div>
  )
}

export function AppShell({ children }) {
  const { profile, plan, level, xp } = useApp()
  const { signOut } = useAuth()

  return (
    <div className={styles.shell}>
      <header className={styles.nav}>
        <NavLink to="/dashboard" className={styles.brand}>
          Life OS
        </NavLink>
        <div className={styles.navMeta}>
          <span>
            Nv. {level} · {xp} XP
          </span>
          <span className={styles.planBadge}>{plan.name}</span>
          <span>{profile?.displayName}</span>
          <NavLink to="/plans">Planos</NavLink>
          <NavLink to="/settings">Configurações</NavLink>
          <button type="button" className={styles.ghost} onClick={() => signOut()}>
            Sair
          </button>
        </div>
      </header>
      <main className={styles.main}>{children}</main>
    </div>
  )
}
