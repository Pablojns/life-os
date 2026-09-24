import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { QUIZ_QUESTIONS, saveQuiz, scoreQuiz } from '../lib/quiz'
import styles from './Quiz.module.css'

const ICONS = {
  a: (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="8" fill="none" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  ),
  b: (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <rect x="5" y="5" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  ),
  c: (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 4l8 16H4z" fill="none" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  ),
  d: (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 3l3 6 7 1-5 5 1 7-6-3-6 3 1-7-5-5 7-1z" fill="none" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  ),
}

export default function Quiz() {
  const navigate = useNavigate()
  const [step, setStep] = useState(0)
  const [answers, setAnswers] = useState({})
  const [result, setResult] = useState(null)
  const [altTheme, setAltTheme] = useState(null)
  const question = QUIZ_QUESTIONS[step]
  const geekScore = useMemo(
    () => Object.values(answers).filter((item) => item.tags?.includes('geek') || item.tags?.includes('level')).length,
    [answers],
  )

  function choose(option) {
    const next = { ...answers, [question.id]: option }
    setAnswers(next)
    if (step < QUIZ_QUESTIONS.length - 1) {
      setStep((value) => value + 1)
      return
    }
    const scored = scoreQuiz(next)
    saveQuiz(scored)
    setResult(scored)
  }

  function accept(theme) {
    const payload = { ...result, theme: theme || result.theme }
    saveQuiz(payload)
    navigate('/register')
  }

  if (result) {
    const theme = altTheme || result.theme
    return (
      <section className={`${styles.page} ${styles[theme] || ''}`} data-quiz="result">
        <p className={styles.kicker}>Este é o seu universo</p>
        <h1>{result.name}</h1>
        <p className={styles.lead}>{result.message}</p>
        <p className={styles.theme}>Tema sugerido: {theme}</p>
        <div className={styles.actions}>
          <button type="button" className={styles.primary} onClick={() => accept(theme)}>
            Aceitar este universo
          </button>
          <button type="button" className={styles.ghost} onClick={() => setAltTheme(altTheme ? null : 'pick')}>
            Escolher outro tema
          </button>
        </div>
        {altTheme === 'pick' ? (
          <div className={styles.themes}>
            {['skyrim', 'naruto', 'solo', 'clean'].map((name) => (
              <button key={name} type="button" onClick={() => accept(name)}>
                {name}
              </button>
            ))}
          </div>
        ) : null}
      </section>
    )
  }

  return (
    <section className={`${styles.page} ${geekScore >= 2 ? styles.geek : styles.clean}`} data-quiz="ask">
      <div className={styles.progress} aria-hidden="true">
        <i style={{ width: `${((step + 1) / QUIZ_QUESTIONS.length) * 100}%` }} />
      </div>
      <p className={styles.step}>
        {step + 1} / {QUIZ_QUESTIONS.length}
      </p>
      <h1 key={question.id}>{question.text}</h1>
      <div className={styles.options}>
        {question.options.map((option) => (
          <button key={option.id} type="button" className={styles.card} onClick={() => choose(option)}>
            {ICONS[option.id]}
            <span>{option.label}</span>
          </button>
        ))}
      </div>
    </section>
  )
}
