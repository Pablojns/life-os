export const solo = {
  name: 'solo' as const,
  colors: {
    bg: '#050508',
    surface: '#0D0D1A',
    surfaceMid: '#141428',
    primary: '#7B2FBE',
    primaryDark: '#4C1D7A',
    text: '#E8E8FF',
    textMuted: '#6060A0',
    success: '#00FFAA',
    danger: '#FF3366',
    onPrimary: '#F4F0FF',
  },
  fonts: {
    display: 'Inter_600SemiBold',
    body: 'Inter_400Regular',
  },
  radii: { sm: 0, md: 2, lg: 4 },
  labels: {
    quests: 'Quests do Sistema',
    habits: 'Treinamento de Hunter',
    rewards: 'Drops de Dungeon',
    xp: 'EXP',
    level: 'Rank',
    complete: 'Completar quest',
    add: '+ Nova quest',
  },
}
