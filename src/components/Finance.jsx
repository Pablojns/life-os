/**
 * Aba financeira: resumo, metas, transações, gráficos e Open Finance.
 */
import { useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useFinances } from '../hooks/useFinances'
import { useHabits, getPct } from '../hooks/useHabits'
import { useAuth } from '../context/AuthContext'
import { RuneButton } from './UI'
import { sanitize, sanitizeNumber } from '../lib/sanitize'
import { CATEGORY_ICONS, CHART_COLORS, EXPENSE_CATEGORIES, INCOME_CATEGORIES, formatBRL, toNumber } from '../lib/money'
import { daysInMonth, toISODate } from '../lib/dates'
import styles from './Finance.module.css'

function polar(cx, cy, radius, angle) {
  const rad = ((angle - 90) * Math.PI) / 180
  return [cx + radius * Math.cos(rad), cy + radius * Math.sin(rad)]
}

function slicePath(cx, cy, radius, start, end) {
  if (end - start >= 359.9) return `M ${cx} ${cy - radius} A ${radius} ${radius} 0 1 1 ${cx - 0.01} ${cy - radius} Z`
  const [x1, y1] = polar(cx, cy, radius, end)
  const [x2, y2] = polar(cx, cy, radius, start)
  const large = end - start > 180 ? 1 : 0
  return `M ${cx} ${cy} L ${x2} ${y2} A ${radius} ${radius} 0 ${large} 1 ${x1} ${y1} Z`
}

function DonutChart({ items }) {
  const total = items.reduce((sum, item) => sum + item.value, 0) || 1
  let angle = 0
  const slices = items.map((item, index) => {
    const size = (item.value / total) * 360
    const path = slicePath(80, 80, 70, angle, angle + Math.max(size, 0.01))
    angle += size
    return { ...item, path, color: CHART_COLORS[index % CHART_COLORS.length], pct: Math.round((item.value / total) * 100) }
  })

  return (
    <div className={styles.chartBox}>
      <svg viewBox="0 0 160 160" className={styles.donut} aria-label="Despesas por categoria">
        {slices.map((slice) => (
          <path key={slice.name} d={slice.path} fill={slice.color} />
        ))}
        <circle cx="80" cy="80" r="38" fill="var(--color-surface)" />
      </svg>
      <ul className={styles.legend}>
        {slices.map((slice) => (
          <li key={slice.name}>
            <span style={{ background: slice.color }} />
            {slice.name} · {slice.pct}% · {formatBRL(slice.value)}
          </li>
        ))}
      </ul>
    </div>
  )
}

function BarChart({ series }) {
  const max = Math.max(...series.flatMap((item) => [item.income, item.expense]), 1)
  return (
    <svg viewBox="0 0 360 180" className={styles.bars} aria-label="Receitas e despesas dos últimos 6 meses">
      {series.map((item, index) => {
        const x = 40 + index * 52
        const incomeH = (item.income / max) * 120
        const expenseH = (item.expense / max) * 120
        return (
          <g key={item.label}>
            <rect x={x} y={140 - incomeH} width="16" height={incomeH} fill="var(--color-success)" rx="2" />
            <rect x={x + 20} y={140 - expenseH} width="16" height={expenseH} fill="var(--color-danger)" rx="2" />
            <text x={x + 18} y="158" textAnchor="middle" fontSize="8" fill="var(--color-text-muted)">
              {item.label}
            </text>
          </g>
        )
      })}
      <text x="8" y="20" fontSize="8" fill="var(--color-text-muted)">
        {formatBRL(max)}
      </text>
    </svg>
  )
}

export default function Finance() {
  const navigate = useNavigate()
  const { hasAccess } = useAuth()
  const {
    finances,
    goals,
    transactions,
    loading,
    hasFullFinance,
    hasOpenFinance,
    saveFinances,
    addGoal,
    updateGoalProgress,
    deleteGoal,
    addTransaction,
    deleteTransaction,
    importCSV,
  } = useFinances()
  const { habits, checks } = useHabits()
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
  const [busy, setBusy] = useState(false)
  const [csvStatus, setCsvStatus] = useState('')
  const [csvPreview, setCsvPreview] = useState([])

  const categories = txType === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES
  const maxGoals = hasFullFinance ? 10 : 1
  const canAddGoal = goals.length < maxGoals

  const monthKey = `${year}-${String(month).padStart(2, '0')}`
  const monthTransactions = useMemo(
    () => transactions.filter((item) => String(item.transaction_date).startsWith(monthKey)),
    [transactions, monthKey],
  )

  const summary = useMemo(() => {
    const totalIncome = monthTransactions.filter((item) => item.type === 'income').reduce((sum, item) => sum + toNumber(item.amount), 0)
    const totalExpense = monthTransactions.filter((item) => item.type === 'expense').reduce((sum, item) => sum + toNumber(item.amount), 0)
    return { totalIncome, totalExpense, balance: totalIncome - totalExpense }
  }, [monthTransactions])

  const donutItems = useMemo(() => {
    const map = {}
    monthTransactions
      .filter((item) => item.type === 'expense')
      .forEach((item) => {
        const key = item.category || 'Outros'
        map[key] = (map[key] || 0) + toNumber(item.amount)
      })
    return Object.entries(map).map(([name, value]) => ({ name, value }))
  }, [monthTransactions])

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

  const habitPace = useMemo(() => {
    if (!habits.length) return 0
    const totalDays = daysInMonth(month, year)
    const avg = habits.reduce((sum, habit) => sum + getPct(habit.id, checks, totalDays), 0) / habits.length
    return Math.round(avg)
  }, [habits, checks, month, year])

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
      await addTransaction(sanitizeNumber(txAmount), txType, sanitize(txCategory), sanitize(txDescription), txDate)
      setTxAmount('')
      setTxDescription('')
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
    <section className={styles.section}>
      <header className={styles.head}>
        <h2>Finanças</h2>
      </header>

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
            <span>Saldo</span>
            <strong>{formatBRL(summary.balance)}</strong>
          </article>
        </div>
      </section>

      <section className={styles.block}>
        <header className={styles.row}>
          <h3>Metas financeiras</h3>
          {canAddGoal ? (
            <RuneButton onClick={() => setGoalOpen((value) => !value)}>+ Nova meta</RuneButton>
          ) : null}
        </header>
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
              <p className={styles.hint}>Complete seus hábitos para avançar mais rápido</p>
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
        {!hasOpenFinance && !hasAccess('semiannual') ? (
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
      {loading ? <p className={styles.hint}>Carregando o grimório financeiro...</p> : null}
    </section>
  )
}
