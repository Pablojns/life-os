import { chromium } from 'playwright'
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
const THEMES = ['skyrim', 'solo', 'naruto', 'clean']
const TIMES = ['dawn', 'sunset', 'midnight']

async function shot(page, name) {
  const file = path.join(OUT, `${name}.png`)
  await page.screenshot({ path: file, fullPage: false })
  console.log(`screenshot: ${file}`)
  return file
}

const browser = await chromium.launch({ headless: true, channel: 'chrome' })
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } })

try {
  await page.goto(`${APP}/login`, { waitUntil: 'networkidle' })
  if (!page.url().includes('/dashboard') && !page.url().includes('/settings')) {
    await page.locator('input[type="email"]').fill(EMAIL)
    await page.locator('input[type="password"]').fill(PASSWORD)
    await page.getByRole('button', { name: /Entrar na Jornada/i }).click()
    await page.waitForURL(/\/(dashboard|settings)/, { timeout: 20000 })
  }

  await page.goto(`${APP}/settings`, { waitUntil: 'networkidle' })
  await page.getByRole('heading', { name: 'Aparência' }).waitFor({ timeout: 15000 })

  for (const theme of THEMES) {
    await page.goto(`${APP}/settings`, { waitUntil: 'networkidle' })
    await page.locator(`[data-theme-name="${theme}"]`).click()
    await page.waitForFunction((name) => document.documentElement.getAttribute('data-theme') === name, theme, {
      timeout: 8000,
    })
    await page.goto(`${APP}/dashboard?event=off`, { waitUntil: 'networkidle' })
    await page.locator(`[data-shell="${theme}"]`).waitFor({ timeout: 8000 })
    await page.waitForFunction(() => document.documentElement.hasAttribute('data-world-ready'), null, { timeout: 12000 })

    for (const tod of TIMES) {
      await page.evaluate((value) => window.__LIFEOS_WORLD?.setTimeOfDay(value), tod)
      await page.waitForFunction((value) => document.documentElement.getAttribute('data-tod') === value, tod)
      await page.waitForTimeout(700)
      await shot(page, `world-${theme}-${tod}`)
    }
  }

  await page.goto(`${APP}/settings`, { waitUntil: 'networkidle' })
  await page.locator('[data-theme-name="skyrim"]').click()
  await page.goto(`${APP}/dashboard?event=off`, { waitUntil: 'networkidle' })
  await page.locator('[data-shell="skyrim"]').waitFor()
  await page.evaluate(() => {
    window.__LIFEOS_WORLD?.setTimeOfDay('midnight')
    window.__LIFEOS_WORLD?.triggerEvent('skyrim', 'dragon')
  })
  await page.waitForSelector('[data-random-event="dragon"]', { timeout: 5000 })
  await page.waitForTimeout(400)
  await shot(page, 'world-event-dragon')

  await page.goto(`${APP}/settings`, { waitUntil: 'networkidle' })
  await page.locator('[data-theme-name="naruto"]').click()
  await page.goto(`${APP}/dashboard?event=off`, { waitUntil: 'networkidle' })
  await page.locator('[data-shell="naruto"]').waitFor()
  await page.evaluate(() => {
    window.__LIFEOS_WORLD?.setTimeOfDay('sunset')
    window.__LIFEOS_WORLD?.triggerEvent('naruto', 'kyuubi')
  })
  await page.waitForSelector('[data-random-event="kyuubi"]', { timeout: 5000 })
  await page.waitForTimeout(400)
  await shot(page, 'world-event-kyuubi')

  const world = await page.evaluate(() => window.__LIFEOS_WORLD?.getState())
  console.log('WORLD_STATE', JSON.stringify(world))
  if (!world?.weather?.condition) throw new Error('Clima ausente')
  if (!['api', 'cache', 'fallback'].includes(world.weather.source)) throw new Error('Fonte de clima inválida')
  fs.writeFileSync(path.join(OUT, 'world-report.json'), JSON.stringify({ ok: true, world }, null, 2))
  console.log('WORLD_TEST_OK', world.weather.source, world.weather.city, world.weather.condition)
} catch (error) {
  await shot(page, 'world-error').catch(() => {})
  console.error('WORLD_TEST_FAIL', error)
  process.exitCode = 1
} finally {
  await browser.close()
}
