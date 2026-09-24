import { chromium } from 'playwright'
import fs from 'fs'
import path from 'path'

const OUT = path.join(process.cwd(), 'playwright-output')
fs.mkdirSync(OUT, { recursive: true })

const EMAIL = 'heroi.teste@lifeos.app'
const PASSWORD = 'LifeOS123!'
const APP = 'http://localhost:5173'

const THEMES = ['skyrim', 'clean', 'naruto', 'solo']

async function shot(page, name) {
  const file = path.join(OUT, `${name}.png`)
  await page.screenshot({ path: file, fullPage: true })
  console.log('screenshot ' + file)
}

async function login(page) {
  await page.goto(`${APP}/login`, { waitUntil: 'networkidle' })
  if (page.url().includes('/dashboard') || page.url().includes('/settings')) return
  const email = page.locator('input[type="email"]')
  if (await email.count()) {
    await email.fill(EMAIL)
    await page.locator('input[type="password"]').fill(PASSWORD)
    await page.getByRole('button', { name: /entrar/i }).click()
    await page.waitForURL(/\/(dashboard|settings)/, { timeout: 25000 })
  }
}

async function pickTheme(page, themeId) {
  await page.locator(`[data-theme-name="${themeId}"]`).click()
  await page.waitForFunction((theme) => document.documentElement.getAttribute('data-theme') === theme, themeId, {
    timeout: 8000,
  })
}

const browser = await chromium.launch({ headless: true, channel: 'chrome' })
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } })
const report = { unlockedSkins: [], lockedSkins: [], coachButtons: [], openFinance: false, badge: false, themes: {} }

try {
  await login(page)
  await page.goto(`${APP}/settings`, { waitUntil: 'networkidle' })
  await page.waitForTimeout(800)

  const body = await page.locator('body').innerText()
  report.badge = /Herói Anual/i.test(body)
  console.log('BADGE', report.badge)

  const cards = page.locator('section').filter({ hasText: 'Aparência' }).locator('button')
  const count = await cards.count()
  for (let i = 0; i < count; i += 1) {
    const text = await cards.nth(i).innerText()
    const locked = await cards.nth(i).locator('text=🔒').count()
    const name = text.split('\n')[1] || text
    if (locked) report.lockedSkins.push(name)
    else report.unlockedSkins.push(name)
  }
  console.log('UNLOCKED', report.unlockedSkins.join(' | '))
  console.log('LOCKED', report.lockedSkins.join(' | ') || 'none')
  await shot(page, 'settings-4-themes')
  await shot(page, 'settings-annual-badge')

  await page.goto(`${APP}/dashboard`, { waitUntil: 'networkidle' })
  await page.getByRole('tab', { name: /ia coach/i }).click()
  await page.waitForTimeout(800)
  const coachLabels = ['Analisar semana', 'Análise do dia', 'Relatório mensal']
  report.coachButtons = []
  for (const label of coachLabels) {
    if (await page.getByRole('button', { name: new RegExp(label, 'i') }).count()) {
      report.coachButtons.push(label)
    }
  }
  console.log('COACH', report.coachButtons.join(' | '))
  await shot(page, 'coach-3-buttons')

  await page.getByRole('tab', { name: /finanças/i }).click()
  await page.waitForTimeout(600)
  const financeText = await page.locator('body').innerText()
  report.openFinance = /Importar extrato CSV/i.test(financeText) && !/Importação de extrato no plano/i.test(financeText)
  console.log('OPEN_FINANCE', report.openFinance)
  await shot(page, 'finance-open-finance')

  await page.goto(`${APP}/settings`, { waitUntil: 'networkidle' })
  for (const theme of THEMES) {
    await pickTheme(page, theme)
    const applied = await page.evaluate(() => document.documentElement.getAttribute('data-theme'))
    report.themes[theme] = applied
    console.log('THEME', theme, applied)
    await shot(page, `settings-${theme}`)
    await page.goto(`${APP}/dashboard`, { waitUntil: 'networkidle' })
    await page.waitForTimeout(400)
    await shot(page, `theme-${theme}-dashboard`)
    await page.goto(`${APP}/settings`, { waitUntil: 'networkidle' })
  }

  await page.setViewportSize({ width: 375, height: 812 })
  await page.goto(`${APP}/dashboard`, { waitUntil: 'networkidle' })
  await shot(page, 'theme-mobile-375')
  await page.goto(`${APP}/settings`, { waitUntil: 'networkidle' })
  await shot(page, 'settings-mobile-375')

  console.log('REPORT ' + JSON.stringify(report))
  const ok =
    report.badge &&
    report.openFinance &&
    report.coachButtons.length === 3 &&
    report.lockedSkins.length === 0 &&
    THEMES.every((name) => report.themes[name] === name)
  console.log(ok ? 'VERIFY_OK' : 'VERIFY_PARTIAL')
} catch (error) {
  await shot(page, 'verify-annual-error')
  console.error('VERIFY_FAIL', error.message)
  process.exitCode = 1
} finally {
  await browser.close().catch(() => {})
}
