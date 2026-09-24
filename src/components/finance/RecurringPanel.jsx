import { useMemo, useState } from 'react'
import { RuneButton } from '../UI'
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES, formatBRL } from '../../lib/money'
import { toISODate } from '../../lib/dates'
import { upcomingRecurring } from '../../lib/financeMath'
import styles from '../Finance.module.css'

export default function RecurringPanel({ items, addRecurring, toggleRecurring, deleteRecurring, addTransaction }) {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [amount, setAmount] = useState('')
  const [type, setType] = useState('expense')
  const [category, setCategory] = useState('Moradia')
  const [day, setDay] = useState('5')
  const [busy, setBusy] = useState(false)
  const dues = useMemo(() => upcomingRecurring(items), [items])
  const categories = type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES

  async function handleAdd(event) {
    event.preventDefault()
    setBusy(true)
    try {
      await addRecurring({ name, amount, type, category, day_of_month: day })
      setName('')
      setAmount('')
      setOpen(false)
    } finally {
      setBusy(false)
    }
  }

  async function launch(item) {
    setBusy(true)
    try {
      await addTransaction(item.amount, item.type, item.category || 'Outros', item.name, toISODate())
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <section className={styles.block}>
        <header className={styles.row}>
          <h3>Recorrentes</h3>
          <RuneButton onClick={() => setOpen((value) => !value)}>+ Novo</RuneButton>
        </header>
        {dues.length ? (
          <div className={styles.alert}>
            {dues.length} vencimento(s) nos próximos 7 dias. Lance com um toque quando cair.
          </div>
        ) : (
          <p className={styles.hint}>Nada vence nos próximos 7 dias.</p>
        )}
        {open ? (
          <form className={styles.form} onSubmit={handleAdd}>
            <label>
              Nome
              <input value={name} onChange={(event) => setName(event.target.value)} placeholder="Aluguel, Netflix, salário" required />
            </label>
            <label>
              Valor
              <input type="number" min="0.01" step="0.01" value={amount} onChange={(event) => setAmount(event.target.value)} required />
            </label>
            <label>
              Tipo
              <select
                value={type}
                onChange={(event) => {
                  setType(event.target.value)
                  setCategory(event.target.value === 'income' ? 'Salário' : 'Moradia')
                }}
              >
                <option value="expense">Despesa</option>
                <option value="income">Receita</option>
              </select>
            </label>
            <label>
              Categoria
              <select value={category} onChange={(event) => setCategory(event.target.value)}>
                {categories.map((item) => (
                  <option key={item}>{item}</option>
                ))}
              </select>
            </label>
            <label>
              Dia do mês
              <input type="number" min="1" max="31" value={day} onChange={(event) => setDay(event.target.value)} required />
            </label>
            <RuneButton type="submit" variant="primary" disabled={busy}>
              Cadastrar
            </RuneButton>
          </form>
        ) : null}

        <ul className={styles.list}>
          {items.map((item) => (
            <li key={item.id} className={styles.wide}>
              <span>{item.active ? '●' : '○'}</span>
              <div>
                <strong>{item.name}</strong>
                <small>
                  Todo dia {item.day_of_month} · {item.category}
                </small>
              </div>
              <b className={item.type === 'income' ? styles.plus : styles.minus}>{formatBRL(item.amount)}</b>
              <div className={styles.inlineActions}>
                <RuneButton disabled={busy || !item.active} onClick={() => launch(item)}>
                  Lançar
                </RuneButton>
                <RuneButton onClick={() => toggleRecurring(item.id, !item.active)}>
                  {item.active ? 'Pausar' : 'Ativar'}
                </RuneButton>
                <button type="button" onClick={() => deleteRecurring(item.id)} aria-label={`Excluir ${item.name}`}>
                  ×
                </button>
              </div>
            </li>
          ))}
        </ul>
      </section>
    </>
  )
}
