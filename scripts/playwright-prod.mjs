import { chromium } from 'playwright'
import fs from 'fs'
import path from 'path'

const APP = process.env.APP_URL
if (!APP) {
  console.error('APP_URL is required')
  process.exit(1)
}

const OUT = path.join(process.cwd(), 'playwright-output')
fs.mkdirSync(OUT, { recursive: true })

const email = `prod.${Date.now()}@lifeos.app`
const password = 'LifeOS123!'
const name = 'Heroi Producao'

const browser = await chromium.launch({ headless: true })
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } })
page.setDefaultTimeout(45000)

async function shot(name) {
  const file = path.join(OUT, `${name}.png`)
  await page.screenshot({ path: file, fullPage: true })
  console.log('screenshot ' + file)
}

try {
  await page.goto(APP, { waitUntil: 'networkidle' })
  await page.getByRole('heading', { name: /Transforme sua rotina/i }).waitFor()
  await shot('prod-landing')
  console.log('LANDING_OK')

  await page.getByRole('link', { name: 'Começar grátis' }).first().click()
  await page.getByLabel('Nome').fill(name)
  await page.getByLabel('E-mail').fill(email)
  await page.locator('input[type="password"]').nth(0).fill(password)
  await page.locator('input[type="password"]').nth(1).fill(password)
  await page.getByRole('button', { name: /Começar a Jornada|Forjando/i }).click()

  const dashboard = page.getByRole('heading', { name: /Diário|Missões|Life OS/i }).first()
  const confirmMsg = page.getByText(/Confirme o e-mail|Conta criada/i)
  await Promise.race([
    dashboard.waitFor({ timeout: 20000 }),
    confirmMsg.waitFor({ timeout: 20000 }),
  ])

  if (await confirmMsg.count()) {
    console.log('SIGNUP_NEEDS_EMAIL_CONFIRM')
    await page.goto(APP.replace(/\/$/, '') + '/login')
    await page.getByLabel('E-mail').fill('heroi.teste@lifeos.app')
    await page.locator('input[type="password"]').fill(password)
    await page.getByRole('button', { name: /Entrar/i }).click()
  }

  await page.waitForURL(/dashboard/, { timeout: 25000 })
  const theme = await page.locator('html').getAttribute('data-theme')
  console.log('THEME=' + theme)
  await shot('prod-dashboard')

  const title = page.getByLabel(/título|titulo|missão/i).first()
  if (await title.count()) {
    await title.fill('Missão produção')
    const add = page.getByRole('button', { name: /Adicionar|Criar|Nova/i }).first()
    if (await add.count()) await add.click()
    const complete = page.getByRole('button', { name: /Concluir|Completar/i }).first()
    if (await complete.count()) await complete.click()
    console.log('QUEST_FLOW_TRIED')
  }

  console.log('PROD_TEST_DONE email=' + email)
} catch (error) {
  await shot('prod-error')
  console.error(error)
  process.exitCode = 1
} finally {
  await browser.close()
}
