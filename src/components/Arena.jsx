import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import { useHabits } from '../hooks/useHabits'
import { useQuests } from '../hooks/useQuests'
import { useFinances } from '../hooks/useFinances'
import { supabase } from '../lib/supabase'
import { gainXP } from '../lib/xp'
import { toISODate } from '../lib/dates'
import { readQuiz } from '../lib/quiz'
import { useUserProfile } from '../hooks/useUserProfile'
import { RuneButton } from './UI'
import styles from './Arena.module.css'

const ARENA_FOR = {
  procrastinator: { tab: 'quiz', title: 'Quiz de disciplina', why: 'Três perguntas. Recompensa imediata. Sem espaço para adiar.' },
  dovahkiin: { tab: 'quiz', title: 'Quiz de disciplina', why: 'Três perguntas. Recompensa imediata. Sem espaço para adiar.' },
  indebted: { tab: 'interest', title: 'Calculadora de juros', why: 'Ver o custo real da dívida tira a névoa do "depois eu vejo".' },
  ambitious: { tab: 'battle', title: 'Mini RPG', why: 'Canaliza energia de 10 projetos em um combate só.' },
  hunter: { tab: 'battle', title: 'Mini RPG', why: 'Canaliza energia de 10 projetos em um combate só.' },
  anxious: { tab: 'clicker', title: 'Clicker meditativo', why: 'Ritmo lento. Sem combo, sem pressão. Só presença.' },
  disorganized: { tab: 'challenge', title: 'Desafio do dia', why: 'Uma tarefa clara. Sem menu. Sem opção de ignorar.' },
  ninja: { tab: 'challenge', title: 'Desafio do dia', why: 'Uma tarefa clara. Sem menu. Sem opção de ignorar.' },
}

const ENEMIES = {
  skyrim: [
    { name: 'Bandido', hp: 18, atk: 4, xp: 6 },
    { name: 'Draugr', hp: 28, atk: 6, xp: 10 },
    { name: 'Dragão', hp: 42, atk: 9, xp: 18 },
  ],
  naruto: [
    { name: 'Ninja do Som', hp: 18, atk: 4, xp: 6 },
    { name: 'Akatsuki', hp: 28, atk: 6, xp: 10 },
    { name: 'Bijuu chibi', hp: 42, atk: 9, xp: 18 },
  ],
  solo: [
    { name: 'Mob E-rank', hp: 18, atk: 4, xp: 6 },
    { name: 'Caçador D-rank', hp: 28, atk: 6, xp: 10 },
    { name: 'Boss de Dungeon', hp: 42, atk: 9, xp: 18 },
  ],
  clean: [
    { name: 'Distração', hp: 16, atk: 3, xp: 5 },
    { name: 'Procrastinação', hp: 26, atk: 5, xp: 9 },
    { name: 'Deadline', hp: 38, atk: 8, xp: 16 },
  ],
}

const SPECIALS = { skyrim: 'Grito do Dovahkiin', naruto: 'Rasengan', solo: 'Arise', clean: 'Foco total' }

const FALLBACK_QUIZ = [
  { q: 'O que vem primeiro no orçamento?', a: ['Pagar dívidas caras', 'Comprar desejo', 'Ignorar extrato'], c: 0 },
  { q: 'Melhor hábito financeiro semanal?', a: ['Revisar gastos', 'Fechar os olhos', 'Só o cartão'], c: 0 },
  { q: 'Regra 50/30/20 reserva quanto para metas?', a: ['20%', '50%', '5%'], c: 0 },
  { q: 'Missão pequena vence porque?', a: ['É concluível hoje', 'Parece epicamente longa', 'Não tem prazo'], c: 0 },
  { q: 'XP de hábito funciona melhor se?', a: ['For diário e visível', 'For anual e vago', 'Ninguém anotar'], c: 0 },
  { q: 'Emergência financeira pede?', a: ['Reserva', 'Novo empréstimo sem plano', 'Ignorar boleto'], c: 0 },
  { q: 'Produtividade real é?', a: ['Uma coisa importante feita', '20 abas abertas', 'Reunião eterna'], c: 0 },
  { q: 'Juros compostos ajudam quando?', a: ['Você investe cedo', 'Você atrasa fatura', 'Você só gasta'], c: 0 },
  { q: 'Para não estourar o cartão?', a: ['Limite e categorias', 'Parcelar tudo', 'Não olhar fatura'], c: 0 },
  { q: 'Desafio do dia serve para?', a: ['Foco curto e XP', 'Culpa', 'Adiar tudo'], c: 0 },
]

