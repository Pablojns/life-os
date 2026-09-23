/**
 * Toasts no canto inferior direito.
 */
import { useNotifications } from '../hooks/useNotifications.jsx'
import styles from './Notifications.module.css'

export default function Notifications() {
  const { toasts } = useNotifications()

  return (
    <div className={styles.stack} aria-live="polite">
      {toasts.map((toast) => (
        <p key={toast.id} className={`${styles.toast} ${styles[toast.type] || ''}`}>
          {toast.message}
        </p>
      ))}
    </div>
  )
}
