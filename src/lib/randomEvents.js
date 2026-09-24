export const EVENT_POOLS = {
  skyrim: [
    { id: 'dragon', duration: 10000 },
    { id: 'werewolf', duration: 6000 },
    { id: 'vampire', duration: 5000 },
    { id: 'meteors', duration: 8000 },
    { id: 'bloodmoon', duration: 15000 },
    { id: 'blizzard', duration: 20000 },
    { id: 'eye', duration: 3000, rare: true },
  ],
  naruto: [
    { id: 'itachi', duration: 8000 },
    { id: 'kyuubi', duration: 10000 },
    { id: 'tsukuyomi', duration: 12000 },
    { id: 'ninja', duration: 800 },
    { id: 'petals', duration: 15000 },
    { id: 'chidori', duration: 500 },
  ],
  solo: [
    { id: 'jinwoo', duration: 5000 },
    { id: 'dungeon', duration: 6000 },
    { id: 'shadows', duration: 8000 },
    { id: 'alert', duration: 3000 },
    { id: 'boss', duration: 8000 },
    { id: 'monarch', duration: 10000 },
  ],
  clean: [
    { id: 'meteors', duration: 8000 },
    { id: 'petals', duration: 12000 },
  ],
}

export function pickRandomEvent(theme) {
  const pool = EVENT_POOLS[theme] || EVENT_POOLS.clean
  if (theme === 'skyrim' && Math.random() < 0.05) {
    return pool.find((item) => item.id === 'eye') || pool[0]
  }
  const common = pool.filter((item) => !item.rare)
  return common[Math.floor(Math.random() * common.length)]
}

export function findEvent(theme, id) {
  const pool = EVENT_POOLS[theme] || EVENT_POOLS.clean
  return pool.find((item) => item.id === id) || null
}

export function prefersReducedMotion() {
  return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
}
