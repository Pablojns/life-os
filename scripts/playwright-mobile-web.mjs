import { chromium } from 'playwright'
import fs from 'fs'
import path from 'path'

const OUT = path.join(process.cwd(), 'playwright-output')
fs.mkdirSync(OUT, { recursive: true })
const APP = 'http://localhost:8081'
const EMAIL = 'heroi.teste@lifeos.app'
const PASSWORD = 'LifeOS123!'

async function shot(page, name) {
  const file = path.join(OUT, `${name}.png`)
  await page.screenshot({ path: file, fullPage: true })
  console.log('screenshot ' + file)
}

const browser = await chromium.launch({ headless: true, channel: 'chrome' })
const page = await browser.newPage({ viewport: { width: 390, height: 844 } })
page.setDefaultTimeout(45000)

try {
  await page.goto(APP, { waitUntil: 'domcontentloaded', timeout: 60000 })
  await page.waitForTimeout(4000)
  await shot(page, 'mobile-login')

  const email = page.getByLabel('E-mail')
  if (await email.count()) {
    await email.fill(EMAIL)
    await page.getByLabel('Senha').fill(PASSWORD)
    await page.getByLabel('Entrar', { exact: true }).click()
    await page.waitForTimeout(4000)
  }
  await shot(page, 'mobile-quests')

  const fab = page.getByLabel(/Nova Missão|Nova tarefa|Novo pergaminho|Nova quest/i)
  if (await fab.count()) {
    await fab.first().click()
    await page.waitForTimeout(500)
    await page.getByLabel('Título').fill('Missão mobile de teste')
    await page.getByLabel('Registrar').click()
    await page.waitForTimeout(2000)
  }
  await shot(page, 'mobile-quest-created')

  const complete = page.getByLabel(/Completar|Concluir|cumprida/i).first()
  if (await complete.count()) {
    await complete.click()
    await page.waitForTimeout(1500)
  }
  await shot(page, 'mobile-quest-done')

  for (const [label, name] of [
    ['Hábitos', 'mobile-habits'],
    ['Finanças', 'mobile-finance'],
    ['Recompensas', 'mobile-rewards'],
    ['Atributos', 'mobile-stats'],
  ]) {
    const tab = page.getByLabel(label).first()
    if (await tab.count()) await tab.click()
    await page.waitForTimeout(800)
    await shot(page, name)
  }
  console.log('MOBILE_WEB_OK')
} catch (error) {
  await shot(page, 'mobile-web-error')
  console.error('MOBILE_WEB_FAIL', error.message)
  process.exitCode = 1
} finally {
  await browser.close().catch(() => {})
}