function roll(base) {
  return Math.max(1, Math.round(base * (0.8 + Math.random() * 0.4)))
}

function Battle({ onLevelUp }) {
  const { user, profile, refreshProfile } = useAuth()
  const { theme } = useTheme()
  const pool = ENEMIES[theme] || ENEMIES.clean
  const [enemy, setEnemy] = useState(() => pool[Math.floor(Math.random() * pool.length)])
  const maxHero = Math.max(10, (profile?.level || 1) * 10)
  const [hero, setHero] = useState(maxHero)
  const [foe, setFoe] = useState(enemy.hp)
  const [log, setLog] = useState('A batalha começou.')
  const [special, setSpecial] = useState(true)
  const [hit, setHit] = useState('')
  const [over, setOver] = useState(null)

  async function award(xp) {
    const result = await gainXP(xp, { userId: user.id, refreshProfile })
    if (result?.leveledUp) onLevelUp?.(result.newLevel)
  }

  function endTurn(nextHero, nextFoe, text, crit) {
    setHero(nextHero)
    setFoe(nextFoe)
    setLog(text)
    setHit(crit ? 'crit' : 'shake')
    window.setTimeout(() => setHit(''), 400)
    if (nextFoe <= 0) {
      setOver('win')
      award(enemy.xp)
    } else if (nextHero <= 0) {
      setOver('lose')
    }
  }

  function attack(kind) {
    if (over) return
    const power = kind === 'special' ? enemy.atk * 3 : kind === 'defend' ? Math.round(enemy.atk * 0.4) : (profile?.level || 1) + 5
    const dmg = roll(power)
    const incoming = kind === 'defend' ? Math.round(roll(enemy.atk) * 0.4) : roll(enemy.atk)
    if (kind === 'special') setSpecial(false)
    endTurn(hero - incoming, foe - dmg, `${kind === 'special' ? SPECIALS[theme] : 'Ataque'} causou ${dmg}. Você sofreu ${incoming}.`, dmg > power)
  }

  return (
    <div className={`${styles.card} ${hit ? styles[hit] : ''}`}>
      <h3>{theme === 'naruto' ? 'Batalha Ninja' : theme === 'solo' ? 'Dungeon Run' : 'Caçada ao Dragão'}</h3>
      <p>
        Você {hero}/{maxHero} HP · {enemy.name} {Math.max(0, foe)}/{enemy.hp}
      </p>
      <div className={styles.vs}>
        <span>🛡</span>
        <strong>VS</strong>
        <span>☠</span>
      </div>
      <p>{log}</p>
      {over === 'win' ? <p>✓ Vitória! +{enemy.xp} XP</p> : null}
      {over === 'lose' ? <p>Derrota. Sem perda de XP.</p> : null}
      <div className={styles.row}>
        <RuneButton disabled={Boolean(over)} onClick={() => attack('attack')}>
          Atacar
        </RuneButton>
        <RuneButton disabled={Boolean(over)} onClick={() => attack('defend')}>
          Defender
        </RuneButton>
        <RuneButton disabled={!special || Boolean(over)} onClick={() => attack('special')}>
          {SPECIALS[theme] || 'Especial'}
        </RuneButton>
        <RuneButton
          onClick={() => {
            const next = pool[Math.floor(Math.random() * pool.length)]
            setEnemy(next)
            setFoe(next.hp)
            setHero(maxHero)
            setSpecial(true)
            setOver(null)
            setLog('Novo combate.')
          }}
        >
          Nova luta
        </RuneButton>
      </div>
    </div>
  )
}

