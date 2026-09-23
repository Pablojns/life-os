/** Datas locais no formato YYYY-MM-DD, sem UTC. */

export function pad(value) {
  return String(value).padStart(2, '0')
}

export function toISODate(date = new Date()) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

export function daysInMonth(month, year) {
  return new Date(year, month, 0).getDate()
}

export function monthDate(year, month, day) {
  return `${year}-${pad(month)}-${pad(day)}`
}

export function normalizeDate(value) {
  if (!value) return ''
  return String(value).slice(0, 10)
}
