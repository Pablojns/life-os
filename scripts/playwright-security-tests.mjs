import { chromium } from 'playwright'
import fs from 'fs'
import path from 'path'

const APP = process.env.APP_URL || 'http://localhost:5173'
const FN = process.env.AI_COACH_URL || `${APP.replace(/\/$/, '')}/api/ai-coach`
const OUT = path.join(process.cwd(), 'playwright-output')
fs.mkdirSync(OUT, { recursive: true })

const results = []
function log(message) {
  console.log(message)
  results.push(message)
}

const browser = await chromium.launch({ headless: true })
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } })
page.setDefaultTimeout(30000)

try {
  const unauth = await fetch(FN, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ analysisType: 'weekly' }),
  })
  const unauthBody = await unauth.text()
  log(`AI_COACH_NO_TOKEN status=${unauth.status} body=${unauthBody.slice(0, 180)}`)
  if (unauth.status !== 401) throw new Error('expected 401 without token')

  const headersRes = await fetch(APP + '/login')
  const headerNames = [...headersRes.headers.keys()].join(',')
  const needed = ['x-content-type-options', 'x-frame-options', 'referrer-policy']
  const present = needed.filter((name) => headersRes.headers.get(name))
  log(`SECURITY_HEADERS present=${present.join(',')} all=${headerNames}`)
  if (present.length < needed.length) throw new Error('missing security headers')

  await page.addInitScript(() => {
    sessionStorage.setItem('lifeos-skip-auto-login', '1')
  })
  await page.goto(APP + '/login', { waitUntil: 'networkidle' })
  const probeEmail = `rate.${Date.now()}@lifeos.app`
  await page.getByLabel('E-mail').fill(probeEmail)
  await page.locator('input[type="password"]').fill('senha-errada')

  let blockedAt = 0
  for (let i = 1; i <= 6; i += 1) {
    await page.getByRole('button', { name: 'Entrar na Jornada' }).click()
    await page.waitForTimeout(700)
    const text = await page.locator('body').innerText()
    if (/Muitas tentativas/i.test(text)) {
      blockedAt = i
      break
    }
  }
  await page.screenshot({ path: path.join(OUT, 'security-rate-limit.png') })
  log(`RATE_LIMIT blockedAt=${blockedAt}`)
  if (!blockedAt) throw new Error('rate limit did not trigger')

  await page.goto(APP + '/login', { waitUntil: 'networkidle' })
  await page.getByLabel('E-mail').fill('heroi.teste@lifeos.app')
  await page.locator('input[type="password"]').fill('LifeOS123!')
  await page.getByRole('button', { name: 'Entrar na Jornada' }).click()
  await page.waitForURL(/dashboard/, { timeout: 25000 })

  await page.getByRole('button', { name: /\+ Nova Missão|\+ Nova tarefa/i }).click()
  await page.getByRole('textbox', { name: 'Título' }).fill("<script>alert('xss')</script>")
  await page.getByRole('button', { name: 'Registrar' }).click()
  await page.waitForTimeout(1500)
  const html = await page.content()
  const visible = await page.locator('body').innerText()
  const hasRawTag = html.includes('<script>alert(') && /<script>alert\('xss'\)<\/script>/.test(await page.locator('h3').allTextContents().then((t) => t.join('')))
  const savedClean = /scriptalert\('xss'\)\/script|alert\('xss'\)/.test(visible) && !visible.includes('<script>')
  await page.screenshot({ path: path.join(OUT, 'security-xss.png'), fullPage: true })
  log(`XSS rawTag=${hasRawTag} cleanVisible=${savedClean}`)
  if (visible.includes('<script>alert')) throw new Error('script tags persisted in UI')
  if (!savedClean) throw new Error('sanitized quest title not found')

  log('SECURITY_TESTS_OK')
} catch (error) {
  await page.screenshot({ path: path.join(OUT, 'security-tests-error.png'), fullPage: true }).catch(() => {})
  console.error('SECURITY_TESTS_FAIL', error.message)
  process.exitCode = 1
} finally {
  await browser.close()
}
