import { chromium } from 'playwright'
import path from 'path'
import fs from 'fs'

const OUT = path.join(process.cwd(), 'playwright-output')
fs.mkdirSync(OUT, { recursive: true })
const APP = 'http://localhost:5173'
const EMAIL = 'heroi.teste@lifeos.app'
const PASSWORD = 'LifeOS123!'
const THEMES = ['skyrim', 'naruto', 'solo', 'clean']

const browser = await chromium.launch({ headless: true, channel: 'chrome' })
const context = await browser.newContext({ viewport: { width: 1440, height: 900 } })
const page = await context.newPage()

await page.goto(`${APP}/quiz`, { waitUntil: 'networkidle' })
await page.screenshot({ path: path.join(OUT, 'quiz-desktop.png') })
await page.setViewportSize({ width: 375, height: 812 })
await page.screenshot({ path: path.join(OUT, 'quiz-mobile.png') })
await page.setViewportSize({ width: 1440, height: 900 })

await page.goto(`${APP}/login`, { waitUntil: 'networkidle' })
if (!page.url().includes('/dashboard')) {
  await page.locator('input[type="email"]').fill(EMAIL)
  await page.locator('input[type="password"]').fill(PASSWORD)
  await page.getByRole('button', { name: /Entrar na Jornada/i }).click()
  await page.waitForURL(/\/(dashboard|settings|onboarding)/, { timeout: 20000 })
}

if (page.url().includes('onboarding')) {
  await page.goto(`${APP}/dashboard`, { waitUntil: 'networkidle' }).catch(() => {})
}

for (const theme of THEMES) {
  await page.goto(`${APP}/settings`, { waitUntil: 'networkidle' })
  await page.locator(`[data-theme-name="${theme}"]`).click()
  await page.waitForFunction((name) => document.documentElement.getAttribute('data-theme') === name, theme, { timeout: 8000 })
  await page.waitForTimeout(1800)
  await page.goto(`${APP}/dashboard`, { waitUntil: 'networkidle' })
  await page.locator(`[data-shell="${theme}"]`).waitFor({ timeout: 8000 })
  await page.waitForTimeout(900)
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.screenshot({ path: path.join(OUT, `scene-${theme}-desktop.png`) })
  await page.setViewportSize({ width: 375, height: 812 })
  await page.screenshot({ path: path.join(OUT, `scene-${theme}-mobile.png`) })
  await page.setViewportSize({ width: 1440, height: 900 })
}

await browser.close()
console.log('SCENES_OK')
