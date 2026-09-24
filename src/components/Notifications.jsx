/**
 * Toasts no canto inferior direito.
 */
import { useTheme } from '../context/ThemeContext'
import { useNotifications } from '../hooks/useNotifications.jsx'
import styles from './Notifications.module.css'

export default function Notifications() {
  const { toasts } = useNotifications()
  const { labels } = useTheme()
  const prefix = labels.toastPrefix ? `${labels.toastPrefix} ` : ''

  return (
    <div className={styles.stack} aria-live="polite">
      {toasts.map((toast) => (
        <p key={toast.id} className={`${styles.toast} ${styles[toast.type] || ''}`}>
          {prefix}
          {toast.message}
        </p>
      ))}
    </div>
  )
}
