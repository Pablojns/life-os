import { chromium } from 'playwright'
import fs from 'fs'
import path from 'path'

const OUT = path.join(process.cwd(), 'playwright-output')
fs.mkdirSync(OUT, { recursive: true })
const APP = 'http://localhost:5173'
const EMAIL = 'heroi.teste@lifeos.app'
const PASSWORD = 'LifeOS123!'

async function shot(page, name) {
  const file = path.join(OUT, `${name}.png`)
  await page.screenshot({ path: file, fullPage: true })
  console.log('screenshot ' + file)
}

const browser = await chromium.launch({ headless: true, channel: 'chrome' })
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } })

try {
  await page.goto(`${APP}/login`, { waitUntil: 'networkidle' })
  if (!/dashboard|settings/.test(page.url())) {
    await page.locator('input[type="email"]').fill(EMAIL)
    await page.locator('input[type="password"]').fill(PASSWORD)
    await page.getByRole('button', { name: /entrar/i }).click()
    await page.waitForURL(/\/(dashboard|settings)/, { timeout: 25000 })
  }
  await page.goto(`${APP}/dashboard`, { waitUntil: 'networkidle' })
  await page.getByRole('tab', { name: /finanças/i }).click()
  await page.waitForTimeout(800)
  await shot(page, 'finance-overview')

  const body = await page.locator('body').innerText()
  console.log('SCORE', /Crítico|Atenção|Estável|Saudável|Excelente/.test(body))
  console.log('SUBNAVS', TABS_OK(body))

  for (const [id, name] of [
    ['accounts', 'finance-accounts'],
    ['budgets', 'finance-budgets'],
    ['debts', 'finance-debts'],
    ['recurring', 'finance-recurring'],
    ['calc', 'finance-calc'],
  ]) {
    await page.locator(`[data-finance-tab="${id}"]`).click()
    await page.waitForTimeout(400)
    await shot(page, name)
  }

  await page.locator('[data-finance-tab="accounts"]').click()
  if (await page.getByRole('button', { name: /\+ Nova conta/i }).count()) {
    await page.getByRole('button', { name: /\+ Nova conta/i }).click()
    await page.locator('label:has-text("Nome") input').fill('Carteira Heroi')
    await page.locator('label:has-text("Saldo atual") input').fill('1500')
    await page.getByRole('button', { name: /Criar conta/i }).click()
    await page.waitForTimeout(1200)
  }
  await shot(page, 'finance-accounts-created')

  await page.locator('[data-finance-tab="calc"]').click()
  await page.waitForTimeout(300)
  const calc = await page.locator('body').innerText()
  console.log('CALC', /Juros compostos|Reserva de emergência|Independência/.test(calc))
  console.log('FINANCE_OK')
} catch (error) {
  await shot(page, 'finance-module-error')
  console.error('FINANCE_FAIL', error.message)
  process.exitCode = 1
} finally {
  await browser.close().catch(() => {})
}

function TABS_OK(text) {
  return ['Visão Geral', 'Contas', 'Orçamento', 'Dívidas', 'Recorrentes', 'Calculadoras'].every((label) => text.includes(label))
}
