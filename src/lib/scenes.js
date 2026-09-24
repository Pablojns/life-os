import skyrimTavern from '../assets/backgrounds/skyrim/skyrim-tavern.jpg'
import skyrimBattlefield from '../assets/backgrounds/skyrim/skyrim-battlefield.jpg'
import skyrimTreasure from '../assets/backgrounds/skyrim/skyrim-treasure.jpg'
import skyrimDragon from '../assets/backgrounds/skyrim/skyrim-dragon.jpg'
import skyrimMain from '../assets/backgrounds/skyrim/skyrim-main.jpg'
import narutoMain from '../assets/backgrounds/naruto/naruto-main.jpg'
import narutoMissions from '../assets/backgrounds/naruto/naruto-missions.jpg'
import narutoHabits from '../assets/backgrounds/naruto/naruto-habits.jpg'
import narutoFinance from '../assets/backgrounds/naruto/naruto-finance.jpg'
import narutoTsukuyomi from '../assets/backgrounds/naruto/naruto-tsukuyomi.jpg'
import narutoMonument from '../assets/backgrounds/naruto/naruto-hokage-monument.jpg'
import soloMain from '../assets/backgrounds/solo/solo-main.jpg'
import soloMissions from '../assets/backgrounds/solo/solo-missions.jpg'
import soloHabits from '../assets/backgrounds/solo/solo-habits.jpg'
import soloFinance from '../assets/backgrounds/solo/solo-finance.jpg'
import soloSung from '../assets/backgrounds/solo/solo-sung.jpg'
import soloArmy from '../assets/backgrounds/solo/solo-shadow-army.jpg'

const MAP = {
  skyrim: {
    quests: skyrimTavern,
    habits: skyrimBattlefield,
    finance: skyrimTreasure,
    stats: skyrimDragon,
    default: skyrimMain,
  },
  naruto: {
    quests: narutoMissions,
    habits: narutoHabits,
    finance: narutoFinance,
    stats: narutoMonument,
    agenda: narutoTsukuyomi,
    default: narutoMain,
  },
  solo: {
    quests: soloMissions,
    habits: soloHabits,
    finance: soloFinance,
    stats: soloSung,
    arena: soloArmy,
    default: soloMain,
  },
}

export function sceneFor(theme, tab) {
  const pack = MAP[theme]
  if (!pack) return ''
  return pack[tab] || pack.default
}

export function sceneStyle(theme, tab) {
  const url = sceneFor(theme, tab)
  return url ? { '--scene': `url(${url})` } : {}
}
