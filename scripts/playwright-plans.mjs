import { chromium } from 'playwright'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const OUT = path.join(__dirname, '..', 'playwright-output')
fs.mkdirSync(OUT, { recursive: true })

const EMAIL = 'heroi.teste@lifeos.app'
const PASSWORD = 'LifeOS123!'
const APP = 'http://localhost:5173'

const browser = await chromium.launch({ headless: true, channel: 'chrome' })
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })

try {
  await page.goto(`${APP}/login`, { waitUntil: 'networkidle' })
  if (!/\/(dashboard|plans|settings)/.test(page.url())) {
    await page.locator('input[type="email"]').fill(EMAIL)
    await page.locator('input[type="password"]').fill(PASSWORD)
    await page.getByRole('button', { name: /Entrar na Jornada/i }).click()
    await page.waitForURL(/\/(dashboard|plans|settings)/, { timeout: 20000 })
  }

  await page.goto(`${APP}/plans`, { waitUntil: 'networkidle' })
  await page.getByRole('heading', { name: 'Planos' }).waitFor({ timeout: 15000 })
  await page.waitForTimeout(800)
  const shot = path.join(OUT, 'plans-page.png')
  await page.screenshot({ path: shot, fullPage: true })
  console.log(`screenshot: ${shot}`)

  const monthly = page.locator('article').filter({ hasText: 'Herói Mensal' }).first()
  await monthly.getByRole('button', { name: /Assinar agora/i }).click()
  await page.waitForTimeout(2500)
  const url = page.url()
  console.log(`after-click-url: ${url}`)
  await page.screenshot({ path: path.join(OUT, 'plans-after-subscribe.png'), fullPage: true })
  console.log('PLANS_OK')
} catch (error) {
  await page.screenshot({ path: path.join(OUT, 'plans-error.png'), fullPage: true }).catch(() => {})
  console.error('PLANS_FAIL', error)
  process.exitCode = 1
} finally {
  await browser.close()
}
