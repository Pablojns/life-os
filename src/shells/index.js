import SkyrimShell from './SkyrimShell'
import SoloShell from './SoloShell'
import NarutoShell from './NarutoShell'
import CleanShell from './CleanShell'
import CyberpunkShell from './CyberpunkShell'

const SHELLS = {
  skyrim: SkyrimShell,
  solo: SoloShell,
  naruto: NarutoShell,
  clean: CleanShell,
  cyberpunk: CyberpunkShell,
}

export function getShell(theme) {
  return SHELLS[theme] || CleanShell
}

export { SkyrimShell, SoloShell, NarutoShell, CleanShell, CyberpunkShell }
