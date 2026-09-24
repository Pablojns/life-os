export const SUGGESTIONS = {
  dovahkiin: {
    quests: [
      { title: 'Fazer 1 coisa da lista hoje', xp: 10, reward: 'Pausa de 15 min' },
      { title: 'Definir 3 prioridades de amanhã', xp: 10, reward: null },
      { title: 'Completar 1 tarefa antes do almoço', xp: 15, reward: null },
    ],
    habits: [
      { name: 'Técnica Pomodoro 25min', xpPerDay: 10 },
      { name: '1 tarefa antes do celular', xpPerDay: 8 },
    ],
    aiChallenge: 'Complete sua missão mais fácil agora. Só uma.',
    welcomeMessage: 'Sua missão começa aqui. Sem desculpas hoje.',
  },
  hunter: {
    quests: [
      { title: 'Escolher 1 projeto principal desta semana', xp: 15, reward: null },
      { title: '1 hora de foco total sem interrupção', xp: 15, reward: null },
      { title: 'Definir 1 meta para os próximos 30 dias', xp: 20, reward: 'Celebração' },
    ],
    habits: [
      { name: '1 hora de foco total sem interrupção', xpPerDay: 15 },
      { name: 'Revisar metas toda segunda', xpPerDay: 8 },
    ],
    aiChallenge: 'Você tem quantos projetos abertos agora? Feche metade hoje.',
    welcomeMessage: 'Foco é o superpoder que você ainda não ativou.',
  },
  ninja: {
    quests: [
      { title: 'Fazer lista do dia em 5 minutos', xp: 5, reward: null },
      { title: 'Definir 1 prioridade da semana', xp: 10, reward: null },
      { title: 'Organizar mesa de trabalho', xp: 5, reward: null },
    ],
    habits: [
      { name: 'Planejar o dia antes de dormir', xpPerDay: 8 },
      { name: '15min de organização diária', xpPerDay: 7 },
    ],
    aiChallenge: 'Escolha 1 coisa para organizar agora. Só 1.',
    welcomeMessage: 'Caos tem cura. Começa por 1 coisa.',
  },
  procrastinator: {
    quests: [
      { title: 'Fazer 1 coisa da lista hoje', xp: 10, reward: 'Pausa de 15 min' },
      { title: 'Responder mensagens pendentes', xp: 8, reward: null },
      { title: 'Organizar mesa de trabalho', xp: 5, reward: null },
      { title: 'Definir 3 prioridades de amanhã', xp: 10, reward: null },
      { title: 'Completar 1 tarefa antes do almoço', xp: 15, reward: null },
    ],
    habits: [
      { name: 'Técnica Pomodoro 25min', xpPerDay: 10 },
      { name: '1 tarefa antes do celular', xpPerDay: 8 },
      { name: 'Revisar lista toda manhã', xpPerDay: 5 },
    ],
    aiChallenge: 'Complete sua missão mais fácil agora. Só uma. Cronômetro ligado.',
    welcomeMessage: 'Sua missão começa aqui. Sem desculpas hoje.',
  },
  indebted: {
    quests: [
      { title: 'Listar todas as dívidas com valores', xp: 15, reward: null },
      { title: 'Ligar para o banco e negociar', xp: 20, reward: 'Jantar especial' },
      { title: 'Cortar 1 assinatura desnecessária', xp: 10, reward: null },
      { title: 'Separar reserva de emergência inicial', xp: 15, reward: null },
      { title: 'Registrar todos os gastos de hoje', xp: 8, reward: null },
    ],
    habits: [
      { name: 'Registrar todo gasto do dia', xpPerDay: 10 },
      { name: 'Verificar saldo toda manhã', xpPerDay: 5 },
      { name: 'Guardar um valor fixo todo dia', xpPerDay: 8 },
    ],
    aiChallenge: 'Você sabia onde foi cada real de ontem? Registre agora.',
    welcomeMessage: 'Dívida tem solução. Hoje você começa a sair dela.',
    financialGoal: { name: 'Reserva de Emergência', targetAmount: 1000 },
  },
  disorganized: {
    quests: [
      { title: 'Organizar caixa de entrada do email', xp: 10, reward: null },
      { title: 'Fazer lista do dia em 5 minutos', xp: 5, reward: null },
      { title: 'Definir 1 prioridade da semana', xp: 10, reward: null },
      { title: 'Limpar área de trabalho do computador', xp: 8, reward: null },
    ],
    habits: [
      { name: 'Planejar o dia antes de dormir', xpPerDay: 8 },
      { name: 'Inbox zero toda sexta', xpPerDay: 10 },
      { name: '15min de organização diária', xpPerDay: 7 },
    ],
    aiChallenge: 'Escolha 1 coisa para organizar agora. Só 1.',
    welcomeMessage: 'Caos tem cura. Começa por 1 coisa.',
  },
  ambitious: {
    quests: [
      { title: 'Escolher 1 projeto principal desta semana', xp: 15, reward: null },
      { title: 'Dizer não para 1 compromisso desnecessário', xp: 10, reward: null },
      { title: 'Revisar e cortar metade da lista de tarefas', xp: 12, reward: null },
      { title: 'Definir 1 meta para os próximos 30 dias', xp: 20, reward: 'Celebração' },
    ],
    habits: [
      { name: 'Dizer não para 1 coisa todo dia', xpPerDay: 10 },
      { name: 'Revisar metas toda segunda', xpPerDay: 8 },
      { name: '1 hora de foco total sem interrupção', xpPerDay: 15 },
    ],
    aiChallenge: 'Você tem quantos projetos abertos agora? Feche metade hoje.',
    welcomeMessage: 'Foco é o superpoder que você ainda não ativou.',
  },
  anxious: {
    quests: [
      { title: 'Fazer 1 pausa de 10min sem celular', xp: 10, reward: null },
      { title: 'Celebrar 1 conquista de hoje por escrito', xp: 8, reward: null },
      { title: 'Delegar 1 tarefa que não precisa ser você', xp: 12, reward: null },
      { title: 'Definir horário de parar de trabalhar hoje', xp: 10, reward: null },
    ],
    habits: [
      { name: 'Meditação 5 minutos', xpPerDay: 8 },
      { name: 'Desligar notificações das 20h', xpPerDay: 10 },
      { name: 'Escrever 3 conquistas do dia', xpPerDay: 7 },
    ],
    aiChallenge: 'Você já fez o suficiente hoje. O que foi?',
    welcomeMessage: 'Você já faz demais. Aqui você aprende a fazer certo.',
  },
}

