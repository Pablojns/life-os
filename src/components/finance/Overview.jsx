import { useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { RuneButton } from '../UI'
import { sanitize, sanitizeNumber } from '../../lib/sanitize'
import { CATEGORY_ICONS, EXPENSE_CATEGORIES, INCOME_CATEGORIES, formatBRL, toNumber } from '../../lib/money'
import { toISODate } from '../../lib/dates'
import {
  budgetAlerts,
  financialScore,
  monthlyInsight,
  monthsToBuy,
  spentByCategory,
  upcomingRecurring,
} from '../../lib/financeMath'
import { BarChart, DonutChart } from './charts'
import styles from '../Finance.module.css'

export default function Overview({
  finances,
  goals,
  transactions,
  accounts,
  budgets,
  debts,
  recurring,
  habitPace,
  hasFullFinance,
  hasOpenFinance,
  saveFinances,
  addGoal,
  updateGoalProgress,
  deleteGoal,
  addTransaction,
  deleteTransaction,
  importCSV,
  fetchAccounts,
}) {
  const navigate = useNavigate()
  const now = new Date()
  const month = now.getMonth() + 1
  const year = now.getFullYear()
  const fileRef = useRef(null)
  const [income, setIncome] = useState('')
  const [fixed, setFixed] = useState('')
  const [goalOpen, setGoalOpen] = useState(false)
  const [goalName, setGoalName] = useState('')
  const [goalTarget, setGoalTarget] = useState('')
  const [goalDeadline, setGoalDeadline] = useState('')
  const [goalIcon, setGoalIcon] = useState('🛡️')
  const [addOpen, setAddOpen] = useState(null)
  const [addAmount, setAddAmount] = useState('')
  const [txType, setTxType] = useState('expense')
  const [txAmount, setTxAmount] = useState('')
  const [txCategory, setTxCategory] = useState('Alimentação')
  const [txDescription, setTxDescription] = useState('')
  const [txDate, setTxDate] = useState(toISODate())
  const [txAccount, setTxAccount] = useState('')
  const [savePerMonth, setSavePerMonth] = useState('')
  const [busy, setBusy] = useState(false)
  const [csvStatus, setCsvStatus] = useState('')
  const [csvPreview, setCsvPreview] = useState([])

  const categories = txType === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES
  const maxGoals = hasFullFinance ? 10 : 1
  const canAddGoal = goals.length < maxGoals
  const monthKey = `${year}-${String(month).padStart(2, '0')}`
  const prev = new Date(year, month - 2, 1)
  const prevKey = `${prev.getFullYear()}-${String(prev.getMonth() + 1).padStart(2, '0')}`

  const monthTransactions = useMemo(
    () => transactions.filter((item) => String(item.transaction_date).startsWith(monthKey)),
    [transactions, monthKey],
  )
  const prevTransactions = useMemo(
    () => transactions.filter((item) => String(item.transaction_date).startsWith(prevKey)),
    [transactions, prevKey],
  )

  const summary = useMemo(() => {
    const totalIncome = monthTransactions.filter((item) => item.type === 'income').reduce((sum, item) => sum + toNumber(item.amount), 0)
    const totalExpense = monthTransactions.filter((item) => item.type === 'expense').reduce((sum, item) => sum + toNumber(item.amount), 0)
    return { totalIncome, totalExpense, balance: totalIncome - totalExpense }
  }, [monthTransactions])

  const prevExpense = useMemo(
    () => prevTransactions.filter((item) => item.type === 'expense').reduce((sum, item) => sum + toNumber(item.amount), 0),
    [prevTransactions],
  )

  const spent = useMemo(() => spentByCategory(monthTransactions), [monthTransactions])
  const score = useMemo(
    () => financialScore({ goals, budgets, spentByCategory: spent, debts, transactions: monthTransactions }),
    [goals, budgets, spent, debts, monthTransactions],
  )
  const alerts = useMemo(() => budgetAlerts(budgets, spent), [budgets, spent])
  const dues = useMemo(() => upcomingRecurring(recurring), [recurring])

  const donutItems = useMemo(() => {
    return Object.entries(spent).map(([name, value]) => ({ name, value }))
  }, [spent])

  const barSeries = useMemo(() => {
    return Array.from({ length: 6 }, (_, index) => {
      const date = new Date(year, month - 6 + index, 1)
      const label = date.toLocaleDateString('pt-BR', { month: 'short' })
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      const monthRows = transactions.filter((item) => String(item.transaction_date).startsWith(key))
      return {
        label,
        income: monthRows.filter((item) => item.type === 'income').reduce((sum, item) => sum + toNumber(item.amount), 0),
        expense: monthRows.filter((item) => item.type === 'expense').reduce((sum, item) => sum + toNumber(item.amount), 0),
      }
    })
  }, [transactions, month, year])

  const topCategories = useMemo(() => {
    const total = summary.totalExpense || 1
    return Object.entries(spent)
      .map(([name, value]) => ({ name, value, share: Math.round((value / total) * 100) }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 3)
  }, [spent, summary.totalExpense])

  const goalPct = goals.length
    ? Math.round(goals.reduce((sum, goal) => sum + Math.min(100, (toNumber(goal.current_amount) / (toNumber(goal.target_amount) || 1)) * 100), 0) / goals.length)
    : 0
  const tip = monthlyInsight({
    income: summary.totalIncome,
    expense: summary.totalExpense,
    prevExpense,
    topCategories,
    goalPct,
    savings: summary.balance,
  })

  async function handleSaveConfig(event) {
    event.preventDefault()
    setBusy(true)
    try {
      await saveFinances({ income: sanitizeNumber(income || finances?.income), fixed_costs: sanitizeNumber(fixed || finances?.fixed_costs) })
      setIncome('')
      setFixed('')
    } finally {
      setBusy(false)
    }
  }

  async function handleAddGoal(event) {
    event.preventDefault()
    setBusy(true)
    try {
      await addGoal(sanitize(goalName), sanitizeNumber(goalTarget), goalDeadline, sanitize(goalIcon), '#C9A84C')
      setGoalName('')
      setGoalTarget('')
      setGoalDeadline('')
      setGoalOpen(false)
    } finally {
      setBusy(false)
    }
  }

  async function handleAddValue(event) {
    event.preventDefault()
    setBusy(true)
    try {
      await updateGoalProgress(addOpen, sanitizeNumber(addAmount))
      setAddOpen(null)
      setAddAmount('')
    } finally {
      setBusy(false)
    }
  }

  async function handleTransaction(event) {
    event.preventDefault()
    setBusy(true)
    try {
      await addTransaction(sanitizeNumber(txAmount), txType, sanitize(txCategory), sanitize(txDescription), txDate, txAccount || null)
      setTxAmount('')
      setTxDescription('')
      await fetchAccounts?.()
    } finally {
      setBusy(false)
    }
  }

  async function handleCSV(event) {
    const file = event.target.files?.[0]
    if (!file) return
    setBusy(true)
    setCsvStatus('Processando extrato...')
    try {
      const result = await importCSV(file)
      setCsvStatus(`${result.imported} transações importadas, ${result.errors} erros`)
      setCsvPreview(result.preview || [])
    } catch {
      setCsvStatus('Não foi possível importar o extrato.')
    } finally {
      setBusy(false)
      event.target.value = ''
    }
  }

  return (
    <>
      <section className={styles.block}>
        <h3>Saúde financeira</h3>
        <div className={`${styles.scoreCard} ${styles[score.tone] || ''}`}>
          <div className={styles.scoreRing} aria-label={`Score ${score.score}`}>
            <strong>{score.score}</strong>
            <span>/ 100</span>
          </div>
          <div>
            <p className={styles.healthName}>{score.name}</p>
            <p className={styles.hint}>
              Meta {Math.round(goalPct)}% · Orçamento · Dívidas em dia · Sequência de {score.streak} dia(s)
            </p>
          </div>
        </div>
        {alerts.map((alert) => (
          <p key={alert.id} className={styles.alert}>
            Você já gastou {Math.round(alert.usedPct)}% do orçamento de {alert.category}.
          </p>
        ))}
      </section>

      <section className={styles.block}>
        <h3>Resumo do mês</h3>
        <form className={styles.config} onSubmit={handleSaveConfig}>
          <label>
            Renda
            <input
              type="number"
              step="0.01"
              min="0"
              value={income}
              placeholder={finances?.income != null ? String(finances.income) : '5000'}
              onChange={(event) => setIncome(event.target.value)}
            />
          </label>
          <label>
            Gastos fixos
            <input
              type="number"
              step="0.01"
              min="0"
              value={fixed}
              placeholder={finances?.fixed_costs != null ? String(finances.fixed_costs) : '2000'}
              onChange={(event) => setFixed(event.target.value)}
            />
          </label>
          <RuneButton type="submit" variant="primary" disabled={busy}>
            Salvar configuração
          </RuneButton>
        </form>
        <div className={styles.summary}>
          <article className={styles.income}>
            <span>Receitas</span>
            <strong>{formatBRL(summary.totalIncome)}</strong>
          </article>
          <article className={styles.expense}>
            <span>Despesas</span>
            <strong>{formatBRL(summary.totalExpense)}</strong>
          </article>
          <article className={summary.balance >= 0 ? styles.positive : styles.negative}>
            <span>Economia do mês</span>
            <strong>{formatBRL(summary.balance)}</strong>
          </article>
        </div>
      </section>

      <section className={styles.block}>
        <h3>Próximos 7 dias</h3>
        {dues.length ? (
          <ul className={styles.list}>
            {dues.map((item) => (
              <li key={item.id}>
                <span>{item.type === 'income' ? '↑' : '↓'}</span>
                <div>
                  <strong>{item.name}</strong>
                  <small>Dia {item.due} · em {item.days} dia(s)</small>
                </div>
                <b className={item.type === 'income' ? styles.plus : styles.minus}>{formatBRL(item.amount)}</b>
              </li>
            ))}
          </ul>
        ) : (
          <p className={styles.hint}>Nenhum vencimento nos próximos 7 dias.</p>
        )}
      </section>

      <section className={styles.block}>
        <h3>Relatório mensal</h3>
        <p className={styles.hint}>
          Vs mês anterior: despesas {prevExpense ? `${summary.totalExpense >= prevExpense ? 'subiram' : 'caíram'} ${formatBRL(Math.abs(summary.totalExpense - prevExpense))}` : 'ainda sem histórico'}.
        </p>
        <ol className={styles.tops}>
          {topCategories.length ? topCategories.map((item, index) => (
            <li key={item.name}>
              {index + 1}. {item.name} · {item.share}% · {formatBRL(item.value)}
            </li>
          )) : <li>Sem gastos categorizados ainda.</li>}
        </ol>
        <p>Meta média: {goalPct}% · Economia: {formatBRL(summary.balance)}</p>
        <p className={styles.tip}>{tip}</p>
      </section>

      <section className={styles.block}>
        <header className={styles.row}>
          <h3>Planejamento de compras</h3>
          {canAddGoal ? (
            <RuneButton onClick={() => setGoalOpen((value) => !value)}>+ Nova meta</RuneButton>
          ) : null}
        </header>
        <label>
          Se eu guardar por mês
          <input type="number" min="0" step="0.01" value={savePerMonth} placeholder="300" onChange={(event) => setSavePerMonth(event.target.value)} />
        </label>
        {goalOpen && canAddGoal ? (
          <form className={styles.form} onSubmit={handleAddGoal}>
            <label>
              Nome
              <input value={goalName} onChange={(event) => setGoalName(event.target.value)} required />
            </label>
            <label>
              Alvo
              <input type="number" min="1" step="0.01" value={goalTarget} onChange={(event) => setGoalTarget(event.target.value)} required />
            </label>
            <label>
              Prazo
              <input type="date" value={goalDeadline} onChange={(event) => setGoalDeadline(event.target.value)} />
            </label>
            <label>
              Ícone
              <input value={goalIcon} onChange={(event) => setGoalIcon(event.target.value)} />
            </label>
            <RuneButton type="submit" variant="primary" disabled={busy}>
              Criar meta
            </RuneButton>
          </form>
        ) : null}

        {goals.map((goal) => {
          const current = toNumber(goal.current_amount)
          const target = toNumber(goal.target_amount) || 1
          const left = Math.max(0, target - current)
          const wait = monthsToBuy(left, savePerMonth || summary.balance)
          const pct = Math.min(100, Math.round((current / target) * 100))
          const late = goal.deadline && goal.deadline < toISODate()
          return (
            <article key={goal.id} className={styles.goal}>
              <div className={styles.goalHead}>
                <strong>
                  {goal.icon} {goal.name}
                </strong>
                <button type="button" onClick={() => deleteGoal(goal.id)} aria-label={`Excluir ${goal.name}`}>
                  ×
                </button>
              </div>
              <div className={styles.track} aria-hidden="true">
                <div className={styles.fill} style={{ width: `${pct}%`, background: goal.color || 'var(--color-primary)' }} />
              </div>
              <p>
                {formatBRL(current)} / {formatBRL(target)} · {pct}%
              </p>
              <p className={styles.hint}>
                {wait === Infinity
                  ? 'Defina quanto guardar por mês para ver o prazo.'
                  : `Com esse ritmo, chega em ${wait} mês(es).`}
              </p>
              {goal.deadline ? <span className={late ? styles.late : styles.ok}>Prazo {goal.deadline}</span> : null}
              <RuneButton onClick={() => setAddOpen(goal.id)}>Adicionar valor</RuneButton>
              {addOpen === goal.id ? (
                <form className={styles.form} onSubmit={handleAddValue}>
                  <label>
                    Valor
                    <input type="number" min="0.01" step="0.01" value={addAmount} onChange={(event) => setAddAmount(event.target.value)} required />
                  </label>
                  <RuneButton type="submit" variant="primary" disabled={busy}>
                    Confirmar
                  </RuneButton>
                </form>
              ) : null}
              {habitPace >= 80 ? <span className={styles.fire}>🔥 Ritmo acelerado — você está no caminho certo</span> : null}
            </article>
          )
        })}
      </section>

      <section className={styles.block}>
        <h3>Transações</h3>
        {!hasFullFinance ? (
          <div className={styles.lock}>
            <p>Transações liberadas no plano Herói Mensal.</p>
            <RuneButton variant="primary" onClick={() => navigate('/plans')}>
              Ver planos
            </RuneButton>
          </div>
        ) : (
          <>
            <form className={styles.form} onSubmit={handleTransaction}>
              <div className={styles.toggle}>
                <button type="button" className={txType === 'income' ? styles.on : ''} onClick={() => { setTxType('income'); setTxCategory('Salário') }}>
                  Receita
                </button>
                <button type="button" className={txType === 'expense' ? styles.on : ''} onClick={() => { setTxType('expense'); setTxCategory('Alimentação') }}>
                  Despesa
                </button>
              </div>
              <label>
                Valor
                <input type="number" min="0.01" step="0.01" value={txAmount} onChange={(event) => setTxAmount(event.target.value)} required />
              </label>
              <label>
                Categoria
                <select value={txCategory} onChange={(event) => setTxCategory(event.target.value)}>
                  {categories.map((item) => (
                    <option key={item}>{item}</option>
                  ))}
                </select>
              </label>
              <label>
                Conta
                <select value={txAccount} onChange={(event) => setTxAccount(event.target.value)}>
                  <option value="">Sem conta</option>
                  {accounts.map((account) => (
                    <option key={account.id} value={account.id}>
                      {account.icon} {account.name}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Descrição
                <input value={txDescription} onChange={(event) => setTxDescription(event.target.value)} />
              </label>
              <label>
                Data
                <input type="date" value={txDate} onChange={(event) => setTxDate(event.target.value)} required />
              </label>
              <RuneButton type="submit" variant="primary" disabled={busy}>
                Registrar
              </RuneButton>
            </form>
            <ul className={styles.list}>
              {monthTransactions.map((item) => (
                <li key={item.id}>
                  <span>{CATEGORY_ICONS[item.category] || '✨'}</span>
                  <div>
                    <strong>{item.description || item.category}</strong>
                    <small>{item.transaction_date}</small>
                  </div>
                  <b className={item.type === 'income' ? styles.plus : styles.minus}>
                    {item.type === 'income' ? '+' : '-'}
                    {formatBRL(item.amount)}
                  </b>
                  <button type="button" onClick={() => deleteTransaction(item.id)} aria-label="Excluir transação">
                    ×
                  </button>
                </li>
              ))}
            </ul>
          </>
        )}
      </section>

      <section className={styles.block}>
        <h3>Gráficos</h3>
        {!hasFullFinance ? (
          <div className={styles.lock}>
            <p>Gráficos liberados no plano Herói Mensal.</p>
            <RuneButton variant="primary" onClick={() => navigate('/plans')}>
              Ver planos
            </RuneButton>
          </div>
        ) : (
          <div className={styles.charts}>
            {donutItems.length ? <DonutChart items={donutItems} /> : <p>Registre uma despesa para ver o donut.</p>}
            <BarChart series={barSeries} />
          </div>
        )}
      </section>

      <section className={styles.block}>
        <h3>Open Finance</h3>
        {!hasOpenFinance ? (
          <div className={styles.lock}>
            <p>Importação de extrato no plano Semestral ou Anual.</p>
            <RuneButton variant="primary" onClick={() => navigate('/plans')}>
              Ver planos
            </RuneButton>
          </div>
        ) : (
          <article className={styles.card}>
            <p>Exporte o extrato do seu banco em CSV e importe aqui. Compatível com: Nubank, Itaú, Bradesco, Inter</p>
            <input ref={fileRef} type="file" accept=".csv,text/csv" hidden onChange={handleCSV} />
            <RuneButton variant="primary" disabled={busy} onClick={() => fileRef.current?.click()}>
              Importar extrato CSV
            </RuneButton>
            {csvStatus ? <p>{csvStatus}</p> : null}
            {csvPreview.length ? (
              <ul className={styles.list}>
                {csvPreview.map((item) => (
                  <li key={`${item.date}-${item.description}`}>
                    <div>
                      <strong>{item.description}</strong>
                      <small>{item.date}</small>
                    </div>
                    <b>{formatBRL(item.amount)}</b>
                  </li>
                ))}
              </ul>
            ) : null}
          </article>
        )}
      </section>
    </>
  )
}
