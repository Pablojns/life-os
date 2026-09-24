export function pad(value: number) {
  return String(value).padStart(2, '0')
}

export function toISODate(date = new Date()) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

export function daysInMonth(month: number, year: number) {
  return new Date(year, month, 0).getDate()
}

export function monthDate(year: number, month: number, day: number) {
  return `${year}-${pad(month)}-${pad(day)}`
}

export function normalizeDate(value?: string | null) {
  if (!value) return ''
  return String(value).slice(0, 10)
}
