import { useMemo, useState } from 'react'
import { RuneButton } from '../UI'
import { formatBRL, toNumber } from '../../lib/money'
import { ACCOUNT_TYPES, netWorth } from '../../lib/financeMath'
import { DonutChart } from './charts'
import styles from '../Finance.module.css'

export default function AccountsPanel({ accounts, addAccount, deleteAccount, transfer, fetchAccounts }) {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [type, setType] = useState('checking')
  const [balance, setBalance] = useState('')
  const [fromId, setFromId] = useState('')
  const [toId, setToId] = useState('')
  const [amount, setAmount] = useState('')
  const [busy, setBusy] = useState(false)

  const total = netWorth(accounts)
  const donut = useMemo(
    () =>
      accounts
        .filter((item) => item.type !== 'credit' && toNumber(item.balance) > 0)
        .map((item) => ({ name: item.name, value: toNumber(item.balance), color: item.color })),
    [accounts],
  )

  async function handleAdd(event) {
    event.preventDefault()
    setBusy(true)
    try {
      const meta = ACCOUNT_TYPES.find((item) => item.id === type)
      await addAccount({ name, type, balance, icon: meta?.icon, color: type === 'credit' ? '#EF4444' : '#C9A84C' })
      setName('')
      setBalance('')
      setOpen(false)
    } finally {
      setBusy(false)
    }
  }

  async function handleTransfer(event) {
    event.preventDefault()
    setBusy(true)
    try {
      await transfer(fromId, toId, amount)
      setAmount('')
      await fetchAccounts?.()
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <section className={styles.block}>
        <header className={styles.row}>
          <h3>Patrimônio consolidado</h3>
          <RuneButton onClick={() => setOpen((value) => !value)}>+ Nova conta</RuneButton>
        </header>
        <p className={styles.heroNumber}>{formatBRL(total)}</p>
        {open ? (
          <form className={styles.form} onSubmit={handleAdd}>
            <label>
              Nome
              <input value={name} onChange={(event) => setName(event.target.value)} required />
            </label>
            <label>
              Tipo
              <select value={type} onChange={(event) => setType(event.target.value)}>
                {ACCOUNT_TYPES.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.icon} {item.label}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Saldo atual
              <input type="number" step="0.01" value={balance} onChange={(event) => setBalance(event.target.value)} required />
            </label>
            <RuneButton type="submit" variant="primary" disabled={busy}>
              Criar conta
            </RuneButton>
          </form>
        ) : null}
        <ul className={styles.list}>
          {accounts.map((account) => (
            <li key={account.id}>
              <span>{account.icon}</span>
              <div>
                <strong>{account.name}</strong>
                <small>{ACCOUNT_TYPES.find((item) => item.id === account.type)?.label}</small>
              </div>
              <b>{formatBRL(account.balance)}</b>
              <button type="button" onClick={() => deleteAccount(account.id)} aria-label={`Excluir ${account.name}`}>
                ×
              </button>
            </li>
          ))}
        </ul>
        {!accounts.length ? <p className={styles.hint}>Crie uma conta corrente para começar a vincular gastos.</p> : null}
      </section>

      <section className={styles.block}>
        <h3>Transferir entre contas</h3>
        <form className={styles.form} onSubmit={handleTransfer}>
          <label>
            De
            <select value={fromId} onChange={(event) => setFromId(event.target.value)} required>
              <option value="">Escolha</option>
              {accounts.map((account) => (
                <option key={account.id} value={account.id}>
                  {account.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            Para
            <select value={toId} onChange={(event) => setToId(event.target.value)} required>
              <option value="">Escolha</option>
              {accounts.map((account) => (
                <option key={account.id} value={account.id}>
                  {account.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            Valor
            <input type="number" min="0.01" step="0.01" value={amount} onChange={(event) => setAmount(event.target.value)} required />
          </label>
          <RuneButton type="submit" variant="primary" disabled={busy || accounts.length < 2}>
            Transferir
          </RuneButton>
        </form>
      </section>

      <section className={styles.block}>
        <h3>Distribuição do patrimônio</h3>
        {donut.length ? <DonutChart items={donut} label="Patrimônio por conta" /> : <p className={styles.hint}>Adicione saldos positivos para ver a pizza.</p>}
      </section>
    </>
  )
}
