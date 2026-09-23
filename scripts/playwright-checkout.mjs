import { chromium } from 'playwright'
import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')
const OUT = path.join(ROOT, 'playwright-output')
fs.mkdirSync(OUT, { recursive: true })

const EMAIL = 'heroi.teste@lifeos.app'
const PASSWORD = 'LifeOS123!'
const APP = 'http://localhost:5173'
const SUPABASE_URL = 'https://isjxfqkvavoaksroutre.supabase.co'
const SUPABASE_KEY = 'sb_publishable_6K-0CffRhhuPUfvPoGsARw_oTu31N__'

async function shot(page, name) {
  const file = path.join(OUT, `${name}.png`)
  await page.screenshot({ path: file, fullPage: true })
  console.log(`screenshot: ${file}`)
  return file
}

async function queryPlan() {
  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)
  const { data: auth, error: authError } = await supabase.auth.signInWithPassword({
    email: EMAIL,
    password: PASSWORD,
  })
  if (authError) throw authError
  const { data, error } = await supabase.from('profiles').select('plan, plan_expires_at').eq('id', auth.user.id).single()
  await supabase.auth.signOut()
  if (error) throw error
  return data
}

const browser = await chromium.launch({ headless: false, channel: 'chrome' })
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } })
page.setDefaultTimeout(60000)

try {
  await page.goto(`${APP}/login`, { waitUntil: 'networkidle' })
  if (!/\/(dashboard|plans|settings)/.test(page.url())) {
    await page.locator('input[type="email"]').fill(EMAIL)
    await page.locator('input[type="password"]').fill(PASSWORD)
    await page.getByRole('button', { name: /Entrar na Jornada/i }).click()
    await page.waitForURL(/\/(dashboard|plans|settings)/, { timeout: 20000 })
  }

  await page.goto(`${APP}/plans`, { waitUntil: 'networkidle' })
  await page.getByRole('heading', { name: 'Planos' }).waitFor()
  await shot(page, 'checkout-01-plans')

  const monthly = page.locator('article').filter({ hasText: 'Herói Mensal' }).first()
  await monthly.getByRole('button', { name: /Assinar agora/i }).click()
  await page.waitForURL(/checkout\.stripe\.com/, { timeout: 45000 })
  await page.waitForTimeout(2500)
  await shot(page, 'checkout-02-stripe')
  console.log(`checkout-url: ${page.url()}`)

  const card = page.locator('input[name="cardNumber"], input[id="cardNumber"], input[placeholder*="1234"]').first()
  await card.waitFor({ timeout: 20000 })
  await card.fill('4242424242424242')

  const expiry = page.locator('input[name="cardExpiry"], input[id="cardExpiry"], input[placeholder*="MM"]').first()
  await expiry.fill('1229')

  const cvc = page.locator('input[name="cardCvc"], input[id="cardCvc"], input[placeholder*="CVC"]').first()
  await cvc.fill('123')

  const billingName = page.locator('input[name="billingName"], input[id="billingName"]').first()
  if (await billingName.count()) {
    await billingName.fill('Heroi Teste')
  }

  const postal = page
    .locator('input[name="billingPostalCode"], input[id="billingPostalCode"], input[placeholder*="CEP"], input[placeholder*="postal" i]')
    .first()
  if (await postal.count()) {
    await postal.fill('01310100')
  }

  await shot(page, 'checkout-03-filled')
  const pay = page.getByRole('button', { name: /Pagar|Pay|Subscribe|Assinar/i }).first()
  await pay.click()

  await page.waitForURL(/localhost:5173\/settings/, { timeout: 90000 })
  await page.waitForTimeout(2500)
  console.log(`return-url: ${page.url()}`)
  await shot(page, 'checkout-04-settings')

  const profile = await queryPlan()
  fs.writeFileSync(path.join(OUT, 'checkout-profile.json'), JSON.stringify(profile, null, 2))
  console.log(`profiles.plan=${profile.plan}`)
  if (profile.plan !== 'monthly') throw new Error(`plan esperado monthly, recebido ${profile.plan}`)
  console.log('CHECKOUT_OK')
} catch (error) {
  await shot(page, 'checkout-error')
  console.error('CHECKOUT_FAIL', error.message)
  process.exitCode = 1
} finally {
  await browser.close()
}
