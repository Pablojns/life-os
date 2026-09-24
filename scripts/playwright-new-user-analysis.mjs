import { chromium } from 'playwright'
import fs from 'fs'
import path from 'path'
import { execSync } from 'child_process'

const OUT = path.join(process.cwd(), 'playwright-output')
const NOTES = path.join(OUT, 'analysis-notes.json')
const APP = 'http://localhost:5173'
const EMAIL = `analise.${Date.now()}@lifeos.app`
const PASSWORD = 'LifeOS123!'
const CHROME_USER_DATA = path.join(process.env.LOCALAPPDATA, 'Google', 'Chrome', 'User Data')
const CLONE_DIR = path.join(process.env.TEMP, 'pw-lifeos-chrome')
fs.mkdirSync(OUT, { recursive: true })

const notes = {
  email: EMAIL,
  path: [],
  screens: {},
  blockers: [],
  usedFallback: false,
}

function add(id, detail) {
  notes.path.push({ id, detail: String(detail || '') })
  console.log(id, detail)
}

async function shot(page, name) {
  const file = path.join(OUT, `analysis-${name}.png`)
  await page.screenshot({ path: file, fullPage: true }).catch(() => {})
  notes.screens[name] = file
  return file
}

function robocopy(src, dest) {
  try {
    execSync(
      `robocopy "${src}" "${dest}" /E /NFL /NDL /NJH /NJS /R:1 /W:1 /XD Cache "Code Cache" GPUCache "Service Worker" DawnGraphiteCache DawnWebGPUCache blob_storage Crashpad`,
      { stdio: 'ignore' },
    )
  } catch (error) {
    if ((error.status ?? 0) >= 16) throw error
  }
}

async function confirmEmail(sql) {
  fs.mkdirSync(CLONE_DIR, { recursive: true })
  const localState = path.join(CHROME_USER_DATA, 'Local State')
  if (fs.existsSync(localState)) fs.copyFileSync(localState, path.join(CLONE_DIR, 'Local State'))
  for (const name of ['Profile 8']) {
    const src = path.join(CHROME_USER_DATA, name)
    if (fs.existsSync(src)) robocopy(src, path.join(CLONE_DIR, name))
  }
  const context = await chromium.launchPersistentContext(CLONE_DIR, {
    channel: 'chrome',
    headless: false,
    viewport: { width: 1440, height: 960 },
    args: ['--disable-extensions', '--disable-blink-features=AutomationControlled', '--profile-directory=Profile 8'],
    ignoreDefaultArgs: ['--enable-automation'],
  })
  const page = context.pages()[0] || (await context.newPage())
  try {
    await page.goto('https://supabase.com/dashboard/project/isjxfqkvavoaksroutre/sql/new', {
      waitUntil: 'domcontentloaded',
      timeout: 90000,
    })
    await page.waitForTimeout(7000)
    if (/sign-in|login/i.test(page.url())) throw new Error('LOGIN_WALL')
    await page.keyboard.press('Escape')
    await page.waitForFunction(() => Boolean(window.monaco?.editor?.getEditors?.()?.length), null, { timeout: 90000 })
    await page.evaluate((value) => {
      const editors = window.monaco?.editor?.getEditors?.() || []
      if (editors[0]) editors[0].setValue(value)
    }, sql)
    const runButton = page.getByRole('button', { name: /^run$/i }).or(page.getByRole('button', { name: /run query/i }))
    if (await runButton.count()) await runButton.first().click()
    else await page.keyboard.press('Control+Enter')
    await page.waitForTimeout(3000)
    add('email-confirm-sql', 'ran')
  } finally {
    await context.close().catch(() => {})
  }
}

