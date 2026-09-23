export const STRIPE_PRODUCTS = [
  { key: 'monthly', name: 'Life OS — Herói Mensal', amount: 1990, interval: 'month', count: 1 },
  { key: 'quarterly', name: 'Life OS — Herói Trimestral', amount: 4990, interval: 'month', count: 3 },
  { key: 'semiannual', name: 'Life OS — Herói Semestral', amount: 8990, interval: 'month', count: 6 },
  { key: 'annual', name: 'Life OS — Herói Anual', amount: 14990, interval: 'year', count: 1 },
]

export function parseEnvFile(text) {
  const values = {}
  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const index = trimmed.indexOf('=')
    if (index === -1) continue
    values[trimmed.slice(0, index)] = trimmed.slice(index + 1)
  }
  return values
}

export async function stripeGet(secret, pathname) {
  const response = await fetch(`https://api.stripe.com/v1/${pathname}`, {
    headers: { Authorization: `Bearer ${secret}` },
  })
  const json = await response.json()
  if (!response.ok) throw new Error(json.error?.message || `GET ${pathname} failed`)
  return json
}

export async function stripePost(secret, pathname, params) {
  const response = await fetch(`https://api.stripe.com/v1/${pathname}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${secret}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams(params),
  })
  const json = await response.json()
  if (!response.ok) throw new Error(json.error?.message || `POST ${pathname} failed`)
  return json
}

export async function ensureStripeCatalog(secret) {
  const existing = await stripeGet(secret, 'products?limit=100&active=true')
  const prices = await stripeGet(secret, 'prices?limit=100&active=true')
  const created = {}

  for (const product of STRIPE_PRODUCTS) {
    let stripeProduct = existing.data.find((item) => item.name === product.name)
    if (!stripeProduct) {
      stripeProduct = await stripePost(secret, 'products', {
        name: product.name,
        'metadata[plan]': product.key,
      })
    }

    let price = prices.data.find(
      (item) =>
        item.product === stripeProduct.id &&
        item.unit_amount === product.amount &&
        item.currency === 'brl' &&
        item.recurring?.interval === product.interval &&
        item.recurring?.interval_count === product.count,
    )

    if (!price) {
      price = await stripePost(secret, 'prices', {
        product: stripeProduct.id,
        currency: 'brl',
        unit_amount: String(product.amount),
        'recurring[interval]': product.interval,
        'recurring[interval_count]': String(product.count),
        'metadata[plan]': product.key,
      })
    }

    created[product.key] = { productId: stripeProduct.id, priceId: price.id, name: product.name }
  }

  return created
}

export async function createCheckoutSession(secret, { priceId, userId, userEmail, plan, appUrl }) {
  return stripePost(secret, 'checkout/sessions', {
    'payment_method_types[0]': 'card',
    mode: 'subscription',
    customer_email: userEmail,
    'line_items[0][price]': priceId,
    'line_items[0][quantity]': '1',
    success_url: `${appUrl}/settings?success=true&plan=${plan}`,
    cancel_url: `${appUrl}/settings?canceled=true`,
    'metadata[userId]': userId,
    'metadata[plan]': plan,
    'subscription_data[metadata][userId]': userId,
    'subscription_data[metadata][plan]': plan,
  })
}
