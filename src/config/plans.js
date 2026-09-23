/**
 * Feature flags, limites e Price IDs do Stripe por plano.
 */

export const UNLIMITED = Infinity

export const PLAN_IDS = {
  FREE: 'free',
  MONTHLY: 'monthly',
  QUARTERLY: 'quarterly',
  SEMIANNUAL: 'semiannual',
  ANNUAL: 'annual',
}

export const SKINS = {
  SKYRIM: 'skyrim',
  CLEAN: 'clean',
  NARUTO: 'naruto',
  SOLO: 'solo',
  CYBERPUNK: 'cyberpunk',
  GHIBLI: 'ghibli',
  LEGENDARY: 'legendary',
}

export const PLANS = {
  free: {
    id: 'free',
    label: 'Gratuito',
    name: 'Gratuito',
    price: 0,
    priceId: null,
    intervalMonths: 0,
    period: 'Grátis',
    discount: null,
    maxQuests: 5,
    maxHabits: 3,
    maxNotes: 10,
    skins: ['skyrim', 'clean'],
    hasAICoach: false,
    aiCoachLevel: null,
    hasOpenFinance: false,
    hasFullFinance: false,
  },
  monthly: {
    id: 'monthly',
    label: 'Herói Mensal',
    name: 'Herói Mensal',
    price: 19.9,
    priceId: 'price_1UIwso3rN1cCG2xQMMj9hBno',
    intervalMonths: 1,
    period: '/ mês',
    discount: null,
    maxQuests: Infinity,
    maxHabits: Infinity,
    maxNotes: Infinity,
    skins: ['skyrim', 'clean'],
    hasAICoach: true,
    aiCoachLevel: 'basic',
    hasOpenFinance: false,
    hasFullFinance: true,
  },
  quarterly: {
    id: 'quarterly',
    label: 'Herói Trimestral',
    name: 'Herói Trimestral',
    price: 49.9,
    priceId: 'price_1UIwso3rN1cCG2xQNednrzhz',
    intervalMonths: 3,
    period: '/ 3 meses',
    discount: '17% off',
    maxQuests: Infinity,
    maxHabits: Infinity,
    maxNotes: Infinity,
    skins: ['skyrim', 'clean', 'naruto', 'solo'],
    hasAICoach: true,
    aiCoachLevel: 'basic',
    hasOpenFinance: false,
    hasFullFinance: true,
  },
  semiannual: {
    id: 'semiannual',
    label: 'Herói Semestral',
    name: 'Herói Semestral',
    price: 89.9,
    priceId: 'price_1UIwsp3rN1cCG2xQkm5BKUSi',
    intervalMonths: 6,
    period: '/ 6 meses',
    discount: '25% off',
    maxQuests: Infinity,
    maxHabits: Infinity,
    maxNotes: Infinity,
    skins: ['skyrim', 'clean', 'naruto', 'solo', 'cyberpunk', 'ghibli'],
    hasAICoach: true,
    aiCoachLevel: 'full',
    hasOpenFinance: true,
    hasFullFinance: true,
  },
  annual: {
    id: 'annual',
    label: 'Herói Anual',
    name: 'Herói Anual',
    price: 149.9,
    priceId: 'price_1UIwsp3rN1cCG2xQFA7ukizi',
    intervalMonths: 12,
    period: '/ ano',
    discount: '37% off',
    maxQuests: Infinity,
    maxHabits: Infinity,
    maxNotes: Infinity,
    skins: ['skyrim', 'clean', 'naruto', 'solo', 'cyberpunk', 'ghibli', 'legendary'],
    hasAICoach: true,
    aiCoachLevel: 'full',
    hasOpenFinance: true,
    hasFullFinance: true,
  },
}

export const plans = PLANS

export const DEFAULT_PLAN_ID = PLAN_IDS.FREE

export function getPlan(planId = DEFAULT_PLAN_ID) {
  return PLANS[planId] ?? PLANS.free
}

export function isUnlimited(limit) {
  return limit === UNLIMITED || limit === Infinity || limit === -1
}

export function isWithinLimit(count, limit) {
  if (isUnlimited(limit)) return true
  return count < limit
}

export function hasFeature(planId, feature) {
  const plan = getPlan(planId)
  return Boolean(plan[feature])
}

export function canUseSkin(planId, skin) {
  return getPlan(planId).skins.includes(skin)
}

export function formatPlanPrice(plan) {
  if (!plan.price) return 'R$ 0'
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(plan.price)
}

export function paidSkinCount(plan) {
  return plan.skins.filter((skin) => skin !== 'skyrim' && skin !== 'clean').length
}

export function planFeatureList(plan) {
  const extras = paidSkinCount(plan)
  return [
    { label: 'Missões ilimitadas', included: isUnlimited(plan.maxQuests) },
    { label: 'Hábitos ilimitados', included: isUnlimited(plan.maxHabits) },
    { label: 'Financeiro completo + gráficos', included: plan.hasFullFinance },
    {
      label: plan.aiCoachLevel === 'full' ? 'IA Coach (completa)' : 'IA Coach (básica)',
      included: plan.hasAICoach,
    },
    { label: 'Open Finance', included: plan.hasOpenFinance },
    {
      label: extras > 0 ? `Temas pagos (${extras})` : 'Temas pagos',
      included: extras > 0,
    },
    { label: 'Skin Lendária exclusiva', included: plan.skins.includes('legendary') },
  ]
}
