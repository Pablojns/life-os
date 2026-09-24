import { useMemo, useState } from 'react'
import { RuneButton } from '../UI'
import { formatBRL } from '../../lib/money'
import { DEBT_CATEGORIES, amortize, avalanche, extraPayoff, pct, snowball } from '../../lib/financeMath'
import styles from '../Finance.module.css'

export default function DebtsPanel({ debts, addDebt, payDebt, deleteDebt }) {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [total, setTotal] = useState('')
  const [remaining, setRemaining] = useState('')
  const [rate, setRate] = useState('0')
  const [payment, setPayment] = useState('')
  const [dueDay, setDueDay] = useState('10')
  const [category, setCategory] = useState('outros')
  const [extra, setExtra] = useState('100')
  const [payId, setPayId] = useState(null)
  const [payAmount, setPayAmount] = useState('')
  const [method, setMethod] = useState('snowball')
  const [busy, setBusy] = useState(false)

  const ordered = useMemo(() => (method === 'avalanche' ? avalanche(debts) : snowball(debts)), [debts, method])
  const interestIfIdle = useMemo(
    () => debts.reduce((sum, debt) => sum + amortize(debt.remaining_amount, debt.interest_rate, debt.monthly_payment).interest, 0),
    [debts],
  )

  async function handleAdd(event) {
    event.preventDefault()
    setBusy(true)
    try {
      await addDebt({
        name,
        total_amount: total,
        remaining_amount: remaining || total,
        interest_rate: rate,
        monthly_payment: payment,
        due_day: dueDay,
        category,
      })
      setName('')
      setTotal('')
      setRemaining('')
      setPayment('')
      setOpen(false)
    } finally {
      setBusy(false)
    }
  }

  async function handlePay(event) {
    event.preventDefault()
    setBusy(true)
    try {
      await payDebt(payId, payAmount)
      setPayId(null)
      setPayAmount('')
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <section className={styles.block}>
        <header className={styles.row}>
          <h3>Dívidas</h3>
          <RuneButton onClick={() => setOpen((value) => !value)}>+ Nova dívida</RuneButton>
        </header>
        <p className={styles.hint}>
          Se nada mudar, os juros totais somam {Number.isFinite(interestIfIdle) ? formatBRL(interestIfIdle) : 'infinito (parcela menor que o juro)'}.
        </p>
        <div className={styles.toggle}>
          <button type="button" className={method === 'snowball' ? styles.on : ''} onClick={() => setMethod('snowball')}>
            Bola de neve
          </button>
          <button type="button" className={method === 'avalanche' ? styles.on : ''} onClick={() => setMethod('avalanche')}>
            Avalanche
          </button>
        </div>
        {open ? (
          <form className={styles.form} onSubmit={handleAdd}>
            <label>
              Nome
              <input value={name} onChange={(event) => setName(event.target.value)} required />
            </label>
            <label>
              Valor total
              <input type="number" min="1" step="0.01" value={total} onChange={(event) => setTotal(event.target.value)} required />
            </label>
            <label>
              Resta
              <input type="number" min="0" step="0.01" value={remaining} onChange={(event) => setRemaining(event.target.value)} />
            </label>
            <label>
              Juros % a.a.
              <input type="number" min="0" step="0.01" value={rate} onChange={(event) => setRate(event.target.value)} />
            </label>
            <label>
              Parcela mensal
              <input type="number" min="0" step="0.01" value={payment} onChange={(event) => setPayment(event.target.value)} />
            </label>
            <label>
              Dia do vencimento
              <input type="number" min="1" max="31" value={dueDay} onChange={(event) => setDueDay(event.target.value)} />
            </label>
            <label>
              Categoria
              <select value={category} onChange={(event) => setCategory(event.target.value)}>
                {DEBT_CATEGORIES.map((item) => (
                  <option key={item}>{item}</option>
                ))}
              </select>
            </label>
            <RuneButton type="submit" variant="primary" disabled={busy}>
              Cadastrar
            </RuneButton>
          </form>
        ) : null}

        {ordered.map((debt, index) => {
          const progress = 100 - pct(debt.remaining_amount, debt.total_amount || 1)
          const plan = extraPayoff(debt.remaining_amount, debt.interest_rate, debt.monthly_payment, extra)
          const idle = amortize(debt.remaining_amount, debt.interest_rate, debt.monthly_payment)
          return (
            <article key={debt.id} className={styles.goal}>
              <div className={styles.goalHead}>
                <strong>
                  {index === 0 ? '👉 ' : ''}
                  {debt.name}
                </strong>
                <button type="button" onClick={() => deleteDebt(debt.id)} aria-label={`Excluir ${debt.name}`}>
                  ×
                </button>
              </div>
              <div className={styles.track}>
                <div className={`${styles.fill} ${styles.green}`} style={{ width: `${progress}%` }} />
              </div>
              <p>
                {formatBRL(debt.remaining_amount)} de {formatBRL(debt.total_amount)} · {debt.interest_rate}% a.a.
              </p>
              <p className={styles.hint}>
                No ritmo atual: {Number.isFinite(idle.months) ? `${idle.months} meses` : 'parcela não cobre o juro'} · juros {Number.isFinite(idle.interest) ? formatBRL(idle.interest) : '—'}
              </p>
              <p className={styles.tip}>
                Se pagar {formatBRL(extra)} a mais por mês, quita em {Number.isFinite(plan.months) ? `${plan.months} meses` : '—'}.
              </p>
              <RuneButton onClick={() => setPayId(debt.id)}>Registrar pagamento</RuneButton>
              {payId === debt.id ? (
                <form className={styles.form} onSubmit={handlePay}>
                  <label>
                    Valor
                    <input type="number" min="0.01" step="0.01" value={payAmount} onChange={(event) => setPayAmount(event.target.value)} required />
                  </label>
                  <RuneButton type="submit" variant="primary" disabled={busy}>
                    Baixar
                  </RuneButton>
                </form>
              ) : null}
            </article>
          )
        })}
      </section>

      <section className={styles.block}>
        <h3>Simulador de quitação</h3>
        <label>
          Extra mensal
          <input type="number" min="0" step="0.01" value={extra} onChange={(event) => setExtra(event.target.value)} />
        </label>
        <p className={styles.hint}>
          O método {method === 'snowball' ? 'bola de neve ataca a menor dívida primeiro (vitória rápida, ótimo para TDAH).' : 'avalanche ataca o maior juro primeiro (menos dinheiro jogado fora).'}
        </p>
      </section>
    </>
  )
}
