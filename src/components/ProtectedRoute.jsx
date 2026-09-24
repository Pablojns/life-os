/**
 * Guarda rotas autenticadas. Mostra spinner Skyrim enquanto a sessão carrega.
 */
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useUserProfile } from '../hooks/useUserProfile'
import styles from './ProtectedRoute.module.css'

export function AuthSpinner() {
  return (
    <div className={styles.loader} role="status" aria-live="polite">
      <div className={styles.ring} aria-hidden="true" />
      <p>Consultando os pergaminhos...</p>
    </div>
  )
}

export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()
  const { row, loading: profileLoading } = useUserProfile()
  const location = useLocation()

  if (loading || profileLoading) return <AuthSpinner />
  if (!user) return <Navigate to="/login" replace />

  if (row && row.onboarding_completed === false && location.pathname !== '/onboarding') {
    return <Navigate to="/onboarding" replace />
  }
  return children
}
