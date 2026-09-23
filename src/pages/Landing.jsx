/**
 * Landing pública do Life OS.
 */
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import PlanCards from '../components/PlanCards'
import styles from './Landing.module.css'

const FEATURES = [
  { icon: '⚔', title: 'Missões e tarefas gamificadas', text: 'Transforme o que precisa ser feito em contratos com XP e recompensa.' },
  { icon: '📅', title: 'Rastreador de hábitos mensal', text: 'Uma grade do mês inteiro para ver consistência de relance.' },
  { icon: '💰', title: 'Controle financeiro integrado', text: 'Receitas, despesas, metas e gráficos no mesmo grimório.' },
  { icon: '🤖', title: 'IA Coach personalizada', text: 'Análise honesta da sua semana, do seu dia e do seu mês.' },
  { icon: '🎨', title: 'Temas: Skyrim, Naruto, Solo Leveling e mais', text: 'O app muda de pele com o universo que te motiva.' },
  { icon: '🏆', title: 'Sistema de XP, níveis e ranks', text: 'Cada hábito e missão sobe o nível do herói — você.' },
]

export default function Landing() {
  const navigate = useNavigate()
  const [skin, setSkin] = useState('skyrim')
  const [email, setEmail] = useState('')

  function goRegister(event) {
    event?.preventDefault()
    const query = email.trim() ? `?email=${encodeURIComponent(email.trim())}` : ''
    navigate(`/register${query}`)
  }

  return (
    <div className={styles.page}>
      <header className={styles.nav}>
        <Link to="/" className={styles.brand}>
          Life OS
        </Link>
        <nav>
          <a href="#planos">Planos</a>
          <Link to="/login">Entrar</Link>
          <Link className={styles.cta} to="/register">
            Começar grátis
          </Link>
        </nav>
      </header>

      <section className={styles.hero}>
        <h1>Transforme sua rotina em progresso real</h1>
        <p className={styles.lead}>
          O único app que conecta sua disciplina diária com seus objetivos financeiros — no universo que você quiser
        </p>
        <div className={styles.actions}>
          <Link className={styles.primary} to="/register">
            Começar grátis
          </Link>
          <Link className={styles.ghost} to="/plans">
            Ver planos
          </Link>
        </div>
        <div className={styles.preview}>
          <div className={styles.toggle} role="group" aria-label="Prévia das skins">
            <button type="button" className={skin === 'skyrim' ? styles.on : ''} onClick={() => setSkin('skyrim')}>
              Skyrim
            </button>
            <button type="button" className={skin === 'clean' ? styles.on : ''} onClick={() => setSkin('clean')}>
              Clean
            </button>
          </div>
          <div className={styles.mockups}>
            <article className={`${styles.mock} ${styles.skyrim} ${skin === 'skyrim' ? styles.active : ''}`}>
              <header>Diário do Herói</header>
              <p>Missão: Reserva de emergência</p>
              <div className={styles.bar} />
              <small>Nv. 3 · 40 XP · Skyrim</small>
            </article>
            <article className={`${styles.mock} ${styles.clean} ${skin === 'clean' ? styles.active : ''}`}>
              <header>Life OS</header>
              <p>Tarefa: Reserva de emergência</p>
              <div className={styles.bar} />
              <small>Nível 3 · 40 pontos · Clean</small>
            </article>
          </div>
        </div>
      </section>

      <section className={styles.section}>
        <h2>Você não é preguiçoso. Falta um sistema.</h2>
        <div className={styles.triple}>
          <article>
            <span>📋</span>
            <h3>Começa animado, abandona em 3 dias</h3>
          </article>
          <article>
            <span>💸</span>
            <h3>Sabe que gasta demais, não sabe onde</h3>
          </article>
          <article>
            <span>🧠</span>
            <h3>Tem TDAH ou dificuldade de manter foco</h3>
          </article>
        </div>
      </section>

      <section className={styles.section}>
        <h2>Disciplina que vira dinheiro</h2>
        <div className={styles.chain} aria-hidden="true">
          <strong>HÁBITO</strong>
          <span>→</span>
          <strong>XP</strong>
          <span>→</span>
          <strong>META FINANCEIRA</strong>
        </div>
        <p className={styles.center}>
          Cada hábito concluído avança sua meta. Você vê em tempo real o impacto da sua disciplina no seu bolso.
        </p>
      </section>

      <section className={styles.section}>
        <h2>Tudo que o herói precisa</h2>
        <div className={styles.features}>
          {FEATURES.map((item) => (
            <article key={item.title}>
              <span>{item.icon}</span>
              <h3>{item.title}</h3>
              <p>{item.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section id="planos" className={styles.section}>
        <h2>Comece grátis. Evolua quando quiser.</h2>
        <PlanCards variant="landing" />
      </section>

      <section className={styles.final}>
        <h2>Pronto para começar sua jornada?</h2>
        <form className={styles.wait} onSubmit={goRegister}>
          <label>
            <span className={styles.sr}>E-mail</span>
            <input
              type="email"
              required
              placeholder="seu@email.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </label>
          <button type="submit">Quero começar grátis</button>
        </form>
        <p>Grátis para sempre. Sem cartão de crédito.</p>
      </section>

      <footer className={styles.footer}>
        <strong>Life OS</strong>
        <p>Transforme sua rotina em progresso real</p>
        <nav>
          <Link to="/plans">Planos</Link>
          <Link to="/login">Entrar</Link>
          <a href="#privacidade">Privacidade</a>
        </nav>
        <small id="privacidade">© 2025 Life OS</small>
      </footer>
    </div>
  )
}
