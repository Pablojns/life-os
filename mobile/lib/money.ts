export function formatBRL(value: unknown) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(value) || 0)
}

export function toNumber(value: unknown) {
  if (typeof value === 'number') return value
  if (value == null || value === '') return 0
  let text = String(value).trim().replace(/[R$\s]/g, '')
  if (text.includes(',') && text.includes('.')) text = text.replace(/\./g, '').replace(',', '.')
  else if (text.includes(',')) text = text.replace(',', '.')
  const parsed = Number(text)
  return Number.isFinite(parsed) ? parsed : 0
}

export const EXPENSE_CATEGORIES = ['Alimentação', 'Transporte', 'Moradia', 'Saúde', 'Lazer', 'Educação', 'Outros']
export const INCOME_CATEGORIES = ['Salário', 'Freelance', 'Investimentos', 'Outros']

export const CATEGORY_ICONS: Record<string, string> = {
  Alimentação: '🍽️',
  Transporte: '🚌',
  Moradia: '🏠',
  Saúde: '💊',
  Lazer: '🎮',
  Educação: '📚',
  Salário: '💼',
  Freelance: '💻',
  Investimentos: '📈',
  Outros: '✨',
}
