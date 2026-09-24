export function getShellTabs(labels) {
  const shorts = {
    quests: 'Missões',
    habits: 'Hábitos',
    notes: 'Notas',
    rewards: 'Prêmios',
    stats: 'Stats',
    finance: 'Finanças',
    agenda: 'Agenda',
    coach: 'Coach',
    arena: 'Arena',
  }

  return [
    { id: 'quests', label: labels.quests, short: shorts.quests },
    { id: 'habits', label: labels.habits, short: shorts.habits },
    { id: 'notes', label: labels.notes, short: shorts.notes },
    { id: 'rewards', label: labels.rewards, short: shorts.rewards },
    { id: 'stats', label: labels.stats || 'Atributos', short: shorts.stats },
    { id: 'finance', label: labels.finance || 'Finanças', short: shorts.finance },
    { id: 'agenda', label: labels.agenda || 'Agenda', short: shorts.agenda },
    { id: 'coach', label: labels.coach || 'IA Coach', short: shorts.coach },
    { id: 'arena', label: labels.arena || 'Arena', short: shorts.arena },
  ]
}
