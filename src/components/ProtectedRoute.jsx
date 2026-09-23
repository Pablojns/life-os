/**
 * Guarda rotas autenticadas. Mostra spinner Skyrim enquanto a sessão carrega.
 */
import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
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

  if (loading) return <AuthSpinner />
  if (!user) return <Navigate to="/login" replace />
  return children
}
