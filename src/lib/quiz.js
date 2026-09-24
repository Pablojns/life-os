export const QUIZ_STORAGE_KEY = 'lifeos-quiz-profile'

export const QUIZ_QUESTIONS = [
  {
    id: 'q1',
    text: 'Qual dessas frases mais te representa?',
    options: [
      { id: 'a', label: 'Começo tudo animado mas nunca termino', tags: ['procrastinate', 'start'] },
      { id: 'b', label: 'Dinheiro some antes do fim do mês', tags: ['money', 'debt'] },
      { id: 'c', label: 'Tenho mil ideias mas zero organização', tags: ['ideas', 'chaos'] },
      { id: 'd', label: 'Faço muito mas nunca parece suficiente', tags: ['anxious', 'enough'] },
    ],
  },
  {
    id: 'q2',
    text: 'Quando você pensa em produtividade, o que sente?',
    options: [
      { id: 'a', label: 'Culpa — sei que posso mais', tags: ['guilt', 'procrastinate'] },
      { id: 'b', label: 'Ansiedade — tenho muito a fazer', tags: ['anxious'] },
      { id: 'c', label: 'Confusão — não sei por onde começar', tags: ['chaos', 'ideas'] },
      { id: 'd', label: 'Empolgação — adoro desafios', tags: ['hype', 'level'] },
    ],
  },
  {
    id: 'q3',
    text: 'Como é sua relação com dinheiro?',
    options: [
      { id: 'a', label: 'Gasto mais do que deveria', tags: ['money'] },
      { id: 'b', label: 'Tenho dívidas que me preocupam', tags: ['debt'] },
      { id: 'c', label: 'Não sei onde meu dinheiro vai', tags: ['chaos', 'money'] },
      { id: 'd', label: 'Quero investir mas não sei como', tags: ['data', 'money'] },
    ],
  },
  {
    id: 'q4',
    text: 'Você prefere:',
    options: [
      { id: 'a', label: 'Sistemas de jogo com missões e recompensas', tags: ['geek', 'level'] },
      { id: 'b', label: 'Algo simples e direto ao ponto', tags: ['simple'] },
      { id: 'c', label: 'Visual bonito que me inspire', tags: ['visual'] },
      { id: 'd', label: 'Dados e métricas claras', tags: ['data'] },
    ],
  },
  {
    id: 'q5',
    text: 'Qual é o seu maior problema com rotina?',
    options: [
      { id: 'a', label: 'Não consigo manter por mais de 3 dias', tags: ['procrastinate'] },
      { id: 'b', label: 'Minha rotina é o caos total', tags: ['chaos'] },
      { id: 'c', label: 'Tenho rotina mas não sigo', tags: ['procrastinate'] },
      { id: 'd', label: 'Não tenho tempo para ter rotina', tags: ['anxious'] },
    ],
  },
  {
    id: 'q6',
    text: 'O que mais te motiva?',
    options: [
      { id: 'a', label: 'Subir de nível e ganhar recompensas', tags: ['level', 'geek'] },
      { id: 'b', label: 'Ver progresso visual acontecendo', tags: ['visual'] },
      { id: 'c', label: 'Bater metas financeiras', tags: ['money', 'data'] },
      { id: 'd', label: 'Sentir que estou no controle', tags: ['control'] },
    ],
  },
  {
    id: 'q7',
    text: 'Você se considera:',
    options: [
      { id: 'a', label: 'Fã de anime, games ou fantasia', tags: ['geek'] },
      { id: 'b', label: 'Pessoa prática e objetiva', tags: ['simple'] },
      { id: 'c', label: 'Criativo e visual', tags: ['visual'] },
      { id: 'd', label: 'Analítico e metódico', tags: ['data'] },
    ],
  },
  {
    id: 'q8',
    text: 'Agora mesmo, o que você mais precisa?',
    options: [
      { id: 'a', label: 'Parar de procrastinar de uma vez', tags: ['procrastinate'] },
      { id: 'b', label: 'Sair das dívidas', tags: ['debt'] },
      { id: 'c', label: 'Organizar minha vida', tags: ['chaos'] },
      { id: 'd', label: 'Manter o foco no que importa', tags: ['level', 'control'] },
    ],
  },
]

const PROFILES = [
  {
    type: 'dovahkiin',
    name: 'O Dovahkiin Perdido',
    theme: 'skyrim',
    need: ['procrastinate', 'guilt', 'geek'],
    message: 'Você tem o poder de um Dovahkiin mas ainda não encontrou sua missão. O sistema vai te dar a estrutura que falta.',
  },
  {
    type: 'hunter',
    name: 'O Hunter E-Rank',
    theme: 'solo',
    need: ['hype', 'geek', 'level'],
    message: 'Todo S-Rank começou como E-Rank. Você tem potencial mas precisa de um sistema que te force a evoluir.',
  },
  {
    type: 'ninja',
    name: 'O Ninja Sem Missão',
    theme: 'naruto',
    need: ['ideas', 'chaos', 'visual'],
    message: 'Você tem o chakra mas não tem o alvo. Sua aldeia vai te dar as missões certas.',
  },
  {
    type: 'procrastinator',
    name: 'O Procrastinador',
    theme: 'clean',
    need: ['procrastinate', 'guilt', 'simple'],
    message: 'Você sabe o que precisa fazer. O sistema vai tornar impossível ignorar.',
  },
  {
    type: 'indebted',
    name: 'O Endividado',
    theme: 'clean',
    need: ['money', 'debt', 'data'],
    message: 'Dívida não é vergonha — é um problema com solução. Vamos montar seu plano agora.',
  },
  {
    type: 'disorganized',
    name: 'O Desorganizado',
    theme: 'clean',
    need: ['chaos', 'ideas', 'money'],
    message: 'Sua mente está cheia. O sistema vai esvaziar e organizar tudo por você.',
  },
  {
    type: 'ambitious',
    name: 'O Ambicioso Sem Foco',
    theme: 'solo',
    need: ['ideas', 'level', 'control'],
    message: 'Você tem energia para 10 projetos mas precisa de 1 sistema que te force a escolher 1.',
  },
  {
    type: 'anxious',
    name: 'O Ansioso Produtivo',
    theme: 'clean',
    need: ['anxious', 'enough', 'control'],
    message: 'Você já faz demais. O sistema vai te mostrar que você é suficiente — e te ajudar a descansar sem culpa.',
  },
]

export function scoreQuiz(answers) {
  const tags = Object.values(answers || {}).flatMap((item) => item.tags || [])
  const counts = tags.reduce((acc, tag) => {
    acc[tag] = (acc[tag] || 0) + 1
    return acc
  }, {})

  const ranked = PROFILES.map((profile) => {
    const score = profile.need.reduce((sum, tag) => sum + (counts[tag] || 0), 0)
    return { ...profile, score }
  }).sort((a, b) => b.score - a.score)

  const winner = { ...ranked[0] }
  if (winner.type === 'ambitious') {
    const taste = counts.geek ? 'skyrim' : counts.visual ? 'naruto' : counts.data ? 'clean' : winner.theme
    winner.theme = taste
  }
  if (winner.type === 'anxious' && counts.visual) winner.theme = 'naruto'

  return {
    ...winner,
    quiz_answers: answers,
    tags: counts,
  }
}

export function readQuiz() {
  try {
    return JSON.parse(localStorage.getItem(QUIZ_STORAGE_KEY) || 'null')
  } catch {
    return null
  }
}

export function saveQuiz(result) {
  localStorage.setItem(QUIZ_STORAGE_KEY, JSON.stringify(result))
}