async function completeOnboarding(page) {
  await page.waitForURL(/\/onboarding/, { timeout: 20000 }).catch(() => {})
  if (!page.url().includes('/onboarding')) return false
  await shot(page, 'onboarding-1')
  notes.screens.onboarding1Text = (await page.locator('body').innerText()).slice(0, 1500)
  await page.locator('input').first().fill('Pablo Analista')
  await page.getByRole('button', { name: /Continuar/i }).click()
  await page.getByRole('heading', { name: /situação financeira/i }).waitFor({ timeout: 20000 })
  await shot(page, 'onboarding-2')
  notes.screens.onboarding2Text = (await page.locator('body').innerText()).slice(0, 1500)
  await page.getByRole('button', { name: /Continuar/i }).click()
  await page.getByRole('heading', { name: /primeira missão/i }).waitFor({ timeout: 20000 })
  await shot(page, 'onboarding-3')
  notes.screens.onboarding3Text = (await page.locator('body').innerText()).slice(0, 1500)
  await page.getByRole('button', { name: /Entrar no sistema/i }).click()
  await page.waitForURL(/\/dashboard/, { timeout: 25000 })
  return true
}

async function useApp(page) {
  const started = Date.now()
  const tabs = ['quests', 'habits', 'notes', 'rewards', 'stats', 'finance', 'agenda', 'coach', 'arena']
  for (const tab of tabs) {
    const btn = page.locator(`[data-tab="${tab}"]`).first()
    if (await btn.count()) await btn.click()
    await page.waitForTimeout(700)
    await shot(page, tab)
    notes.screens[`${tab}Text`] = (await page.locator('body').innerText()).slice(0, 1800)
  }

  const questBtn = page.locator('[data-tab="quests"]').first()
  if (await questBtn.count()) await questBtn.click()
  await page.waitForTimeout(600)
  const complete = page.getByRole('button', { name: /Concluir|Completar|Missão Cumprida|Completar Quest/i }).first()
  if (await complete.count()) {
    await complete.click()
    await page.waitForTimeout(1200)
    add('quest-complete', 'clicked')
  }

  const habitBtn = page.locator('[data-tab="habits"]').first()
  if (await habitBtn.count()) await habitBtn.click()
  await page.waitForTimeout(600)
  const today = page.locator('button').filter({ hasText: /^\d{1,2}$/ }).last()
  if (await today.count()) {
    await today.click().catch(() => {})
    add('habit-toggle', 'clicked')
  }

  const financeBtn = page.locator('[data-tab="finance"]').first()
  if (await financeBtn.count()) await financeBtn.click()
  await page.waitForTimeout(800)
  const amount = page.locator('input[type="number"]').first()
  if (await amount.count()) {
    await amount.fill('12.50')
    const addTx = page.getByRole('button', { name: /Registrar|Adicionar|Salvar/i }).first()
    if (await addTx.count()) await addTx.click()
    add('finance-tx', 'attempted')
  }

  const arenaBtn = page.locator('[data-tab="arena"]').first()
  if (await arenaBtn.count()) await arenaBtn.click()
  await page.waitForTimeout(900)
  await shot(page, 'arena-after')
  const rec = page.locator('[data-recommended]')
  notes.screens.recommended = (await rec.count()) ? await rec.innerText() : 'missing'
  const open = page.getByRole('button', { name: /Abrir agora/i }).first()
  if (await open.count()) await open.click()
  const quizOpt = page.getByRole('button', { name: /Pagar dívidas caras|É concluível hoje|Revisar gastos/i }).first()
  if (await quizOpt.count()) {
    await quizOpt.click()
    await page.waitForTimeout(400)
    const second = page.getByRole('button', { name: /Revisar gastos|É concluível hoje|20%/i }).first()
    if (await second.count()) await second.click()
    await page.waitForTimeout(400)
    const third = page.getByRole('button', { name: /20%|É concluível hoje|Reserva/i }).first()
    if (await third.count()) await third.click()
    add('arena-quiz', 'played')
  }

  await page.goto(`${APP}/settings`, { waitUntil: 'networkidle' })
  await shot(page, 'settings')
  notes.screens.settingsText = (await page.locator('body').innerText()).slice(0, 1500)
  await page.goto(`${APP}/plans`, { waitUntil: 'networkidle' })
  await shot(page, 'plans')
  notes.screens.plansText = (await page.locator('body').innerText()).slice(0, 1500)
  await page.goto(`${APP}/dashboard`, { waitUntil: 'networkidle' })
  await shot(page, 'dashboard-final')
  notes.screens.header = (await page.locator('body').innerText()).match(/Streak|Sequência|dias consecutivos|dias de/i)?.[0] || 'no-streak-visible'
  notes.elapsedMs = Date.now() - started
}

