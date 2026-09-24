import { chromium } from 'playwright'
import fs from 'fs'
import path from 'path'

const OUT = path.join(process.cwd(), 'playwright-output')
const NOTES = path.join(OUT, 'walk-notes.json')
const APP = 'http://localhost:5173'
fs.mkdirSync(OUT, { recursive: true })

const notes = { screens: {}, path: [] }

async function shot(page, name) {
  const file = path.join(OUT, `walk-${name}.png`)
  await page.screenshot({ path: file, fullPage: false })
  notes.screens[name] = (await page.locator('body').innerText()).slice(0, 2000)
  notes.path.push(name)
  console.log('SHOT', name)
}

const context = await chromium.launch({ channel: 'chrome', headless: false })
const page = await context.newPage()
page.setDefaultTimeout(25000)

try {
  await page.goto(`${APP}/login`, { waitUntil: 'networkidle' })
  await page.waitForURL(/\/(dashboard|onboarding|settings)/, { timeout: 25000 }).catch(async () => {
    await page.locator('input[type="email"]').fill('heroi.teste@lifeos.app')
    await page.locator('input[type="password"]').fill('LifeOS123!')
    await page.getByRole('button', { name: /Entrar/i }).click()
    await page.waitForURL(/\/(dashboard|onboarding|settings)/, { timeout: 20000 })
  })
  if (page.url().includes('/onboarding')) {
    await page.locator('input').first().fill('Heroi Teste')
    await page.getByRole('button', { name: /Continuar/i }).click()
    await page.getByRole('heading', { name: /situação financeira/i }).waitFor({ timeout: 20000 }).catch(() => {})
    await page.getByRole('button', { name: /Continuar/i }).click()
    await page.getByRole('heading', { name: /primeira missão/i }).waitFor({ timeout: 20000 }).catch(() => {})
    await page.getByRole('button', { name: /Entrar no sistema/i }).click()
    await page.waitForURL(/\/dashboard/, { timeout: 20000 }).catch(() => {})
  }
  await page.goto(`${APP}/dashboard`, { waitUntil: 'networkidle' })
  await page.waitForTimeout(1200)
  await shot(page, 'dashboard')

  const tabs = ['quests', 'habits', 'notes', 'rewards', 'stats', 'finance', 'agenda', 'coach', 'arena']
  for (const tab of tabs) {
    const btn = page.locator(`[data-tab="${tab}"]`).first()
    if (await btn.count()) await btn.click({ force: true })
    await page.waitForTimeout(900)
    await shot(page, tab)
  }

  const complete = page.locator('[data-tab="quests"]').first()
  if (await complete.count()) await complete.click({ force: true })
  await page.waitForTimeout(600)
  const done = page.getByRole('button', { name: /Concluir|Completar|Missão Cumprida|Completar Quest/i }).first()
  if (await done.count()) {
    await done.click()
    await page.waitForTimeout(1000)
    notes.path.push('quest-complete')
  }

  await page.locator('[data-tab="arena"]').first().click({ force: true }).catch(() => {})
  await page.waitForTimeout(800)
  await shot(page, 'arena-rec')
  const rec = page.locator('[data-recommended]')
  notes.recommended = (await rec.count()) ? await rec.innerText() : 'missing'
  const open = page.getByRole('button', { name: /Abrir agora/i }).first()
  if (await open.count()) await open.click()
  await page.waitForTimeout(500)
  await shot(page, 'arena-game')

  await page.goto(`${APP}/settings`, { waitUntil: 'networkidle' })
  await shot(page, 'settings')
  await page.goto(`${APP}/plans`, { waitUntil: 'networkidle' })
  await shot(page, 'plans')
} catch (error) {
  notes.error = error.message
  console.error(error)
  process.exitCode = 1
} finally {
  fs.writeFileSync(NOTES, JSON.stringify(notes, null, 2))
  await context.close().catch(() => {})
}