function Clicker({ onLevelUp, calm = false }) {
  const { user, refreshProfile } = useAuth()
  const { theme } = useTheme()
  const key = `lifeos-clicker-${user?.id || 'guest'}${calm ? '-calm' : ''}`
  const [state, setState] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(key)) || { coins: 0, power: 1, auto: 0, awarded: 0 }
    } catch {
      return { coins: 0, power: 1, auto: 0, awarded: 0 }
    }
  })

  useEffect(() => {
    localStorage.setItem(key, JSON.stringify(state))
  }, [key, state])

  useEffect(() => {
    if (calm) return undefined
    const id = window.setInterval(() => {
      setState((current) => (current.auto ? { ...current, coins: current.coins + current.auto } : current))
    }, 1000)
    return () => window.clearInterval(id)
  }, [calm])

  useEffect(() => {
    const should = Math.floor(state.coins / (calm ? 20 : 100))
    if (should > state.awarded && user) {
      const gain = should - state.awarded
      gainXP(gain, { userId: user.id, refreshProfile }).then((result) => {
        if (result?.leveledUp) onLevelUp?.(result.newLevel)
      })
      setState((current) => ({ ...current, awarded: should }))
    }
  }, [calm, onLevelUp, refreshProfile, state.awarded, state.coins, user])

  const title = calm
    ? 'Clicker meditativo'
    : theme === 'naruto'
      ? 'Fábrica de Chakra'
      : theme === 'solo'
        ? 'Gerador de EXP'
        : theme === 'skyrim'
          ? 'Forja'
          : 'Foco'

  return (
    <div className={`${styles.card} ${calm ? styles.calm : ''}`}>
      <h3>{title}</h3>
      {calm ? (
        <>
          <p>Respire. Clique no seu ritmo. Sem combo, sem pressão.</p>
          <p>{Math.floor(state.coins)} respirações</p>
        </>
      ) : (
        <p>
          {Math.floor(state.coins)} moedas de foco · +{state.auto}/s
        </p>
      )}
      <RuneButton
        onClick={() =>
          setState((current) => ({
            ...current,
            coins: current.coins + (calm ? 1 : current.power),
          }))
        }
      >
        {calm ? 'Um clique. Um segundo.' : `Produzir +${state.power}`}
      </RuneButton>
      {calm ? null : (
        <div className={styles.row}>
          <RuneButton
            disabled={state.coins < 25}
            onClick={() => setState((current) => ({ ...current, coins: current.coins - 25, power: current.power + 1 }))}
          >
            Upgrade clique (25)
          </RuneButton>
          <RuneButton
            disabled={state.coins < 40}
            onClick={() => setState((current) => ({ ...current, coins: current.coins - 40, auto: current.auto + 1 }))}
          >
            Auto (40)
          </RuneButton>
        </div>
      )}
    </div>
  )
}

function Ranking() {
  const { profile } = useAuth()
  const [rows, setRows] = useState([])

  useEffect(() => {
    supabase
      .from('profiles')
      .select('name, streak_days, total_xp, level')
      .order('streak_days', { ascending: false })
      .limit(8)
      .then(({ data }) => setRows(data || []))
  }, [])

  return (
    <div className={styles.card}>
      <h3>Ranking</h3>
      {!rows.length ? (
        <p>
          Você: {profile?.name || 'Herói'} · {profile?.streak_days || 0} dias · nível {profile?.level || 1}
        </p>
      ) : (
        <ol className={styles.rank}>
          {rows.map((item, index) => (
            <li key={`${item.name}-${index}`}>
              {index + 1}. {item.name || 'Anônimo'} · {item.streak_days || 0} dias · Nv {item.level || 1}
            </li>
          ))}
        </ol>
      )}
    </div>
  )
}

