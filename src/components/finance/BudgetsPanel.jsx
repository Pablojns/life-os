import { useMemo, useState } from 'react'
import { RuneButton } from '../UI'
import { EXPENSE_CATEGORIES, formatBRL } from '../../lib/money'
import { budgetTone, pct, spentByCategory } from '../../lib/financeMath'
import styles from '../Finance.module.css'

export default function BudgetsPanel({ budgets, prevBudgets = [], monthTransactions, prevTransactions, upsertBudget, deleteBudget }) {
  const [category, setCategory] = useState('Alimentação')
  const [limit, setLimit] = useState('')
  const [busy, setBusy] = useState(false)
  const spent = useMemo(() => spentByCategory(monthTransactions), [monthTransactions])
  const prevSpent = useMemo(() => spentByCategory(prevTransactions), [prevTransactions])

  async function handleSave(event) {
    event.preventDefault()
    setBusy(true)
    try {
      await upsertBudget(category, limit)
      setLimit('')
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className={styles.block}>
      <h3>Orçamento do mês</h3>
      {prevBudgets.length ? (
        <p className={styles.hint}>{prevBudgets.length} limite(s) no mês passado — compare as barras abaixo.</p>
      ) : null}
      <form className={styles.form} onSubmit={handleSave}>
        <label>
          Categoria
          <select value={category} onChange={(event) => setCategory(event.target.value)}>
            {EXPENSE_CATEGORIES.map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
        </label>
        <label>
          Limite
          <input type="number" min="1" step="0.01" value={limit} onChange={(event) => setLimit(event.target.value)} required />
        </label>
        <RuneButton type="submit" variant="primary" disabled={busy}>
          Salvar limite
        </RuneButton>
      </form>

      {budgets.map((budget) => {
        const used = spent[budget.category] || 0
        const usedPct = pct(used, budget.limit_amount)
        const last = prevSpent[budget.category] || 0
        const tone = budgetTone(usedPct)
        return (
          <article key={budget.id} className={styles.goal}>
            <div className={styles.goalHead}>
              <strong>{budget.category}</strong>
              <button type="button" onClick={() => deleteBudget(budget.id)} aria-label={`Excluir ${budget.category}`}>
                ×
              </button>
            </div>
            <div className={styles.track}>
              <div className={`${styles.fill} ${styles[tone]}`} style={{ width: `${Math.min(100, usedPct)}%` }} />
            </div>
            <p>
              {formatBRL(used)} / {formatBRL(budget.limit_amount)} · {Math.round(usedPct)}%
            </p>
            {usedPct >= 80 ? <p className={styles.alert}>Você já gastou {Math.round(usedPct)}% do orçamento de {budget.category}.</p> : null}
            <p className={styles.hint}>
              Mês passado: {formatBRL(last)}
              {last ? ` · ${used >= last ? 'subiu' : 'caiu'} ${formatBRL(Math.abs(used - last))}` : ''}
            </p>
          </article>
        )
      })}
      {!budgets.length ? <p className={styles.hint}>Comece por 3 tetos: alimentação, transporte e lazer. O resto espera.</p> : null}
    </section>
  )
}
