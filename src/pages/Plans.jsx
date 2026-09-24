/**
 * Catálogo de planos pagos do Life OS.
 */
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import PlanCards from '../components/PlanCards'
import styles from './Plans.module.css'

export default function Plans() {
  const { profile, user } = useAuth()

  return (
    <section className={`${styles.page} ${user ? '' : styles.guest}`}>
      {user ? null : (
        <header className={styles.guestNav}>
          <Link to="/">Life OS</Link>
          <Link to="/register">Começar grátis</Link>
        </header>
      )}
      <header className={styles.hero}>
        <h1>Planos</h1>
        <p>Escolha o pacto que desbloqueia o próximo capítulo da sua jornada.</p>
        {(profile?.plan || 'free') === 'free' ? (
          <div className={styles.lost}>
            <h2>O que você perde sem o plano Herói</h2>
            <ul>
              <li>IA Coach lendo sua semana de verdade</li>
              <li>Finanças completas: contas, dívidas e orçamento</li>
              <li>Temas Naruto e Solo Leveling</li>
            </ul>
          </div>
        ) : null}
      </header>
      <PlanCards currentPlan={profile?.plan || 'free'} variant={user ? 'app' : 'landing'} />
    </section>
  )
}
