/**
 * Cards de planos reutilizados na página /plans e na landing.
 */
import { useNavigate } from 'react-router-dom'
import { PLANS, formatPlanPrice, planFeatureList } from '../config/plans'
import { useAuth } from '../context/AuthContext'
import { useCheckout } from '../hooks/useCheckout'
import { RuneButton } from './UI'
import styles from '../pages/Plans.module.css'

const ORDER = ['free', 'monthly', 'quarterly', 'semiannual', 'annual']

export default function PlanCards({ currentPlan = 'free', variant = 'app' }) {
  const { user } = useAuth()
  const { startCheckout, loading, loadingPlan } = useCheckout()
  const navigate = useNavigate()

  function handlePaid(planId) {
    if (variant === 'landing' || !user) {
      navigate('/register')
      return
    }
    startCheckout(planId)
  }

  return (
    <div className={styles.scroller}>
      {ORDER.map((id) => {
        const plan = PLANS[id]
        const current = variant === 'app' && currentPlan === plan.id
        const features = planFeatureList(plan)
        const isFree = plan.id === 'free'
        const busy = loading && loadingPlan === plan.id

        return (
          <article key={plan.id} className={`${styles.card} ${current ? styles.current : ''}`}>
            <div className={styles.cardHead}>
              <h2>{plan.label}</h2>
              {plan.discount ? <span className={styles.discount}>{plan.discount}</span> : null}
            </div>
            <p className={styles.price}>
              <strong>{formatPlanPrice(plan)}</strong>
              <span>{plan.period}</span>
            </p>
            <ul className={styles.features}>
              {features.map((feature) => (
                <li key={feature.label} className={feature.included ? styles.on : styles.off}>
                  <span aria-hidden="true">{feature.included ? '✓' : '✕'}</span>
                  {feature.label}
                </li>
              ))}
            </ul>
            {isFree ? (
              <RuneButton
                disabled={current}
                onClick={() => (current ? null : navigate('/register'))}
              >
                {current ? 'Plano atual' : variant === 'landing' ? 'Começar grátis' : 'Gratuito'}
              </RuneButton>
            ) : (
              <RuneButton variant="primary" disabled={current || loading} onClick={() => handlePaid(plan.id)}>
                {current ? 'Plano atual' : busy ? 'Abrindo o portal...' : 'Assinar agora'}
              </RuneButton>
            )}
          </article>
        )
      })}
    </div>
  )
}
