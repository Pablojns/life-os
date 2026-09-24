export function sanitize(str: unknown) {
  if (typeof str !== 'string') return str as string
  return str.trim().replace(/[<>]/g, '').slice(0, 500)
}

export function sanitizeNumber(val: unknown) {
  const num = parseFloat(String(val))
  if (Number.isNaN(num) || num < 0) return 0
  if (num > 999999999) return 999999999
  return num
}

export const sanitizeText = sanitize
