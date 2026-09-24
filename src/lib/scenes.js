import skyrimQuests from '../assets/backgrounds/skyrim/skyrim-quests.jpg'
import skyrimHabits from '../assets/backgrounds/skyrim/skyrim-habits.jpg'
import skyrimFinance from '../assets/backgrounds/skyrim/skyrim-finance.jpg'
import skyrimStats from '../assets/backgrounds/skyrim/skyrim-stats.jpg'
import skyrimMain from '../assets/backgrounds/skyrim/skyrim-main.jpg'
import skyrimSnow from '../assets/backgrounds/skyrim/skyrim-weather-snow.jpg'
import skyrimNight from '../assets/backgrounds/skyrim/skyrim-night.jpg'
import narutoMain from '../assets/backgrounds/naruto/naruto-main.jpg'
import narutoQuests from '../assets/backgrounds/naruto/naruto-quests.jpg'
import narutoHabits from '../assets/backgrounds/naruto/naruto-habits.jpg'
import narutoFinance from '../assets/backgrounds/naruto/naruto-finance.jpg'
import narutoStats from '../assets/backgrounds/naruto/naruto-stats.jpg'
import narutoTsukuyomi from '../assets/backgrounds/naruto/naruto-tsukuyomi.jpg'
import narutoRain from '../assets/backgrounds/naruto/naruto-rain.jpg'
import soloMain from '../assets/backgrounds/solo/solo-main.jpg'
import soloQuests from '../assets/backgrounds/solo/solo-quests.jpg'
import soloHabits from '../assets/backgrounds/solo/solo-habits.jpg'
import soloFinance from '../assets/backgrounds/solo/solo-finance.jpg'
import soloStats from '../assets/backgrounds/solo/solo-stats.jpg'
import soloArena from '../assets/backgrounds/solo/solo-arena.jpg'
import soloNight from '../assets/backgrounds/solo/solo-night.jpg'
import cyberMain from '../assets/backgrounds/cyberpunk/cyberpunk-main.jpg'
import cyberQuests from '../assets/backgrounds/cyberpunk/cyberpunk-quests.jpg'
import cyberHabits from '../assets/backgrounds/cyberpunk/cyberpunk-habits.jpg'
import cyberFinance from '../assets/backgrounds/cyberpunk/cyberpunk-finance.jpg'
import cyberStats from '../assets/backgrounds/cyberpunk/cyberpunk-stats.jpg'

const MAP = {
  skyrim: {
    quests: skyrimQuests,
    habits: skyrimHabits,
    finance: skyrimFinance,
    stats: skyrimStats,
    default: skyrimMain,
  },
  naruto: {
    quests: narutoQuests,
    habits: narutoHabits,
    finance: narutoFinance,
    stats: narutoStats,
    default: narutoMain,
  },
  solo: {
    quests: soloQuests,
    habits: soloHabits,
    finance: soloFinance,
    stats: soloStats,
    arena: soloArena,
    default: soloMain,
  },
  cyberpunk: {
    quests: cyberQuests,
    habits: cyberHabits,
    finance: cyberFinance,
    stats: cyberStats,
    default: cyberMain,
  },
}

function isNight(timeOfDay) {
  return /evening|midnight|sunset/i.test(timeOfDay || '')
}

function isRain(weather) {
  return /Rain|Thunder|Drizzle/i.test(weather?.condition || '')
}

export function sceneFor(theme, tab, world = {}) {
  const pack = MAP[theme]
  if (!pack) return ''

  const { timeOfDay, weather } = world

  if (theme === 'naruto') {
    if (isNight(timeOfDay)) return narutoTsukuyomi
    if (isRain(weather)) return narutoRain
  }

  if (theme === 'skyrim') {
    if (tab === 'quests' || tab === 'finance') return pack[tab]
    if (/Snow/i.test(weather?.condition || '')) return skyrimSnow
    if (isNight(timeOfDay) && !pack[tab]) return skyrimNight
  }

  if (theme === 'solo') {
    if (tab === 'arena') return soloArena
    if (isNight(timeOfDay) && !pack[tab]) return soloNight
  }

  return pack[tab] || pack.default
}

export function sceneStyle(theme, tab, world = {}) {
  const url = sceneFor(theme, tab, world)
  return url ? { '--scene': `url(${url})` } : {}
}
