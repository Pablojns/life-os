/**
 * Aba do Coach: análises semanais, diárias e relatório mensal.
 */
import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import { useAICoach } from '../hooks/useAICoach'
import { RuneButton } from './UI'
import styles from './AICoach.module.css'

const TYPE_LABELS = {
  weekly: 'Análise Semanal',
  daily: 'Análise do dia',
  monthly_report: 'Relatório mensal',
}

function useTypedText(text) {
  const [shown, setShown] = useState('')

  useEffect(() => {
    if (!text) {
      setShown('')
      return undefined
    }
    setShown('')
    let index = 0
    const timer = window.setInterval(() => {
      index += 3
      setShown(text.slice(0, index))
      if (index >= text.length) window.clearInterval(timer)
    }, 16)
    return () => window.clearInterval(timer)
  }, [text])

  return shown
}

function formatWhen(value) {
  if (!value) return ''
  return new Date(value).toLocaleString('pt-BR', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function AnalysisBody({ text, report }) {
  if (!report) return <p className={styles.body}>{text}</p>
  const chunks = text.split(/(?=Conquistas|Pontos de atenção|Sugestão de foco)/i).filter(Boolean)
  if (chunks.length < 2) return <p className={styles.body}>{text}</p>
  return (
    <div className={styles.report}>
      {chunks.map((chunk) => (
        <section key={chunk.slice(0, 24)}>
          <p>{chunk.trim()}</p>
        </section>
      ))}
    </div>
  )
}

export default function AICoach() {
  const navigate = useNavigate()
  const { profile, hasAccess } = useAuth()
  const { theme } = useTheme()
  const { getAnalysis, getHistory, history, loading, error } = useAICoach()
  const [current, setCurrent] = useState(null)
  const [currentType, setCurrentType] = useState('weekly')
  const typed = useTypedText(current)
  const plan = profile?.plan || 'free'
  const basic = plan === 'monthly' || plan === 'quarterly'
  const full = hasAccess('semiannual')
  const allowed = hasAccess('monthly')
  const owl = theme === 'skyrim' ? '🦉' : '💜'

  useEffect(() => {
    if (allowed) getHistory().catch(() => {})
  }, [allowed, getHistory])

  const visibleHistory = useMemo(() => history.slice(0, full ? 10 : 3), [full, history])

  async function run(type) {
    setCurrentType(type)
    try {
      const text = await getAnalysis(type)
      setCurrent(text)
    } catch {
      /* toast/erro no hook */
    }
  }

  if (!allowed) {
    return (
      <section className={styles.section}>
        <header className={styles.head}>
          <h2>IA Coach</h2>
        </header>
        <article className={`${styles.card} ${styles.locked}`}>
          <span className={styles.lockIcon} aria-hidden="true">
            🔒
          </span>
          <p>IA Coach disponível no plano Herói Mensal</p>
          <RuneButton variant="primary" onClick={() => navigate('/plans')}>
            Ver planos
          </RuneButton>
        </article>
      </section>
    )
  }

  return (
    <section className={styles.section}>
      <header className={styles.head}>
        <h2>
          <span aria-hidden="true">{owl}</span> IA Coach
        </h2>
        <p>Um olhar honesto sobre a sua jornada.</p>
      </header>

      <article className={`${styles.card} ${styles.main}`}>
        <div className={styles.actions}>
          {basic ? (
            <RuneButton variant="primary" disabled={loading} onClick={() => run('weekly')}>
              {loading ? 'Consultando o oráculo...' : 'Analisar minha semana'}
            </RuneButton>
          ) : (
            <>
              <RuneButton variant="primary" disabled={loading} onClick={() => run('weekly')}>
                Analisar semana
              </RuneButton>
              <RuneButton disabled={loading} onClick={() => run('daily')}>
                Análise do dia
              </RuneButton>
              <RuneButton disabled={loading} onClick={() => run('monthly_report')}>
                Relatório mensal
              </RuneButton>
            </>
          )}
        </div>

        {loading ? <div className={styles.spinner} aria-label="Carregando análise" /> : null}
        {error ? <p className={styles.error}>{error}</p> : null}

        {current ? (
          <div className={styles.result}>
            <span className={styles.badge}>{TYPE_LABELS[currentType]}</span>
            <AnalysisBody text={typed} report={currentType === 'monthly_report'} />
          </div>
        ) : null}
      </article>

      {basic ? (
        <p className={styles.banner}>Upgrade para Semestral e ganhe análise diária + relatório mensal</p>
      ) : null}

      {visibleHistory.length ? (
        <section className={styles.history}>
          <h3>Histórico</h3>
          <ul>
            {visibleHistory.map((item) => (
              <li key={item.id}>
                <span className={styles.badge}>{TYPE_LABELS[item.analysis_type] || item.analysis_type}</span>
                <time>{formatWhen(item.created_at)}</time>
                <p>{item.analysis}</p>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </section>
  )
}
