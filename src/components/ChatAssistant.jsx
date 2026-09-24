import { useState } from 'react'
import { useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import { useChatAssistant } from '../hooks/useChatAssistant'
import styles from './ChatAssistant.module.css'

const ICONS = { skyrim: '📜', naruto: '🍥', solo: '◎', clean: '💬' }

export default function ChatAssistant() {
  const { user } = useAuth()
  const { theme } = useTheme()
  const location = useLocation()
  const { messages, loading, send, applyAction, persist, placeholder } = useChatAssistant()
  const [open, setOpen] = useState(false)
  const [draft, setDraft] = useState('')
  const [pending, setPending] = useState(null)
  const [quick, setQuick] = useState([])

  if (!user) return null
  if (/^\/(login|register)/.test(location.pathname)) return null

  async function handleSend(text = draft) {
    if (!text.trim() || loading) return
    setDraft('')
    const result = await send(text).catch(() => null)
    if (result?.action === 'need_method') {
      setPending(result.pending)
      setQuick(['Cartão', 'Pix', 'Dinheiro'])
      return
    }
    setPending(null)
    setQuick(result?.quickReplies || [])
  }

  async function handleQuick(label) {
    if (pending) {
      const applied = await applyAction('add_transaction', { ...pending, method: label })
      if (applied.feedback) await persist('assistant', applied.feedback, applied.action)
      setPending(null)
      setQuick([])
      return
    }
    handleSend(label)
  }

  return (
    <div className={`${styles.wrap} ${styles[theme] || ''}`} data-chat-assistant="true">
      {open ? (
        <section className={styles.panel} aria-label="Assistente">
          <header>
            <strong>{placeholder}</strong>
            <button type="button" onClick={() => setOpen(false)} aria-label="Fechar chat">
              ×
            </button>
          </header>
          <div className={styles.thread}>
            {messages.map((item) => (
              <p key={item.id} className={item.role === 'user' ? styles.me : styles.bot}>
                {item.content}
              </p>
            ))}
            {loading ? <p className={`${styles.bot} ${styles.typing}`}>digitando...</p> : null}
          </div>
          {quick.length ? (
            <div className={styles.quick}>
              {quick.map((item) => (
                <button key={item} type="button" onClick={() => handleQuick(item)}>
                  {item === 'Cartão' ? '💳 Cartão' : item === 'Pix' ? '📱 Pix' : item === 'Dinheiro' ? '💵 Dinheiro' : item}
                </button>
              ))}
            </div>
          ) : null}
          <form
            onSubmit={(event) => {
              event.preventDefault()
              handleSend()
            }}
          >
            <input value={draft} onChange={(event) => setDraft(event.target.value)} placeholder={placeholder} />
            <button type="submit" disabled={loading}>
              Enviar
            </button>
          </form>
        </section>
      ) : null}
      <button type="button" className={styles.fab} onClick={() => setOpen((value) => !value)} aria-label="Abrir assistente">
        {ICONS[theme] || '💬'}
      </button>
    </div>
  )
}
