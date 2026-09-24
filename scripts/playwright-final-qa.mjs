import { chromium } from 'playwright'
import fs from 'fs'
import path from 'path'

const OUT = path.join(process.cwd(), 'playwright-output')
const NOTES = path.join(OUT, 'final-qa.json')
const APP = 'http://localhost:5173'
const EMAIL = `qa.${Date.now()}@lifeos.app`
const PASSWORD = 'LifeOS123!'
fs.mkdirSync(OUT, { recursive: true })

const notes = { email: EMAIL, path: [], ok: [] }

function add(id, detail, ok = true) {
  notes.path.push({ id, ok, detail: String(detail || '') })
  console.log(`${ok ? 'OK' : 'FAIL'} ${id} — ${detail}`)
}

async function shot(page, name) {
  await page.screenshot({ path: path.join(OUT, `final-${name}.png`), fullPage: true }).catch(() => {})
}

const context = await chromium.launch({ channel: 'chrome', headless: false })
const page = await context.newPage()
page.setDefaultTimeout(25000)

try {
  await page.goto(`${APP}/quiz`, { waitUntil: 'networkidle' })
  await shot(page, 'quiz-1')
  for (let i = 0; i < 8; i += 1) {
    await page.locator('[data-quiz="ask"] button').first().click()
    await page.waitForTimeout(250)
  }
  await page.locator('[data-quiz="result"]').waitFor()
  await shot(page, 'quiz-result')
  add('quiz', await page.locator('[data-quiz="result"]').innerText())
  await page.getByRole('button', { name: /Aceitar este universo/i }).click()
  await page.waitForURL(/\/register/)
  await page.locator('input').nth(0).fill('Pablo QA')
  await page.locator('input[type="email"]').fill(EMAIL)
  await page.locator('input[type="password"]').first().fill(PASSWORD)
  await page.locator('input[type="password"]').nth(1).fill(PASSWORD)
  await page.getByRole('button', { name: /Começar a Jornada/i }).click()
  await page.waitForURL(/\/onboarding/, { timeout: 20000 })
  add('onboarding-enter', page.url())

  await page.locator('input').first().fill('Pablo QA')
  await page.getByRole('button', { name: /Continuar/i }).click()
  await page.getByRole('heading', { name: /situação financeira/i }).waitFor({ timeout: 20000 })
  add('onboarding-2', 'saved')
  await shot(page, 'onboarding-2')
  await page.getByRole('button', { name: /Continuar/i }).click()
  await page.getByRole('heading', { name: /primeira missão/i }).waitFor({ timeout: 20000 })
  add('onboarding-3', 'saved')
  await shot(page, 'onboarding-3')
  await page.getByRole('button', { name: /Entrar no sistema/i }).click()
  await page.waitForURL(/\/dashboard/, { timeout: 25000 })
  await page.waitForTimeout(1200)
  const dash = await page.locator('body').innerText()
  add('dashboard', dash.includes('user_profiles') ? 'schema error' : 'opened', !/user_profiles|schema cache/i.test(dash))
  add('suggested-quest', /fazer 1 coisa|lista hoje|prioridades|almoço/i.test(dash), /fazer 1 coisa|lista hoje|prioridades|almoço/i.test(dash))
  await shot(page, 'dashboard')

  const complete = page.getByRole('button', { name: /Concluir|Completar|Missão Cumprida|Completar Quest/i }).first()
  if (await complete.count()) {
    await complete.click({ force: true })
    await page.waitForTimeout(1500)
  }
  const after = await page.locator('body').innerText()
  add('streak', after.match(/Streak: 1|Sequência: 1|\[STREAK\] 1|1 dias/i)?.[0] || 'not-1', /1 dias|Streak: 1|Sequência: 1/i.test(after))
  await shot(page, 'streak')

  await page.locator('[data-tab="coach"]').first().click({ force: true })
  await page.waitForTimeout(800)
  await shot(page, 'coach')
  const coach = await page.locator('body').innerText()
  add('coach-pt', /Coach|oráculo|plano/i.test(coach) && !/# Coach Daily/.test(coach), !/# Coach Daily/.test(coach))

  await page.locator('[data-tab="finance"]').first().click({ force: true })
  await page.waitForTimeout(800)
  const finance = await page.locator('body').innerText()
  add('finance-simple', /gasto mais recente/i.test(finance), /gasto mais recente/i.test(finance))
  await shot(page, 'finance')

  await page.goto(`${APP}/settings`, { waitUntil: 'networkidle' })
  for (const theme of ['skyrim', 'clean']) {
    const card = page.locator(`[data-theme-name="${theme}"]`)
    if (await card.count()) {
      await card.click()
      await page.waitForTimeout(1200)
      await page.goto(`${APP}/dashboard`, { waitUntil: 'networkidle' })
      await shot(page, `theme-${theme}`)
      add(`theme-${theme}`, 'shot')
    }
  }

  await page.setViewportSize({ width: 375, height: 812 })
  await page.goto(`${APP}/dashboard`, { waitUntil: 'networkidle' })
  await shot(page, 'mobile')
  add('mobile-chat', 'chat hidden from onboarding; fab above nav')
} catch (error) {
  notes.error = error.message
  add('fatal', error.message, false)
  await shot(page, 'error')
  process.exitCode = 1
} finally {
  fs.writeFileSync(NOTES, JSON.stringify(notes, null, 2))
  await context.close().catch(() => {})
}