function InterestCalc({ onLevelUp }) {
  const { user, refreshProfile } = useAuth()
  const [debt, setDebt] = useState('1500')
  const [rate, setRate] = useState('5')
  const [months, setMonths] = useState('12')
  const extra = useMemo(() => {
    const value = Number(debt) || 0
    const monthly = (Number(rate) || 0) / 100 / 12
    if (!monthly) return 0
    const parcel = (value * monthly) / (1 - (1 + monthly) ** -Math.max(1, Number(months) || 1))
    return parcel * Math.max(1, Number(months) || 1) - value
  }, [debt, months, rate])

  return (
    <div className={styles.card}>
      <h3>Quanto você paga a mais</h3>
      <label>
        Dívida
        <input value={debt} onChange={(event) => setDebt(event.target.value)} type="number" />
      </label>
      <label>
        Juros % a.a.
        <input value={rate} onChange={(event) => setRate(event.target.value)} type="number" />
      </label>
      <label>
        Meses
        <input value={months} onChange={(event) => setMonths(event.target.value)} type="number" />
      </label>
      <p>Juros totais: R$ {extra.toFixed(2)}</p>
      <RuneButton
        onClick={async () => {
          if (!user) return
          const result = await gainXP(5, { userId: user.id, refreshProfile })
          if (result?.leveledUp) onLevelUp?.(result.newLevel)
        }}
      >
        Registrar aprendizado +5 XP
      </RuneButton>
    </div>
  )
}

function Quiz({ onLevelUp, maxQuestions = 10 }) {
  const { user, profile, refreshProfile, hasAccess } = useAuth()
  const [index, setIndex] = useState(0)
  const [score, setScore] = useState(0)
  const [done, setDone] = useState(false)
  const [blocked, setBlocked] = useState(false)
  const questions = FALLBACK_QUIZ.slice(0, maxQuestions)
  const paid = hasAccess('monthly')

  useEffect(() => {
    if (!user || paid) return undefined
    supabase
      .from('quiz_plays')
      .select('id')
      .eq('user_id', user.id)
      .eq('play_date', toISODate())
      .then(({ data }) => {
        if (data?.length) setBlocked(true)
      })
  }, [paid, user])

  async function choose(option) {
    if (done || blocked) return
    const ok = option === questions[index].c
    const nextScore = score + (ok ? 1 : 0)
    if (ok) {
      const result = await gainXP(2, { userId: user.id, refreshProfile })
      if (result?.leveledUp) onLevelUp?.(result.newLevel)
    }
    if (index + 1 >= questions.length) {
      setScore(nextScore)
      setDone(true)
      if (nextScore === questions.length) {
        const result = await gainXP(10, { userId: user.id, refreshProfile })
        if (result?.leveledUp) onLevelUp?.(result.newLevel)
      }
      if (!paid) {
        await supabase.from('quiz_plays').insert({ user_id: user.id, play_date: toISODate(), score: nextScore })
      }
      return
    }
    setScore(nextScore)
    setIndex((value) => value + 1)
  }

  return (
    <div className={styles.card}>
      <h3>Quiz de Disciplina</h3>
      {blocked ? <p>Plano gratuito: 1 quiz por dia. Volte amanhã ou faça upgrade.</p> : null}
      {!blocked && !done ? (
        <>
          <p>
            {index + 1}/{questions.length} — {questions[index].q}
          </p>
          <div className={styles.col}>
            {questions[index].a.map((item, i) => (
              <RuneButton key={item} onClick={() => choose(i)}>
                {item}
              </RuneButton>
            ))}
          </div>
        </>
      ) : null}
      {done ? <p>Fim! Acertos: {score}/{questions.length}{score === questions.length ? ' · bônus +10 XP' : ''}</p> : null}
      <small>{paid ? 'Ilimitado no seu plano.' : `Plano ${profile?.plan || 'free'}: 1/dia`}</small>
    </div>
  )
}

