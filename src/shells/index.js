import SkyrimShell from './SkyrimShell'
import SoloShell from './SoloShell'
import NarutoShell from './NarutoShell'
import CleanShell from './CleanShell'

const SHELLS = {
  skyrim: SkyrimShell,
  solo: SoloShell,
  naruto: NarutoShell,
  clean: CleanShell,
}

export function getShell(theme) {
  return SHELLS[theme] || CleanShell
}

export { SkyrimShell, SoloShell, NarutoShell, CleanShell }
