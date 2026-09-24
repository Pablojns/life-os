export function getShellTabs(labels, theme) {
  const icons = {
    skyrim: {
      quests: '⚔',
      habits: '📿',
      notes: '📜',
      rewards: '🍖',
      stats: '📊',
      finance: '💰',
      agenda: '📅',
      coach: '🤖',
      arena: '🎮',
    },
    solo: {
      quests: '▶',
      habits: '▲',
      notes: '▣',
      rewards: '◆',
      stats: '☰',
      finance: '◈',
      agenda: '📅',
      coach: '◎',
      arena: '⚔',
    },
    naruto: {
      quests: '🔥',
      habits: '💨',
      notes: '💧',
      rewards: '🌍',
      stats: '⚡',
      finance: '🌿',
      agenda: '📅',
      coach: '🍥',
      arena: '🎮',
    },
    clean: {
      quests: '◇',
      habits: '○',
      notes: '□',
      rewards: '☆',
      stats: '△',
      finance: '◎',
      agenda: '📅',
      coach: '✦',
      arena: '🎮',
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