function Challenge({ onLevelUp }) {
  const { user, refreshProfile } = useAuth()
  const { checks, habits } = useHabits()
  const { done } = useQuests()
  const { transactions } = useFinances()
  const today = toISODate()
  const [row, setRow] = useState(null)

  useEffect(() => {
    if (!user) return undefined
    supabase
      .from('daily_challenges')
      .select('*')
      .eq('user_id', user.id)
      .eq('challenge_date', today)
      .maybeSingle()
      .then(async ({ data }) => {
        if (data) {
          setRow(data)
          return
        }
        const created = {
          user_id: user.id,
          challenge_date: today,
          title: 'Complete 3 hábitos hoje e ganhe 15 XP bônus',
          description: 'Marque 3 checks de disciplina diária.',
          xp_bonus: 15,
          kind: 'habits',
          target: 3,
        }
        const { data: saved } = await supabase.from('daily_challenges').insert(created).select().single()
        setRow(saved || created)
      })
  }, [today, user])

  const progress = useMemo(() => {
    if (!row) return 0
    if (row.kind === 'quests') return done.filter((item) => String(item.completed_at).slice(0, 10) === today).length
    if (row.kind === 'finance') return transactions.filter((item) => String(item.transaction_date).slice(0, 10) === today).length
    return checks.filter((item) => String(item.check_date).slice(0, 10) === today).length
  }, [checks, done, row, today, transactions])

  async function claim() {
    if (!row || row.completed || progress < (row.target || 2)) return
    await supabase.from('daily_challenges').update({ completed: true }).eq('id', row.id)
    const result = await gainXP(row.xp_bonus, { userId: user.id, refreshProfile })
    if (result?.leveledUp) onLevelUp?.(result.newLevel)
    setRow({ ...row, completed: true })
  }

  if (!row) return null
  return (
    <div className={styles.challenge}>
      <p>Desafio do Dia</p>
      <strong>{row.title}</strong>
      <small>
        {progress}/{row.target} · {habits.length} hábitos ativos
      </small>
      <RuneButton disabled={row.completed || progress < row.target} onClick={claim}>
        {row.completed ? 'Já resgatado' : `Resgatar +${row.xp_bonus} XP`}
      </RuneButton>
    </div>
  )
}

export default function Arena({ onLevelUp }) {
  const { row } = useUserProfile()
  const quiz = readQuiz()
  const type = row?.profile_type || quiz?.type || 'procrastinator'
  const rec = ARENA_FOR[type] || ARENA_FOR.procrastinator
  const geek = ['dovahkiin', 'hunter', 'ninja'].includes(type) || Boolean(quiz?.tags?.geek)
  const lockChallenge = rec.tab === 'challenge' && !geek
  const [tab, setTab] = useState(rec.tab === 'challenge' ? 'battle' : rec.tab)

  return (
    <section className={styles.page}>
      <h2>Arena</h2>
      <div className={styles.challenge} data-recommended>
        <p>Recomendado para seu perfil</p>
        <strong>{rec.title}</strong>
        <small>{rec.why}</small>
        {lockChallenge ? null : (
          <RuneButton onClick={() => setTab(rec.tab === 'challenge' ? 'battle' : rec.tab)}>Abrir agora</RuneButton>
        )}
      </div>
      <Challenge onLevelUp={onLevelUp} />
      {lockChallenge ? <p>Hoje só existe este desafio. Sem menu. Sem adiar.</p> : null}
      {lockChallenge ? null : (
        <>
          <div className={styles.tabs}>
            <button type="button" className={tab === 'battle' ? styles.on : ''} onClick={() => setTab('battle')}>
              Batalha
            </button>
            <button type="button" className={tab === 'clicker' ? styles.on : ''} onClick={() => setTab('clicker')}>
              Clicker
            </button>
            <button type="button" className={tab === 'quiz' ? styles.on : ''} onClick={() => setTab('quiz')}>
              Quiz
            </button>
            <button type="button" className={tab === 'interest' ? styles.on : ''} onClick={() => setTab('interest')}>
              Juros
            </button>
          </div>
          {geek ? <p>Modo geek: todos os minigames desbloqueados + ranking.</p> : null}
          {tab === 'battle' ? <Battle onLevelUp={onLevelUp} /> : null}
          {tab === 'clicker' ? <Clicker onLevelUp={onLevelUp} calm={type === 'anxious'} /> : null}
          {tab === 'quiz' ? (
            <Quiz onLevelUp={onLevelUp} maxQuestions={type === 'procrastinator' || type === 'dovahkiin' ? 3 : 10} />
          ) : null}
          {tab === 'interest' ? <InterestCalc onLevelUp={onLevelUp} /> : null}
          {geek ? <Ranking /> : null}
        </>
      )}
    </section>
  )
}
