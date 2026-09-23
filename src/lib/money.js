export function formatBRL(value) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(value) || 0)
}

export function toNumber(value) {
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

export const CATEGORY_ICONS = {
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

export const CHART_COLORS = ['#6366F1', '#C9A84C', '#EF4444', '#10B981', '#3B82F6', '#F59E0B', '#8B5CF6']
