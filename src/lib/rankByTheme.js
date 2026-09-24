const RANKS = {
  skyrim: ['Iniciante', 'Aprendiz', 'Guerreiro', 'Veterano', 'Elite', 'Mestre', 'Lendário', 'Dovahkiin'],
  naruto: ['Genin', 'Chunin', 'Jonin', 'ANBU', 'Kage', 'Seis Caminhos'],
  solo: ['E-Rank', 'D-Rank', 'C-Rank', 'B-Rank', 'A-Rank', 'S-Rank', 'National Level', 'Monarch'],
  clean: ['Iniciante', 'Aprendiz', 'Guerreiro', 'Veterano', 'Elite', 'Mestre', 'Lendário', 'Campeão'],
  cyberpunk: ['Cidadão', 'Fixers', 'Mercenário', 'Netrunner', 'Corpo', 'Legend'],
}

const KANJI = {
  Genin: '下忍',
  Chunin: '中忍',
  Jonin: '上忍',
  ANBU: '暗部',
  Kage: '影',
  'Seis Caminhos': '六道',
}

export function getRankList(theme) {
  return RANKS[theme] || RANKS.clean
}

export function getRankLabel(level, theme) {
  const list = getRankList(theme)
  const idx = Math.min(Math.floor(Math.max(1, Number(level) || 1) / 5), list.length - 1)
  return list[idx]
}

export function getRankMeta(level, theme) {
  const name = getRankLabel(level, theme)
  return { name, kanji: KANJI[name] || '' }
}
