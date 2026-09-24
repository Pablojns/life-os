/**
 * Sanitização de inputs para persistência segura no Supabase.
 * sanitize() → texto: remove < >, trimmed, limite 500 chars.
 * sanitizeNumber() → número: clamp [0, 999999999], fallback 0.
 */
export function sanitize(str) {
  if (typeof str !== 'string') return str
  return str.trim().replace(/[<>]/g, '').slice(0, 500)
}

export function sanitizeNumber(val) {
  const num = parseFloat(val)
  if (isNaN(num) || num < 0) return 0
  if (num > 999999999) return 999999999
  return num
}

/** compatibilidade com código existente */
export const sanitizeText = sanitize
