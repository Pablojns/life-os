import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import { useUserProfile } from '../hooks/useUserProfile'
import { useQuests } from '../hooks/useQuests'
import { useHabits } from '../hooks/useHabits'
import { useFinances } from '../hooks/useFinances'
import { getSuggestionsForProfile } from '../lib/suggestions'
import { readQuiz } from '../lib/quiz'
import styles from './Onboarding.module.css'

const WAKES = Array.from({ length: 8 }, (_, i) => `${String(i + 5).padStart(2, '0')}:00`)
const SLEEPS = ['20:00', '21:00', '22:00', '23:00', '00:00', '01:00', '02:00']
const INCOME = [
  { id: '1500', label: 'até R$1.500', value: 1500 },
  { id: '3000', label: 'R$1.500-3.000', value: 2500 },
  { id: '6000', label: 'R$3.000-6.000', value: 4500 },
  { id: 'plus', label: 'R$6.000+', value: 8000 },
]

export default function Onboarding() {
  const { user, updateProfile } = useAuth()
  const { setTheme } = useTheme()
  const { row, loading, upsert } = useUserProfile()
  const { addQuest } = useQuests()
  const { addHabit } = useHabits()
  const { saveFinances, addGoal } = useFinances()
  const navigate = useNavigate()
  const quiz = readQuiz()
  const pack = getSuggestionsForProfile(quiz?.type || row?.profile_type || 'procrastinator')

  const [step, setStep] = useState(1)
  const [hero, setHero] = useState('')
  const [wake, setWake] = useState('07:00')
  const [sleep, setSleep] = useState('23:00')
  const [income, setIncome] = useState('3000')
  const [debt, setDebt] = useState('nao')
  const [fixed, setFixed] = useState('Aluguel')
  const [quest, setQuest] = useState(0)
  const [habits, setHabits] = useState(pack.habits.map(() => true))
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  if (!loading && row?.onboarding_completed) return <Navigate to="/dashboard" replace />
  if (!user) return <Navigate to="/login" replace />

  async function saveBase(event) {
    event.preventDefault()
    setBusy(true)
    setError('')
    try {
      if (hero.trim()) {
        await updateProfile({ name: hero.trim(), ...(quiz?.theme ? { skin_active: quiz.theme } : {}) }).catch(() => {})
      }
      if (quiz?.theme) await setTheme(quiz.theme).catch(() => {})
      await upsert({
        wake_time: wake,
        sleep_time: sleep,
        profile_type: quiz?.type,
        profile_name: quiz?.name,
        suggested_theme: quiz?.theme,
        quiz_answers: quiz?.quiz_answers,
      }).catch((err) => {
        setError(err.message || 'Não foi possível salvar o perfil. Seguimos mesmo assim.')
      })
      setStep(2)
    } catch (err) {
      setError(err.message || 'Algo falhou. Tente de novo.')
      setStep(2)
    } finally {
      setBusy(false)
    }
  }

  async function saveMoney(event) {
    event.preventDefault()
    setBusy(true)
    setError('')
    try {
      const incomeValue = INCOME.find((item) => item.id === income)?.value || 2500
      await saveFinances({ income: incomeValue, fixed_costs: fixed === 'Outros' ? 800 : 1200 })
      if (pack.financialGoal) {
        await addGoal(pack.financialGoal.name, pack.financialGoal.targetAmount).catch(() => {})
      }
      await upsert({ work_type: income, main_challenge: debt }).catch(() => {})
      setStep(3)
    } catch (err) {
      setError(err.message || 'Não foi possível salvar as finanças. Seguimos.')
      setStep(3)
    } finally {
      setBusy(false)
    }
  }

  async function enter(event) {
    event.preventDefault()
    setBusy(true)
    setError('')
    try {
      const chosen = pack.quests[quest]
      if (chosen) await addQuest(chosen.title, chosen.reward, chosen.xp).catch(() => {})
      await Promise.all(
        pack.habits.filter((_, index) => habits[index]).map((item) => addHabit(item.name, item.xpPerDay).catch(() => {})),
      )
      await upsert({ onboarding_completed: true }).catch(() => {})
      navigate('/dashboard', { replace: true })
    } catch (err) {
      setError(err.message || 'Não foi possível entrar. Tente de novo.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className={styles.page} data-onboarding={step}>
      <p className={styles.kicker}>Passo {step} de 3</p>
      {error ? <p className={styles.error}>{error}</p> : null}
      {step === 1 ? (
        <form onSubmit={saveBase}>
          <h1>Vamos configurar sua base</h1>
          <label>
            Qual seu nome de herói?
            <input value={hero} onChange={(event) => setHero(event.target.value)} required />
          </label>
          <label>
            Que horas você acorda?
            <select value={wake} onChange={(event) => setWake(event.target.value)}>
              {WAKES.map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
          </label>
          <label>
            Que horas você dorme?
            <select value={sleep} onChange={(event) => setSleep(event.target.value)}>
              {SLEEPS.map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
          </label>
          <button type="submit" disabled={busy}>
            Continuar
          </button>
        </form>
      ) : null}

      {step === 2 ? (
        <form onSubmit={saveMoney}>
          <h1>Sua situação financeira</h1>
          <label>
            Qual sua renda mensal aproximada?
            <select value={income} onChange={(event) => setIncome(event.target.value)}>
              {INCOME.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.label}
                </option>
              ))}
            </select>
          </label>
          <label>
            Você tem dívidas?
            <select value={debt} onChange={(event) => setDebt(event.target.value)}>
              <option value="preocupo">Sim — me preocupo</option>
              <option value="controlo">Sim — mas controlo</option>
              <option value="nao">Não</option>
            </select>
          </label>
          <label>
            Qual seu maior gasto fixo?
            <select value={fixed} onChange={(event) => setFixed(event.target.value)}>
              <option>Aluguel</option>
              <option>Financiamento</option>
              <option>Transporte</option>
              <option>Outros</option>
            </select>
          </label>
          <button type="submit" disabled={busy}>
            Continuar
          </button>
        </form>
      ) : null}

      {step === 3 ? (
        <form onSubmit={enter}>
          <h1>Sua primeira missão começa agora</h1>
          <p>Escolha 1 para começar hoje</p>
          <div className={styles.list}>
            {pack.quests.slice(0, 3).map((item, index) => (
              <label key={item.title} className={styles.pick}>
                <input type="radio" checked={quest === index} onChange={() => setQuest(index)} />
                <span>
                  {item.title}
                  <small>
                    {item.xp} XP{item.reward ? ` · ${item.reward}` : ''}
                  </small>
                </span>
              </label>
            ))}
          </div>
          <p>Adicionar estes hábitos?</p>
          {pack.habits.slice(0, 2).map((item, index) => (
            <label key={item.name} className={styles.pick}>
              <input
                type="checkbox"
                checked={habits[index]}
                onChange={() => setHabits((current) => current.map((value, i) => (i === index ? !value : value)))}
              />
              <span>{item.name}</span>
            </label>
          ))}
          <button type="submit" disabled={busy}>
            Entrar no sistema
          </button>
        </form>
      ) : null}
    </section>
  )
}
