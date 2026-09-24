/**
 * Módulo financeiro: visão, contas, orçamento, dívidas, recorrentes e calculadoras.
 */
import { useEffect, useMemo, useState } from 'react'
import { useFinances } from '../hooks/useFinances'
import { useAccounts } from '../hooks/useAccounts'
import { useBudgets } from '../hooks/useBudgets'
import { useDebts } from '../hooks/useDebts'
import { useRecurring } from '../hooks/useRecurring'
import { useHabits, getPct } from '../hooks/useHabits'
import { daysInMonth } from '../lib/dates'
import { toNumber } from '../lib/money'
import Overview from './finance/Overview'
import AccountsPanel from './finance/AccountsPanel'
import BudgetsPanel from './finance/BudgetsPanel'
import DebtsPanel from './finance/DebtsPanel'
import RecurringPanel from './finance/RecurringPanel'
import CalculatorsPanel from './finance/CalculatorsPanel'
import styles from './Finance.module.css'

const TABS = [
  { id: 'overview', label: '📊 Visão Geral' },
  { id: 'accounts', label: '💳 Contas' },
  { id: 'budgets', label: '📅 Orçamento' },
  { id: 'debts', label: '💸 Dívidas' },
  { id: 'recurring', label: '🔄 Recorrentes' },
  { id: 'calc', label: '🧮 Calculadoras' },
]

export default function Finance() {
  const now = new Date()
  const month = now.getMonth() + 1
  const year = now.getFullYear()
  const prev = new Date(year, month - 2, 1)
  const prevMonth = prev.getMonth() + 1
  const prevYear = prev.getFullYear()

  const [tab, setTab] = useState('overview')
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
  const { accounts, addAccount, deleteAccount, transfer, fetchAccounts } = useAccounts()
  const { budgets, upsertBudget, deleteBudget, fetchBudgets } = useBudgets(month, year)
  const { debts, addDebt, payDebt, deleteDebt } = useDebts()
  const { items: recurring, addRecurring, toggleRecurring, deleteRecurring } = useRecurring()
  const { habits, checks } = useHabits()
  const [prevBudgets, setPrevBudgets] = useState([])

  useEffect(() => {
    fetchBudgets(prevMonth, prevYear).then(setPrevBudgets)
  }, [fetchBudgets, prevMonth, prevYear])

  const monthKey = `${year}-${String(month).padStart(2, '0')}`
  const prevKey = `${prevYear}-${String(prevMonth).padStart(2, '0')}`
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

  const habitPace = useMemo(() => {
    if (!habits.length) return 0
    const totalDays = daysInMonth(month, year)
    const avg = habits.reduce((sum, habit) => sum + getPct(habit.id, checks, totalDays), 0) / habits.length
    return Math.round(avg)
  }, [habits, checks, month, year])

  return (
    <section className={styles.section}>
      <header className={styles.head}>
        <h2>Finanças</h2>
      </header>

      <nav className={styles.subnav} aria-label="Áreas financeiras">
        {TABS.map((item) => (
          <button
            key={item.id}
            type="button"
            className={tab === item.id ? styles.subOn : ''}
            data-finance-tab={item.id}
            onClick={() => setTab(item.id)}
          >
            {item.label}
          </button>
        ))}
      </nav>

      {tab === 'overview' ? (
        <Overview
          finances={finances}
          goals={goals}
          transactions={transactions}
          accounts={accounts}
          budgets={budgets}
          debts={debts}
          recurring={recurring}
          habitPace={habitPace}
          hasFullFinance={hasFullFinance}
          hasOpenFinance={hasOpenFinance}
          saveFinances={saveFinances}
          addGoal={addGoal}
          updateGoalProgress={updateGoalProgress}
          deleteGoal={deleteGoal}
          addTransaction={addTransaction}
          deleteTransaction={deleteTransaction}
          importCSV={importCSV}
          fetchAccounts={fetchAccounts}
        />
      ) : null}

      {tab === 'accounts' ? (
        <AccountsPanel
          accounts={accounts}
          addAccount={addAccount}
          deleteAccount={deleteAccount}
          transfer={transfer}
          fetchAccounts={fetchAccounts}
        />
      ) : null}

      {tab === 'budgets' ? (
        <BudgetsPanel
          budgets={budgets}
          prevBudgets={prevBudgets}
          monthTransactions={monthTransactions}
          prevTransactions={prevTransactions}
          upsertBudget={upsertBudget}
          deleteBudget={deleteBudget}
        />
      ) : null}

      {tab === 'debts' ? (
        <DebtsPanel debts={debts} addDebt={addDebt} payDebt={payDebt} deleteDebt={deleteDebt} />
      ) : null}

      {tab === 'recurring' ? (
        <RecurringPanel
          items={recurring}
          addRecurring={addRecurring}
          toggleRecurring={toggleRecurring}
          deleteRecurring={deleteRecurring}
          addTransaction={addTransaction}
        />
      ) : null}

      {tab === 'calc' ? <CalculatorsPanel finances={finances} summary={summary} /> : null}

      {loading ? <p className={styles.hint}>Carregando o grimório financeiro...</p> : null}
    </section>
  )
}