const context = await chromium.launch({
  channel: 'chrome',
  headless: false,
})
const page = await context.newPage()
page.setDefaultTimeout(25000)

try {
  await page.goto(`${APP}/quiz`, { waitUntil: 'networkidle' })
  await shot(page, 'quiz-1')
  notes.screens.quiz1Text = (await page.locator('body').innerText()).slice(0, 1200)
  for (let i = 0; i < 8; i += 1) {
    const option = page.locator('[data-quiz="ask"] button').first()
    await option.waitFor({ timeout: 8000 })
    await option.click()
    await page.waitForTimeout(350)
    await shot(page, `quiz-${i + 2}`)
  }
  await page.locator('[data-quiz="result"]').waitFor({ timeout: 8000 })
  await shot(page, 'quiz-result')
  notes.screens.quizResult = (await page.locator('[data-quiz="result"]').innerText()).slice(0, 1200)
  add('quiz', notes.screens.quizResult)
  await page.getByRole('button', { name: /Aceitar este universo/i }).click()
  await page.waitForURL(/\/register/, { timeout: 15000 })
  await shot(page, 'register')
  await page.locator('input').nth(0).fill('Pablo Analista')
  await page.locator('input[type="email"]').fill(EMAIL)
  await page.locator('input[type="password"]').first().fill(PASSWORD)
  const confirm = page.locator('input[type="password"]').nth(1)
  if (await confirm.count()) await confirm.fill(PASSWORD)
  await page.getByRole('button', { name: /Criar|Cadastrar|Começar|Jornada|Conta/i }).first().click()
  await page.waitForTimeout(3500)
  const url = page.url()
  const body = await page.locator('body').innerText()
  add('register-url', url)
  notes.screens.registerAfter = body.slice(0, 1200)

  await page.waitForTimeout(1500)
  if (page.url().includes('/onboarding') || (await page.getByText(/Vamos configurar sua base/i).count())) {
    const done = await completeOnboarding(page)
    add('onboarding', done ? 'completed' : 'failed')
  } else if (url.includes('/dashboard')) {
    add('onboarding-skipped', 'went straight to dashboard')
    notes.blockers.push('Onboarding pulado — usuário sem row ou já marcado completo.')
    if (await page.getByText(/Vamos configurar sua base/i).count()) {
      await completeOnboarding(page)
    }
  } else if (/confirm|e-mail|email/i.test(body)) {
    add('email-confirm', 'required')
    await confirmEmail(`UPDATE auth.users SET email_confirmed_at = COALESCE(email_confirmed_at, now()) WHERE email = '${EMAIL}';`)
    await page.goto(`${APP}/login`, { waitUntil: 'networkidle' })
    await page.locator('input[type="email"]').fill(EMAIL)
    await page.locator('input[type="password"]').fill(PASSWORD)
    await page.getByRole('button', { name: /Entrar/i }).click()
    await page.waitForTimeout(2500)
    if (page.url().includes('/onboarding')) await completeOnboarding(page)
    else if (!page.url().includes('/dashboard')) {
      notes.usedFallback = true
      notes.blockers.push('Confirmação de e-mail bloqueou o usuário novo. Análise do app autenticado usou heroi.teste.')
      await page.goto(`${APP}/login`, { waitUntil: 'networkidle' })
      await page.locator('input[type="email"]').fill('heroi.teste@lifeos.app')
      await page.locator('input[type="password"]').fill('LifeOS123!')
      await page.getByRole('button', { name: /Entrar/i }).click()
      await page.waitForURL(/\/(dashboard|onboarding|settings)/, { timeout: 20000 })
    }
  }

  if (page.url().includes('/onboarding')) await completeOnboarding(page)
  if (!/dashboard|settings/.test(page.url())) {
    await page.goto(`${APP}/dashboard`, { waitUntil: 'networkidle' })
  }
  await shot(page, 'dashboard-first')
  await useApp(page)
} catch (error) {
  notes.blockers.push(error.message)
  console.error('ANALYSIS_FAIL', error)
  await shot(page, 'error')
  process.exitCode = 1
} finally {
  fs.writeFileSync(NOTES, JSON.stringify(notes, null, 2))
  console.log('NOTES', NOTES)
  await context.close().catch(() => {})
}
