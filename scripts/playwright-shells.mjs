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

async function shot(page, name) {
  const file = path.join(OUT, `${name}.png`)
  await page.screenshot({ path: file, fullPage: false })
  console.log(`screenshot: ${file}`)
  return file
}

async function waitForTheme(page, name) {
  await page.waitForFunction((theme) => document.documentElement.getAttribute('data-theme') === theme, name, {
    timeout: 8000,
  })
}

async function waitForShell(page, name) {
  await page.locator(`[data-shell="${name}"]`).waitFor({ timeout: 8000 })
}

const browser = await chromium.launch({
  headless: true,
  channel: 'chrome',
})
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } })
const timings = {}

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
  await shot(page, 'shell-settings-desktop')
  await page.setViewportSize({ width: 375, height: 812 })
  await shot(page, 'shell-settings-mobile')
  await page.setViewportSize({ width: 1280, height: 900 })

  let previous = null
  for (const theme of THEMES) {
    await page.goto(`${APP}/settings`, { waitUntil: 'networkidle' })
    const card = page.locator(`[data-theme-name="${theme}"]`)
    const started = Date.now()
    await card.click()
    await waitForTheme(page, theme)
    const elapsed = Date.now() - started
    timings[theme] = elapsed
    console.log(`switch ${previous || 'none'} -> ${theme}: ${elapsed}ms`)
    previous = theme

    await page.goto(`${APP}/dashboard`, { waitUntil: 'networkidle' })
    await waitForTheme(page, theme)
    await waitForShell(page, theme)
    await page.waitForTimeout(600)
    await shot(page, `shell-${theme}-desktop`)

    await page.setViewportSize({ width: 375, height: 812 })
    await page.waitForTimeout(400)
    await waitForShell(page, theme)
    await shot(page, `shell-${theme}-mobile`)
    await page.setViewportSize({ width: 1280, height: 900 })
  }

  const slow = Object.values(timings).some((ms) => ms > 1500)
  const report = { ok: !slow, timings }
  fs.writeFileSync(path.join(OUT, 'shells-report.json'), JSON.stringify(report, null, 2))
  if (slow) throw new Error(`Troca de tema lenta: ${JSON.stringify(timings)}`)
  console.log('SHELLS_TEST_OK', JSON.stringify(timings))
} catch (error) {
  await shot(page, 'shell-error').catch(() => {})
  console.error('SHELLS_TEST_FAIL', error)
  process.exitCode = 1
} finally {
  await browser.close()
}
