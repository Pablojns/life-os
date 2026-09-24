export function getShellTabs(labels, theme) {
  const icons = {
    skyrim: {
      quests: 'M',
      habits: 'D',
      notes: 'T',
      rewards: 'S',
      stats: 'A',
      finance: 'O',
      agenda: 'C',
      coach: 'R',
      arena: 'F',
    },
    solo: {
      quests: 'Q',
      habits: 'T',
      notes: 'R',
      rewards: 'D',
      stats: 'S',
      finance: 'I',
      agenda: 'C',
      coach: 'A',
      arena: 'X',
    },
    naruto: {
      quests: 'M',
      habits: 'N',
      notes: 'I',
      rewards: 'P',
      stats: 'F',
      finance: 'T',
      agenda: 'C',
      coach: 'H',
      arena: 'A',
    },
    clean: {
      quests: 'T',
      habits: 'H',
      notes: 'N',
      rewards: 'R',
      stats: 'A',
      finance: 'F',
      agenda: 'C',
      coach: 'K',
      arena: 'X',
    },
  }

  const set = icons[theme] || icons.clean

  return [
    { id: 'quests', label: labels.quests, icon: set.quests },
    { id: 'habits', label: labels.habits, icon: set.habits },
    { id: 'notes', label: labels.notes, icon: set.notes },
    { id: 'rewards', label: labels.rewards, icon: set.rewards },
    { id: 'stats', label: labels.stats || 'Atributos', icon: set.stats },
    { id: 'finance', label: labels.finance || 'Finanças', icon: set.finance },
    { id: 'agenda', label: labels.agenda || 'Agenda', icon: set.agenda },
    { id: 'coach', label: labels.coach || 'IA Coach', icon: set.coach },
    { id: 'arena', label: labels.arena || 'Arena', icon: set.arena },
  ]
}
