import { chromium } from 'playwright'
import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import path from 'path'

const OUT = path.join(process.cwd(), 'playwright-output')
fs.mkdirSync(OUT, { recursive: true })

const EMAIL = 'heroi.teste@lifeos.app'
const PASSWORD = 'LifeOS123!'
const APP = 'http://localhost:5173'
const SUPABASE_URL = 'https://isjxfqkvavoaksroutre.supabase.co'
const SUPABASE_KEY = 'sb_publishable_6K-0CffRhhuPUfvPoGsARw_oTu31N__'

async function shot(page, name) {
  const file = path.join(OUT, `${name}.png`)
  await page.screenshot({ path: file, fullPage: false })
  console.log('screenshot', file)
}

const browser = await chromium.launch({ headless: true, channel: 'chrome' })
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } })

try {
  await page.goto(`${APP}/login`, { waitUntil: 'networkidle' })
  if (!page.url().includes('/dashboard')) {
    await page.locator('input[type="email"]').fill(EMAIL)
    await page.locator('input[type="password"]').fill(PASSWORD)
    await page.getByRole('button', { name: /Entrar na Jornada/i }).click()
    await page.waitForURL(/\/(dashboard|settings)/, { timeout: 20000 })
  }

  await page.goto(`${APP}/dashboard`, { waitUntil: 'networkidle' })
  await page.locator('[data-chat-assistant]').waitFor({ timeout: 15000 })
  await page.locator('[data-chat-assistant] button[aria-label="Abrir assistente"]').click()
  await page.getByRole('region', { name: 'Assistente' }).waitFor()
  await shot(page, 'feature-chat-open')

  const marker = `almoço teste ${Date.now()}`
  await page.locator('[data-chat-assistant] input').fill(`gastei 30 reais no ${marker}`)
  await page.locator('[data-chat-assistant] button[type="submit"]').click()
  await page.waitForTimeout(8000)
  const pix = page.getByRole('button', { name: /Pix/i })
  if (await pix.count()) await pix.first().click()
  await page.waitForTimeout(4000)
  await shot(page, 'feature-chat-conversation')

  await page.locator('[data-chat-assistant] input').fill('agendar reunião amanhã às 10h')
  await page.locator('[data-chat-assistant] button[type="submit"]').click()
  await page.waitForTimeout(8000)
  await shot(page, 'feature-chat-event')

  await page.getByRole('tab', { name: /Agenda/i }).or(page.getByRole('button', { name: /Agenda/i })).first().click()
  await page.waitForTimeout(800)
  await shot(page, 'feature-agenda-month')

  await page.getByRole('tab', { name: /Arena/i }).or(page.getByRole('button', { name: /Arena/i })).first().click()
  await page.waitForTimeout(600)
  await shot(page, 'feature-arena-battle')
  await page.getByRole('button', { name: 'Clicker' }).click()
  await page.waitForTimeout(400)
  await shot(page, 'feature-arena-clicker')
  await page.getByRole('button', { name: 'Quiz' }).click()
  await page.waitForTimeout(400)
  await shot(page, 'feature-arena-quiz')

  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)
  const { data: auth } = await supabase.auth.signInWithPassword({ email: EMAIL, password: PASSWORD })
  const { data: txs } = await supabase
    .from('transactions')
    .select('id, amount, description, category, payment_method')
    .eq('user_id', auth.user.id)
    .or(`description.ilike.%${marker}%,description.ilike.%almoço%`)
    .eq('amount', 30)
    .limit(3)
  const { data: events } = await supabase
    .from('scheduled_events')
    .select('id, title, event_datetime')
    .eq('user_id', auth.user.id)
    .ilike('title', '%reunião%')
    .order('created_at', { ascending: false })
    .limit(3)
  await supabase.auth.signOut()

  const report = { txs: txs || [], events: events || [] }
  fs.writeFileSync(path.join(OUT, 'daily-features-report.json'), JSON.stringify(report, null, 2))
  console.log('TXS', JSON.stringify(txs))
  console.log('EVENTS', JSON.stringify(events))
  if (!txs?.length) throw new Error('Transação do chat não encontrada')
  if (!events?.length) throw new Error('Evento do chat não encontrado')
  console.log('DAILY_FEATURES_OK')
} catch (error) {
  await shot(page, 'feature-error').catch(() => {})
  console.error('DAILY_FEATURES_FAIL', error)
  process.exitCode = 1
} finally {
  await browser.close()
}
