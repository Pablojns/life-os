import { toNumber } from './money'

export const ACCOUNT_TYPES = [
  { id: 'checking', label: 'Corrente', icon: '🏦' },
  { id: 'savings', label: 'Poupança', icon: '🐷' },
  { id: 'investment', label: 'Investimento', icon: '📈' },
  { id: 'wallet', label: 'Carteira', icon: '👛' },
  { id: 'credit', label: 'Cartão', icon: '💳' },
]

export const DEBT_CATEGORIES = ['cartão', 'empréstimo', 'financiamento', 'outros']

export function clamp(value, min = 0, max = 100) {
  return Math.min(max, Math.max(min, value))
}

export function pct(part, total) {
  if (!total) return 0
  return clamp((toNumber(part) / toNumber(total)) * 100)
}

export function healthLabel(score) {
  if (score >= 81) return { name: 'Excelente', tone: 'excellent' }
  if (score >= 61) return { name: 'Saudável', tone: 'healthy' }
  if (score >= 41) return { name: 'Estável', tone: 'stable' }
  if (score >= 21) return { name: 'Atenção', tone: 'warn' }
  return { name: 'Crítico', tone: 'critical' }
}

export function budgetTone(usedPct) {
  if (usedPct >= 90) return 'red'
  if (usedPct >= 70) return 'yellow'
  return 'green'
}

export function goalCompletionPct(goals) {
  if (!goals?.length) return 0
  const avg =
    goals.reduce((sum, goal) => sum + pct(goal.current_amount, goal.target_amount || 1), 0) / goals.length
  return avg
}

export function budgetRespectPct(budgets, spentByCategory) {
  if (!budgets?.length) return 100
  const respected = budgets.filter((item) => {
    const spent = spentByCategory[item.category] || 0
    return spent <= toNumber(item.limit_amount)
  }).length
  return (respected / budgets.length) * 100
}

export function debtsOnTimePct(debts, today = new Date()) {
  if (!debts?.length) return 100
  const day = today.getDate()
  const onTime = debts.filter((debt) => {
    if (toNumber(debt.remaining_amount) <= 0) return true
    if (!debt.due_day) return true
    return Number(debt.due_day) >= day
  }).length
  return (onTime / debts.length) * 100
}

export function recordStreak(transactions, today = new Date()) {
  const days = new Set(
    (transactions || [])
      .map((item) => String(item.transaction_date || '').slice(0, 10))
      .filter(Boolean),
  )
  let streak = 0
  const cursor = new Date(today.getFullYear(), today.getMonth(), today.getDate())
  if (!days.has(iso(cursor))) cursor.setDate(cursor.getDate() - 1)
  while (days.has(iso(cursor)) && streak < 30) {
    streak += 1
    cursor.setDate(cursor.getDate() - 1)
  }
  return streak
}

