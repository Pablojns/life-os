/**
 * Recompensas resgatáveis com XP.
 */
import { useState } from 'react'
import { sanitize, sanitizeNumber } from '../lib/sanitize'
import { useRewards } from '../hooks/useRewards'
import { useTheme } from '../context/ThemeContext'
import { RuneButton } from './UI'
import styles from './Rewards.module.css'

export default function Rewards() {
  const { rewards, loading, addReward, claimReward, deleteReward } = useRewards()
  const { labels, theme } = useTheme()
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [costXp, setCostXp] = useState(20)
  const [busy, setBusy] = useState(false)

  async function handleAdd(event) {
    event.preventDefault()
    setBusy(true)
    try {
      await addReward(sanitize(name), sanitizeNumber(costXp))
      setName('')
      setCostXp(20)
      setOpen(false)
    } catch {
      /* toast no hook */
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className={styles.section}>
      <header className={styles.head}>
        <h2>{labels.rewards}</h2>
        <RuneButton onClick={() => setOpen((value) => !value)}>
          {open ? 'Fechar' : `Novo ${labels.rewards.toLowerCase()}`}
        </RuneButton>
      </header>

      <div className={`${styles.slider} ${open ? styles.open : ''}`}>
        <form className={styles.form} onSubmit={handleAdd}>
          <label>
            Nome
            <input value={name} onChange={(event) => setName(event.target.value)} required />
          </label>
          <label>
            Custo em XP
            <input type="number" min="0" value={costXp} onChange={(event) => setCostXp(event.target.value)} />
          </label>
          <RuneButton type="submit" variant="primary" disabled={busy}>
            Guardar no baú
          </RuneButton>
        </form>
      </div>

      {loading ? (
        <div className={styles.skeleton} />
      ) : rewards.length === 0 ? (
        <div className={styles.empty}>
          <p>
            {theme === 'naruto'
              ? 'Nenhum prêmio da aldeia registrado. Todo ninja precisa de motivação.'
              : 'A taverna está vazia de recompensas. Para que lutar sem saque?'}
          </p>
          <RuneButton variant="primary" onClick={() => setOpen(true)}>
            {theme === 'naruto' ? 'Registrar prêmio' : 'Adicionar saque'}
          </RuneButton>
        </div>
      ) : (
        <ul className={styles.list}>
          {rewards.map((reward) => (
            <li key={reward.id} className={styles.card}>
              <h3>{reward.name}</h3>
              <p className={styles.meta}>{reward.cost_xp} XP</p>
              <div className={styles.actions}>
                <RuneButton
                  variant="primary"
                  disabled={busy}
                  onClick={() => claimReward(reward.id, reward.cost_xp)}
                >
                  Resgatar
                </RuneButton>
                <RuneButton variant="danger" disabled={busy} onClick={() => deleteReward(reward.id)}>
                  Excluir
                </RuneButton>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
