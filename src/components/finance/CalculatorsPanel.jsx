import { useMemo, useState } from 'react'
import { formatBRL } from '../../lib/money'
import { compoundFuture, emergencyReserve, freedomYears, installmentCost } from '../../lib/financeMath'
import styles from '../Finance.module.css'

export default function CalculatorsPanel({ finances, summary }) {
  const [monthly, setMonthly] = useState('300')
  const [rate, setRate] = useState('10')
  const [years, setYears] = useState('10')
  const [initial, setInitial] = useState('0')
  const [price, setPrice] = useState('2000')
  const [installments, setInstallments] = useState('12')
  const [monthRate, setMonthRate] = useState('1.99')

  const future = useMemo(() => compoundFuture(monthly, rate, years, initial), [monthly, rate, years, initial])
  const parcel = useMemo(() => installmentCost(price, installments, monthRate), [price, installments, monthRate])
  const reserve = emergencyReserve(finances?.fixed_costs || summary?.totalExpense || 0)
  const save = Math.max(0, (summary?.totalIncome || 0) - (summary?.totalExpense || 0))
  const freedom = freedomYears(summary?.totalIncome || finances?.income, save || monthly, finances?.fixed_costs || summary?.totalExpense || 0)

  return (
    <>
      <section className={styles.block}>
        <h3>Juros compostos</h3>
        <div className={styles.form}>
          <label>
            Aporte mensal
            <input type="number" value={monthly} onChange={(event) => setMonthly(event.target.value)} />
          </label>
          <label>
            % ao ano
            <input type="number" value={rate} onChange={(event) => setRate(event.target.value)} />
          </label>
          <label>
            Anos
            <input type="number" value={years} onChange={(event) => setYears(event.target.value)} />
          </label>
          <label>
            Valor inicial
            <input type="number" value={initial} onChange={(event) => setInitial(event.target.value)} />
          </label>
        </div>
        <p className={styles.heroNumber}>{formatBRL(future)}</p>
        <p className={styles.hint}>
          Se investir {formatBRL(monthly)} por mês a {rate}% ao ano, em {years} anos terá cerca disso.
        </p>
      </section>

      <section className={styles.block}>
        <h3>Parcelamento</h3>
        <div className={styles.form}>
          <label>
            Valor à vista
            <input type="number" value={price} onChange={(event) => setPrice(event.target.value)} />
          </label>
          <label>
            Parcelas
            <input type="number" value={installments} onChange={(event) => setInstallments(event.target.value)} />
          </label>
          <label>
            Juros % a.m.
            <input type="number" value={monthRate} onChange={(event) => setMonthRate(event.target.value)} />
          </label>
        </div>
        <p>
          {installments}x de {formatBRL(parcel.installment)} · total {formatBRL(parcel.total)}
        </p>
        <p className={styles.alert}>Este parcelamento vai custar {formatBRL(parcel.interest)} de juros.</p>
      </section>

      <section className={styles.block}>
        <h3>Reserva de emergência</h3>
        <p className={styles.heroNumber}>{formatBRL(reserve)}</p>
        <p className={styles.hint}>Com seus gastos fixos, você precisa disso para 6 meses de colchão.</p>
      </section>

      <section className={styles.block}>
        <h3>Independência financeira</h3>
        <p className={styles.heroNumber}>
          {Number.isFinite(freedom) ? `${freedom.toFixed(1)} anos` : 'Aumente a economia mensal'}
        </p>
        <p className={styles.hint}>
          Com a economia atual e 6% ao ano, liberdade (25× despesas anuais) em cerca desse tempo.
        </p>
      </section>
    </>
  )
}
