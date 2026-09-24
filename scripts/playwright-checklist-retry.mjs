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
const EVENT_FOR = { skyrim: 'dragon', naruto: 'itachi', solo: 'boss', clean: 'meteors' }

const report = []
function add(id, ok, detail) {
  report.push({ id, ok, detail: String(detail || '') })
  console.log(`${ok ? 'PASSOU' : 'FALHOU'} ${id} — ${detail}`)
}

async function shot(page, name) {
  const file = path.join(OUT, `${name}.png`)
  await page.screenshot({ path: file, fullPage: false })
  console.log('screenshot', file)
}

async function login(page) {
  await page.goto(`${APP}/login`, { waitUntil: 'networkidle' })
  if (page.url().includes('/dashboard')) return
  await page.locator('input[type="email"]').fill(EMAIL)
  await page.locator('input[type="password"]').fill(PASSWORD)
  await page.getByRole('button', { name: /Entrar na Jornada/i }).click()
  await page.waitForURL(/\/(dashboard|settings)/, { timeout: 20000 })
}

async function setTheme(page, theme) {
  await page.goto(`${APP}/settings`, { waitUntil: 'networkidle' })
  await page.locator(`[data-theme-name="${theme}"]`).click()
  await page.waitForFunction((name) => document.documentElement.getAttribute('data-theme') === name, theme, { timeout: 8000 })
}

async function sendChat(page, text) {
  const region = page.getByRole('region', { name: 'Assistente' })
  if (!(await region.count())) {
    await page.locator('[data-chat-assistant] button[aria-label="Abrir assistente"]').click()
  }
  await region.waitFor()
  await page.locator('[data-chat-assistant] input').fill(text)
  await page.locator('[data-chat-assistant] button[type="submit"]').click()
  await page.locator('[data-chat-assistant]').getByText('digitando...').waitFor({ timeout: 8000 }).catch(() => {})
  await page.locator('[data-chat-assistant]').getByText('digitando...').waitFor({ state: 'hidden', timeout: 30000 })
  await page.waitForTimeout(600)
}

const browser = await chromium.launch({ headless: true, channel: 'chrome' })
const context = await browser.newContext({
  viewport: { width: 1280, height: 900 },
  locale: 'pt-BR',
  geolocation: { latitude: -23.3045, longitude: -51.1696 },
  permissions: ['geolocation'],
})
const page = await context.newPage()

try {
  await login(page)

  for (const theme of Object.keys(EVENT_FOR)) {
    await setTheme(page, theme)
    await page.goto(`${APP}/dashboard?event=off`, { waitUntil: 'networkidle' })
    await page.waitForFunction(() => Boolean(window.__LIFEOS_WORLD), { timeout: 8000 })
    await page.evaluate((pair) => window.__LIFEOS_WORLD.triggerEvent(pair.theme, pair.event), {
      theme,
      event: EVENT_FOR[theme],
    })
    await page.waitForTimeout(700)
    const visible = await page.locator(`[data-random-event="${EVENT_FOR[theme]}"]`).count()
    add(`retry-evento-${theme}`, visible > 0, `evento ${EVENT_FOR[theme]} em ${page.url()}`)
    await shot(page, `check-01-event-${theme}`)
  }

  await setTheme(page, 'skyrim')
  await page.goto(`${APP}/dashboard`, { waitUntil: 'networkidle' })
  await sendChat(page, 'gastei 35 reais no almoço')
  const asked = /pix|cartão|cartao|dinheiro/i.test(await page.getByRole('region', { name: 'Assistente' }).innerText())
  add('retry-chat-metodo', asked, 'perguntou método')
  await shot(page, 'check-02-chat-metodo')
  if (await page.getByRole('button', { name: /Pix/i }).count()) {
    await page.getByRole('button', { name: /Pix/i }).first().click()
    await page.waitForTimeout(1500)
  } else {
    await sendChat(page, 'pix')
  }
  const afterPay = await page.getByRole('region', { name: 'Assistente' }).innerText()
  add('retry-chat-tx', /✓ Transação registrada|Transação registrada/i.test(afterPay), afterPay.slice(-200))
  await shot(page, 'check-02-chat-transacao')

  await sendChat(page, 'agendar reunião de trabalho amanhã às 10h')
  const afterEvent = await page.getByRole('region', { name: 'Assistente' }).innerText()
  add('retry-chat-evento', /✓ Evento agendado|Evento agendado|reunião/i.test(afterEvent), afterEvent.slice(-200))
  await shot(page, 'check-02-chat-evento')

  await sendChat(page, 'como tá meu financeiro?')
  const afterSum = await page.getByRole('region', { name: 'Assistente' }).innerText()
  add('retry-chat-resumo', /Missões ativas|Gastos do mês|R\$/i.test(afterSum), afterSum.slice(-240))
  await shot(page, 'check-02-chat-resumo')

  await sendChat(page, 'cria missão treinar academia com 15 XP')
  const afterQuest = await page.getByRole('region', { name: 'Assistente' }).innerText()
  add('retry-chat-missao-ui', /✓ Missão criada|Missão criada|academia/i.test(afterQuest), afterQuest.slice(-220))
  await shot(page, 'check-02-chat-missao')

  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)
  const { data: auth } = await supabase.auth.signInWithPassword({ email: EMAIL, password: PASSWORD })
  const { data: quests } = await supabase
    .from('quests')
    .select('*')
    .eq('user_id', auth.user.id)
    .or('title.ilike.%academia%,title.ilike.%treinar%')
    .order('created_at', { ascending: false })
    .limit(3)
  add('retry-supabase-quest', Boolean(quests?.length), JSON.stringify(quests || []))
  await supabase.auth.signOut()
} catch (error) {
  await shot(page, 'check-retry-error').catch(() => {})
  add('retry-runner', false, error.message)
  console.error(error)
} finally {
  await browser.close()
}

fs.writeFileSync(path.join(OUT, 'checklist-retry.json'), JSON.stringify(report, null, 2))
console.log(`RETRY ${report.filter((i) => i.ok).length}/${report.length}`)