function iso(date) {
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${date.getFullYear()}-${month}-${day}`
}

export function financialScore({ goals, budgets, spentByCategory, debts, transactions, today }) {
  const goalPart = goalCompletionPct(goals) * 0.3
  const budgetPart = budgetRespectPct(budgets, spentByCategory) * 0.3
  const debtPart = debtsOnTimePct(debts, today) * 0.2
  const streakPart = (recordStreak(transactions, today) / 30) * 20
  const score = Math.round(clamp(goalPart + budgetPart + debtPart + streakPart))
  return { score, ...healthLabel(score), streak: recordStreak(transactions, today) }
}

export function netWorth(accounts) {
  return (accounts || []).reduce((sum, account) => {
    const balance = toNumber(account.balance)
    return account.type === 'credit' ? sum - balance : sum + balance
  }, 0)
}

export function amortize(remaining, annualRate, monthlyPayment) {
  const start = toNumber(remaining)
  const payment = toNumber(monthlyPayment)
  const rate = toNumber(annualRate) / 100 / 12
  if (start <= 0) return { months: 0, interest: 0 }
  if (payment <= 0) return { months: Infinity, interest: Infinity }
  let balance = start
  let months = 0
  let interest = 0
  while (balance > 0.01 && months < 600) {
    const fee = balance * rate
    if (payment <= fee && rate > 0) return { months: Infinity, interest: Infinity }
    interest += fee
    balance = balance + fee - payment
    months += 1
  }
  return { months, interest }
}

export function extraPayoff(remaining, annualRate, monthlyPayment, extra) {
  return amortize(remaining, annualRate, toNumber(monthlyPayment) + toNumber(extra))
}

export function snowball(debts) {
  return [...(debts || [])].sort((a, b) => toNumber(a.remaining_amount) - toNumber(b.remaining_amount))
}

export function avalanche(debts) {
  return [...(debts || [])].sort((a, b) => toNumber(b.interest_rate) - toNumber(a.interest_rate))
}

export function monthsToBuy(target, monthlySave) {
  const need = Math.max(0, toNumber(target))
  const save = toNumber(monthlySave)
  if (need <= 0) return 0
  if (save <= 0) return Infinity
  return Math.ceil(need / save)
}

export function compoundFuture(monthly, annualRate, years, initial = 0) {
  const r = toNumber(annualRate) / 100 / 12
  const n = Math.round(toNumber(years) * 12)
  const pmt = toNumber(monthly)
  const pv = toNumber(initial)
  if (n <= 0) return pv
  if (!r) return pv + pmt * n
  const growth = (1 + r) ** n
  return pv * growth + pmt * ((growth - 1) / r)
}

export function installmentCost(amount, months, monthlyRate) {
  const pv = toNumber(amount)
  const n = Math.max(1, Math.round(toNumber(months)))
  const r = toNumber(monthlyRate) / 100
  if (!r) return { installment: pv / n, total: pv, interest: 0 }
  const factor = (r * (1 + r) ** n) / ((1 + r) ** n - 1)
  const installment = pv * factor
  const total = installment * n
  return { installment, total, interest: total - pv }
}

export function emergencyReserve(monthlyFixed) {
  return toNumber(monthlyFixed) * 6
}

export function freedomYears(monthlyIncome, monthlySave, monthlyExpense, annualRate = 6) {
  const nest = toNumber(monthlyExpense) * 12 * 25
  const save = toNumber(monthlySave)
  if (nest <= 0) return 0
  if (save <= 0) return Infinity
  const r = toNumber(annualRate) / 100 / 12
  if (!r) return nest / (save * 12)
  let balance = 0
  let months = 0
  while (balance < nest && months < 12 * 80) {
    balance = balance * (1 + r) + save
    months += 1
  }
  return months / 12
}

export function upcomingRecurring(items, today = new Date()) {
  const day = today.getDate()
  const last = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate()
  return (items || [])
    .filter((item) => item.active !== false)
    .map((item) => {
      const due = Math.min(Number(item.day_of_month) || 1, last)
      let days = due - day
      if (days < 0) days += last
      return { ...item, due, days }
    })
    .filter((item) => item.days <= 7)
    .sort((a, b) => a.days - b.days)
}

export function spentByCategory(transactions) {
  return (transactions || [])
    .filter((item) => item.type === 'expense')
    .reduce((map, item) => {
      const key = item.category || 'Outros'
      map[key] = (map[key] || 0) + toNumber(item.amount)
      return map
    }, {})
}

export function budgetAlerts(budgets, spent) {
  return (budgets || [])
    .map((budget) => {
      const used = spent[budget.category] || 0
      const limit = toNumber(budget.limit_amount)
      const usedPct = pct(used, limit)
      return { ...budget, used, usedPct, tone: budgetTone(usedPct) }
    })
    .filter((item) => item.usedPct >= 80)
}

export function monthlyInsight({ income, expense, prevExpense, topCategories, goalPct, savings }) {
  const top = topCategories[0]
  if (expense > income) {
    return 'Você gastou mais do que entrou. Corte 10% da maior categoria esta semana — um passo só, não tudo de uma vez.'
  }
  if (top && top.share >= 40) {
    return `${top.name} concentrou ${top.share}% dos gastos. Vale um teto explícito no orçamento.`
  }
  if (prevExpense && expense < prevExpense * 0.9) {
    return 'Os gastos caíram frente ao mês passado. Guarde a diferença na reserva antes que ela suma.'
  }
  if (goalPct >= 80) {
    return 'A meta está quase lá. Transforme o valor que sobrou em um aporte automático.'
  }
  if (savings > 0) {
    return `Você economizou ${savings > 500 ? 'bem' : 'um pouco'} este mês. O próximo passo é um orçamento nas 3 categorias mais caras.`
  }
  return 'Registre um gasto por dia. Consistência vale mais do que um extrato perfeito.'
}