const EMPTY = {
  quests: {
    procrastinator: 'Sua primeira missão te espera. Qual é a coisa mais fácil que você pode fazer agora?',
    indebted: 'Antes de qualquer missão extra: liste o que está te cobrando.',
    disorganized: 'Uma missão. Uma só. Escreva a mais simples.',
    ambitious: 'Escolha 1 projeto. O resto espera.',
    anxious: 'A missão de hoje pode ser parar. Comece por isso.',
    dovahkiin: 'O grimório está em branco. Aceite o contrato mais curto.',
    hunter: 'Sistema aguardando primeira quest.',
    ninja: 'Sem pergaminho ativo. Escolha o alvo.',
  },
  habits: {
    default: 'Rotina se constrói em um hábito. Adicione o mais fácil.',
  },
  finance: {
    indebted: 'Vamos montar o mapa das dívidas antes de qualquer gráfico.',
    default: 'Renda, teto e um registro. Três campos. Depois o resto.',
  },
}

export function getSuggestionsForProfile(profileType) {
  return SUGGESTIONS[profileType] || SUGGESTIONS.procrastinator
}

export function getEmptyStateMessage(section, profileType) {
  const pack = EMPTY[section] || {}
  return pack[profileType] || pack.default || 'Comece por uma ação pequena agora.'
}

export function getDailyChallenge(profileType) {
  return getSuggestionsForProfile(profileType).aiChallenge
}

export function dailyChallengeForHabits(habitCount) {
  const count = Number(habitCount) || 0
  if (count === 0) {
    return {
      title: 'Crie 1 hábito hoje',
      description: 'Sem hábito não existe sequência. Um só basta.',
      kind: 'create_habit',
      target: 1,
      xp_bonus: 10,
    }
  }
  if (count === 1) {
    return {
      title: 'Marque seu hábito hoje',
      description: 'Um check. Sem opção de adiar.',
      kind: 'habits',
      target: 1,
      xp_bonus: 10,
    }
  }
  const target = Math.min(count, 3)
  return {
    title: `Complete ${target} hábitos hoje e ganhe 15 XP bônus`,
    description: 'Marque os checks de disciplina diária.',
    kind: 'habits',
    target,
    xp_bonus: 15,
  }
}
