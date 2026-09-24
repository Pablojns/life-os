import { skyrim } from './skyrim'
import { clean } from './clean'
import { naruto } from './naruto'
import { solo } from './solo'

export const THEMES = { skyrim, clean, naruto, solo }
export type ThemeName = keyof typeof THEMES
export type ThemeTokens = (typeof THEMES)[ThemeName]

export function getTheme(name?: string | null): ThemeTokens {
  if (name && name in THEMES) return THEMES[name as ThemeName]
  return skyrim
}
