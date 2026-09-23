import { chromium } from 'playwright'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')
const OUT = path.join(ROOT, 'playwright-output')
const PROFILE = path.join(process.env.LOCALAPPDATA, 'Google', 'Chrome', 'User Data', 'Profile 8')

fs.mkdirSync(OUT, { recursive: true })

const PRODUCTS = [
  { key: 'monthly', name: 'Life OS — Herói Mensal', amount: 1990, interval: 'month', count: 1 },
  { key: 'quarterly', name: 'Life OS — Herói Trimestral', amount: 4990, interval: 'month', count: 3 },
  { key: 'semiannual', name: 'Life OS — Herói Semestral', amount: 8990, interval: 'month', count: 6 },
  { key: 'annual', name: 'Life OS — Herói Anual', amount: 14990, interval: 'year', count: 1 },
]

function log(message) {
  console.log(message)
}

async function shot(page, name) {
  const file = path.join(OUT, `${name}.png`)
  await page.screenshot({ path: file, fullPage: true }).catch(() => {})
  log(`screenshot: ${file}`)
}

function isDashboard(url) {
  return /dashboard\.stripe\.com/.test(url) && !/\/login|\/register/.test(url)
}

async function stripeGet(secret, pathname) {
  const response = await fetch(`https://api.stripe.com/v1/${pathname}`, {
    headers: { Authorization: `Bearer ${secret}` },
  })
  const json = await response.json()
  if (!response.ok) throw new Error(json.error?.message || `GET ${pathname} failed`)
  return json
}

async function stripePost(secret, pathname, params) {
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

async function extractKeys(page) {
  await page.goto('https://dashboard.stripe.com/test/apikeys', { waitUntil: 'domcontentloaded', timeout: 90000 })
  await page.waitForTimeout(4000)
  await shot(page, 'stripe-apikeys')

  for (const name of [/reveal test key/i, /revelar/i, /reveal secret/i, /show test key/i]) {
    const button = page.getByRole('button', { name }).first()
    if (await button.count()) {
      await button.click().catch(() => {})
      await page.waitForTimeout(1500)
    }
  }

  const text = await page.evaluate(() => document.body.innerText)
  return {
    publishable: text.match(/pk_test_[A-Za-z0-9]+/)?.[0] || null,
    secret: text.match(/sk_test_[A-Za-z0-9]+/)?.[0] || null,
  }
}

async function ensureProducts(secret) {
  const existing = await stripeGet(secret, 'products?limit=100&active=true')
  const prices = await stripeGet(secret, 'prices?limit=100&active=true')
  const created = {}

  for (const product of PRODUCTS) {
    let stripeProduct = existing.data.find((item) => item.name === product.name)
    if (!stripeProduct) {
      stripeProduct = await stripePost(secret, 'products', {
        name: product.name,
        'metadata[plan]': product.key,
      })
      log(`produto criado: ${stripeProduct.id} ${product.name}`)
    } else {
      log(`produto já existia: ${stripeProduct.id} ${product.name}`)
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
      log(`preço criado: ${price.id}`)
    } else {
      log(`preço já existia: ${price.id}`)
    }

    created[product.key] = { productId: stripeProduct.id, priceId: price.id, name: product.name }
  }

  return created
}

const context = await chromium.launchPersistentContext(PROFILE, {
  channel: 'chrome',
  headless: false,
  viewport: { width: 1440, height: 960 },
  args: ['--disable-extensions', '--disable-blink-features=AutomationControlled'],
  ignoreDefaultArgs: ['--enable-automation'],
})
const page = context.pages()[0] || (await context.newPage())
page.setDefaultTimeout(45000)

try {
  await page.goto('https://dashboard.stripe.com/test/products', { waitUntil: 'domcontentloaded', timeout: 90000 })
  await page.waitForTimeout(5000)
  await shot(page, 'stripe-products-start')
  log(`url: ${page.url()}`)

  if (!isDashboard(page.url())) {
    await page.getByRole('button', { name: /Aceitar tudo|Accept all/i }).click({ timeout: 3000 }).catch(() => {})
    const google = page.getByRole('button', { name: /^Google$/i }).first()
    if (await google.count()) {
      await google.click()
      await page.waitForTimeout(5000)
      await shot(page, 'stripe-google-sso')
      const account = page.locator('[data-identifier], [data-email], a[data-authuser]').first()
      if (await account.count()) {
        await account.click()
        await page.waitForTimeout(8000)
      }
    }
  }

  if (!isDashboard(page.url())) {
    throw new Error(`LOGIN_WALL ${page.url()}`)
  }

  const keys = await extractKeys(page)
  log(`pk=${Boolean(keys.publishable)} sk=${Boolean(keys.secret)}`)
  if (!keys.secret) throw new Error('Não foi possível revelar sk_test_')

  const created = await ensureProducts(keys.secret)
  await page.goto('https://dashboard.stripe.com/test/products', { waitUntil: 'domcontentloaded' })
  await page.waitForTimeout(4000)
  await shot(page, 'stripe-products-after')

  fs.writeFileSync(path.join(OUT, 'stripe-products.json'), JSON.stringify({ keys, products: created }, null, 2))
  console.log(JSON.stringify(created, null, 2))
  console.log('STRIPE_SETUP_OK')
} catch (error) {
  await shot(page, 'stripe-setup-error')
  console.error('STRIPE_SETUP_FAIL', error.message)
  process.exitCode = 1
} finally {
  await context.close().catch(() => {})
}
