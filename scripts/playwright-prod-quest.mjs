import { chromium } from 'playwright'
import fs from 'fs'
import path from 'path'

const APP = 'https://pablojns.github.io/life-os'
const OUT = path.join(process.cwd(), 'playwright-output')
fs.mkdirSync(OUT, { recursive: true })

const browser = await chromium.launch({ headless: true })
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } })
page.setDefaultTimeout(45000)

try {
  await page.goto(APP + '/login', { waitUntil: 'networkidle' })
  await page.getByLabel('E-mail').fill('heroi.teste@lifeos.app')
  await page.locator('input[type="password"]').fill('LifeOS123!')
  await page.getByRole('button', { name: 'Entrar na Jornada' }).click()
  await page.waitForURL(/dashboard/, { timeout: 25000 })
  await page.waitForTimeout(1500)

  const add = page.getByRole('button', { name: /\+ Nova Missão|\+ Nova tarefa/i })
  await add.click()
  const title = page.getByRole('textbox', { name: 'Título' })
  await title.waitFor()
  await title.fill('Missão produção')
  await page.getByRole('button', { name: 'Registrar' }).click()
  await page.getByRole('heading', { name: 'Missão produção' }).waitFor({ timeout: 20000 })

  const before = await page.locator('body').innerText()
  await page.getByRole('button', { name: /Completar|Concluir/i }).first().click()
  await page.getByText(/\+10 XP|Missão concluída/i).waitFor({ timeout: 10000 })
  await page.waitForTimeout(800)
  const after = await page.locator('body').innerText()
  console.log('THEME=' + (await page.locator('html').getAttribute('data-theme')))
  console.log('XP_BEFORE_HAS_0=' + /0\s*\/\s*100/.test(before))
  console.log('XP_AFTER=' + (after.match(/\d+\s*\/\s*\d+/) || ['?'])[0])
  await page.screenshot({ path: path.join(OUT, 'prod-dashboard-xp.png'), fullPage: true })
  console.log('QUEST_XP_OK')
} catch (error) {
  await page.screenshot({ path: path.join(OUT, 'prod-quest-error.png'), fullPage: true }).catch(() => {})
  console.error(error)
  process.exitCode = 1
} finally {
  await browser.close()
}
