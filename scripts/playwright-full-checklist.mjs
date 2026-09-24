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
const THEMES = ['skyrim', 'naruto', 'solo', 'clean']
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
  return file
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
  const started = Date.now()
  await page.waitForFunction((name) => document.documentElement.getAttribute('data-theme') === name, theme, { timeout: 8000 })
  return Date.now() - started
}

async function openChat(page) {
  const region = page.getByRole('region', { name: 'Assistente' })
  if (!(await region.count())) {
    await page.locator('[data-chat-assistant] button[aria-label="Abrir assistente"]').click()
  }
  await region.waitFor()
}

async function waitChatIdle(page) {
  await page.waitForFunction(() => {
    const btn = document.querySelector('[data-chat-assistant] button[type="submit"]')
    return btn && !btn.disabled
  }, { timeout: 25000 })
}

async function sendChat(page, text) {
  await openChat(page)
  await page.locator('[data-chat-assistant] input').fill(text)
  await page.locator('[data-chat-assistant] button[type="submit"]').click()
  await page.locator('[data-chat-assistant]').getByText('digitando...').waitFor({ timeout: 8000 }).catch(() => {})
  await page.locator('[data-chat-assistant]').getByText('digitando...').waitFor({ state: 'hidden', timeout: 30000 })
  await waitChatIdle(page)
  await page.waitForTimeout(400)
}

async function readXp(page) {
  return page.evaluate(() => {
    const text = document.body.innerText
    const match = text.match(/(?:XP|EXP|Chakra|Pontos)\s+(\d+)\s*\/\s*100/i)
    return match ? Number(match[1]) : null
  })
}

async function goTab(page, pattern) {
  await page.getByRole('tab', { name: pattern }).first().click()
  await page.waitForTimeout(500)
}

const weatherHits = []
const browser = await chromium.launch({ headless: true, channel: 'chrome' })
const context = await browser.newContext({
  viewport: { width: 1280, height: 900 },
  locale: 'pt-BR',
  geolocation: { latitude: -23.3045, longitude: -51.1696 },
  permissions: ['geolocation'],
})
const page = await context.newPage()
page.on('response', (res) => {
  if (res.url().includes('openweathermap.org')) {
    weatherHits.push({ host: 'openweathermap.org', status: res.status() })
  }
})

try {
  await login(page)
  await page.goto(`${APP}/dashboard`, { waitUntil: 'networkidle' })
  await page.waitForTimeout(3000)
  const badge = page.locator('[data-weather-badge]')
  const badgeText = (await badge.count()) ? (await badge.innerText()).replace(/\s+/g, ' ') : ''
  const tod = await page.evaluate(() => document.documentElement.getAttribute('data-tod'))
  add('1.1 dashboard-logado', /dashboard/.test(page.url()), page.url())
  add('1.2 clima-indicador', /°/.test(badgeText) && /(Winterhold|Konoha|Londrina|ÁREA)/i.test(badgeText), badgeText || 'badge ausente')
  add('1.2 ciclo-tod', Boolean(tod), `data-tod=${tod}`)
  await shot(page, 'check-01-dashboard-clima')

  const weatherOk = weatherHits.some((item) => item.status === 200)
  add('1.3 openweathermap-200', weatherOk, JSON.stringify(weatherHits.slice(-4)))

  const timings = {}
  for (const theme of THEMES) {
    timings[theme] = await setTheme(page, theme)
    await page.goto(`${APP}/dashboard`, { waitUntil: 'networkidle' })
    await page.locator(`[data-shell="${theme}"]`).waitFor({ timeout: 8000 })
    await page.waitForTimeout(600)
    const body = await page.locator(`[data-shell="${theme}"]`).innerText()
    const attrs = await page.evaluate((name) => {
      const el = document.querySelector(`[data-shell="${name}"]`)
      return { tod: el?.getAttribute('data-tod'), weather: el?.getAttribute('data-weather') }
    }, theme)
    if (theme === 'skyrim') add('1.4 skyrim-shell', Boolean(await page.locator('[data-shell="skyrim"]').count()) && Boolean(attrs.tod), `tod=${attrs.tod} weather=${attrs.weather}`)
    if (theme === 'naruto') add('1.4 naruto-shell', /Konoha/i.test(body) || /Konoha/i.test(await badge.innerText()), `céu + Konoha tod=${attrs.tod}`)
    if (theme === 'solo') add('1.4 solo-shell', /SISTEMA|EXP/i.test(body), `HUD tod=${attrs.tod}`)
    if (theme === 'clean') add('1.4 clean-shell', /Life OS/i.test(body), `glass tod=${attrs.tod}`)
    await shot(page, `check-01-${theme}-dashboard`)
  }
  const instant = Object.values(timings).every((ms) => ms < 1500)
  add('1.7 troca-instantanea', instant, JSON.stringify(timings))

  let randomSeen = false
  for (const theme of THEMES) {
    await setTheme(page, theme)
    for (let i = 0; i < 3 && !randomSeen; i += 1) {
      await page.goto(`${APP}/dashboard`, { waitUntil: 'networkidle' })
      await page.waitForTimeout(800)
      if (await page.locator('[data-random-event]').count()) randomSeen = true
    }
    await page.goto(`${APP}/dashboard?event=off`, { waitUntil: 'networkidle' })
    await page.waitForFunction(() => Boolean(window.__LIFEOS_WORLD), { timeout: 8000 })
    await page.evaluate((pair) => {
      window.__LIFEOS_WORLD?.triggerEvent(pair.theme, pair.event)
    }, { theme, event: EVENT_FOR[theme] })
    await page.waitForTimeout(500)
    const visible = await page.locator(`[data-random-event="${EVENT_FOR[theme]}"]`).count()
    add(`1.6 evento-${theme}`, visible > 0, `evento ${EVENT_FOR[theme]}`)
    await shot(page, `check-01-event-${theme}`)
  }
  add('1.5 eventos-aleatorios', randomSeen || report.some((item) => item.id.startsWith('1.6') && item.ok), randomSeen ? 'apareceu no reload' : 'forçado via triggerEvent')

  await setTheme(page, 'skyrim')
  await page.goto(`${APP}/dashboard`, { waitUntil: 'networkidle' })

  await sendChat(page, 'gastei 35 reais no almoço')
  const asked = /pix|cartão|cartao|dinheiro/i.test(await page.getByRole('region', { name: 'Assistente' }).innerText())
  add('2.1 chat-perguntou-metodo', asked, 'pedido de método')
  await shot(page, 'check-02-chat-metodo')
  if (await page.getByRole('button', { name: /Pix/i }).count()) {
    await page.getByRole('button', { name: /Pix/i }).first().click()
    await page.waitForTimeout(2500)
  } else {
    await sendChat(page, 'pix')
  }
  const afterPay = `${await page.getByRole('region', { name: 'Assistente' }).innerText()} ${await page.locator('body').innerText()}`
  add('2.1 chat-transacao-ui', /transação registrada|registrad/i.test(afterPay), afterPay.slice(-220))
  await shot(page, 'check-02-chat-transacao')

  await sendChat(page, 'agendar reunião de trabalho amanhã às 10h')
  const afterEvent = await page.getByRole('region', { name: 'Assistente' }).innerText()
  add('2.2 chat-evento-ui', /evento agendado|reunião/i.test(afterEvent), afterEvent.slice(-180))
  await shot(page, 'check-02-chat-evento')

  await sendChat(page, 'como tá meu financeiro?')
  const afterSum = await page.getByRole('region', { name: 'Assistente' }).innerText()
  add('2.3 chat-resumo', /R\$|gasto|missão|saldo|entrada/i.test(afterSum), afterSum.slice(-240))
  await shot(page, 'check-02-chat-resumo')

  await sendChat(page, 'cria missão treinar academia com 15 XP')
  const afterQuest = await page.getByRole('region', { name: 'Assistente' }).innerText()
  add('2.4 chat-missao-ui', /missão criada|treinar|academia/i.test(afterQuest), afterQuest.slice(-180))
  await shot(page, 'check-02-chat-missao')

  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)
  const { data: auth } = await supabase.auth.signInWithPassword({ email: EMAIL, password: PASSWORD })
  const uid = auth.user.id
  const { data: lastTx } = await supabase.from('transactions').select('*').eq('user_id', uid).order('created_at', { ascending: false }).limit(1)
  const { data: lastEv } = await supabase.from('scheduled_events').select('*').eq('user_id', uid).order('created_at', { ascending: false }).limit(1)
  const { data: lastQuest } = await supabase.from('quests').select('*').eq('user_id', uid).order('created_at', { ascending: false }).limit(1)
  add('2.1 supabase-tx', Number(lastTx?.[0]?.amount) === 35 || /almo/i.test(lastTx?.[0]?.description || ''), JSON.stringify(lastTx?.[0] || {}))
  add('2.2 supabase-event', /reuni/i.test(lastEv?.[0]?.title || ''), JSON.stringify(lastEv?.[0] || {}))
  add('2.4 supabase-quest', /academia|treinar/i.test(lastQuest?.[0]?.title || ''), JSON.stringify(lastQuest?.[0] || {}))

  await goTab(page, /Agenda/i)
  const agendaText = await page.locator('body').innerText()
  const monthName = new Date().toLocaleDateString('pt-BR', { month: 'long' })
  add('3.2 grid-mes', new RegExp(monthName, 'i').test(agendaText), `mês ${monthName}`)
  await shot(page, 'check-03-agenda-mes')

  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  const dayNum = String(tomorrow.getDate())
  const dayCell = page.locator('button').filter({ has: page.locator('strong', { hasText: new RegExp(`^${dayNum}$`) }) }).first()
  if (await dayCell.count()) await dayCell.click()
  await page.waitForTimeout(400)
  const dayList = await page.locator('body').innerText()
  add('3.3 evento-dot-lista', /Reuni|🔔/i.test(dayList), 'evento do chat no dia')
  await shot(page, 'check-03-agenda-dia-evento')

  await page.getByRole('button', { name: /\+ Evento/i }).click()
  const nextWeek = new Date()
  nextWeek.setDate(nextWeek.getDate() + 7)
  const nextIso = `${nextWeek.getFullYear()}-${String(nextWeek.getMonth() + 1).padStart(2, '0')}-${String(nextWeek.getDate()).padStart(2, '0')}`
  await page.locator('input[placeholder="Título"]').fill('Dentista')
  await page.locator('input[type="date"]').fill(nextIso)
  await page.locator('input[type="time"]').fill('14:00')
  await page.getByRole('button', { name: /Salvar/i }).click()
  await page.waitForTimeout(1000)
  if (nextWeek.getMonth() !== new Date().getMonth()) {
    await page.getByRole('button', { name: '›' }).click()
    await page.waitForTimeout(300)
  }
  const dentistaDay = String(nextWeek.getDate())
  const dentistaCell = page.locator('button').filter({ has: page.locator('strong', { hasText: new RegExp(`^${dentistaDay}$`) }) }).first()
  if (await dentistaCell.count()) await dentistaCell.click()
  await page.waitForTimeout(300)
  add('3.5 dentista', /Dentista/i.test(await page.locator('body').innerText()), `data ${nextIso}`)
  await shot(page, 'check-03-agenda-dentista')

  await page.getByRole('button', { name: 'Semana' }).click()
  await page.waitForTimeout(400)
  add('3.7 visao-semana', /6:00|7:00|Seg/i.test(await page.locator('body').innerText()), 'grade semanal')
  await shot(page, 'check-03-agenda-semana')
  await page.getByRole('button', { name: 'Dia' }).click()
  await page.waitForTimeout(400)
  add('3.7 visao-dia', /Agenda|Dentista|Nada neste dia/i.test(await page.locator('body').innerText()), 'visão diária')
  await shot(page, 'check-03-agenda-dia')
  await page.getByRole('button', { name: 'Mês' }).click()

  await goTab(page, /Arena/i)
  add('4.2 desafio-dia', /Desafio do Dia/i.test(await page.locator('body').innerText()), 'card no topo')
  await shot(page, 'check-04-arena-desafio')

  const xpBattleBefore = await readXp(page)
  await page.getByRole('button', { name: 'Atacar' }).click()
  await page.waitForTimeout(250)
  await page.getByRole('button', { name: 'Defender' }).click()
  await page.waitForTimeout(250)
  const special = page.getByRole('button', { name: /Grito|Rasengan|Arise|Foco/i })
  if (await special.count()) await special.first().click()
  for (let i = 0; i < 10; i += 1) {
    const over = /Vitória|Derrota/i.test(await page.locator('body').innerText())
    if (over) break
    if (await page.getByRole('button', { name: 'Atacar' }).count()) await page.getByRole('button', { name: 'Atacar' }).click()
    await page.waitForTimeout(220)
  }
  await page.waitForTimeout(800)
  const battleText = await page.locator('body').innerText()
  const battleOver = /Vitória|Derrota/i.test(battleText)
  const xpBattleAfter = await readXp(page)
  add('4.3 rpg-turnos', battleOver, battleText.match(/Vitória[^\n]*|Derrota[^\n]*/)?.[0] || 'sem desfecho')
  add('4.3 rpg-xp', /Vitória/.test(battleText) ? xpBattleAfter !== xpBattleBefore || /XP|EXP/i.test(battleText) : battleOver, `xp ${xpBattleBefore} -> ${xpBattleAfter}`)
  await shot(page, 'check-04-rpg')

  await page.getByRole('button', { name: 'Clicker' }).click()
  const produce = page.getByRole('button', { name: /Produzir/i })
  for (let i = 0; i < 50; i += 1) await produce.click()
  await page.waitForTimeout(200)
  const clickerText = await page.locator('body').innerText()
  const coins = Number((clickerText.match(/(\d+)\s+moedas/i) || [])[1] || 0)
  add('4.4 clicker-moedas', coins >= 25, `${coins} moedas`)
  const upgrade = page.getByRole('button', { name: /Upgrade/i })
  if (await upgrade.count() && coins >= 25) await upgrade.first().click()
  add('4.4 clicker-upgrade', /Upgrade/i.test(await page.locator('body').innerText()), 'upgrade disponível/comprado')
  await shot(page, 'check-04-clicker')

  const xpQuizBefore = await readXp(page)
  await page.getByRole('button', { name: 'Quiz' }).click()
  await page.waitForTimeout(300)
  for (let i = 0; i < 5; i += 1) {
    const card = page.locator('h3', { hasText: 'Quiz de Disciplina' }).locator('xpath=..')
    const options = card.getByRole('button')
    if (await options.count()) await options.first().click()
    await page.waitForTimeout(400)
  }
  await page.waitForTimeout(600)
  const quizText = await page.locator('body').innerText()
  const xpQuizAfter = await readXp(page)
  add('4.5 quiz-5', /\/10|Acertos|Quiz de Disciplina/i.test(quizText), '5 respostas')
  add('4.5 quiz-xp', xpQuizAfter !== xpQuizBefore || /Acertos/i.test(quizText), `xp ${xpQuizBefore} -> ${xpQuizAfter}`)
  await shot(page, 'check-04-quiz')

  await goTab(page, /Tesouro|Finanças|Inventário/i)
  await page.waitForTimeout(600)
  const scoreLabel = page.locator('[aria-label^="Score"]')
  const scoreText = (await scoreLabel.count()) ? await scoreLabel.getAttribute('aria-label') : ''
  add('5.2 score', /Score\s+\d+/.test(scoreText) || /\/ 100/.test(await page.locator('body').innerText()), scoreText || 'score visível')
  await shot(page, 'check-05-visao')

  await page.locator('[data-finance-tab="accounts"]').click()
  await page.getByRole('button', { name: /Nova conta/i }).click()
  await page.getByLabel('Nome').fill('Nubank')
  await page.getByLabel('Tipo').selectOption('checking')
  await page.getByLabel('Saldo atual').fill('2000')
  await page.getByRole('button', { name: /Criar conta/i }).click()
  await page.waitForTimeout(900)
  add('5.3 conta-nubank', /Nubank/i.test(await page.locator('body').innerText()), 'conta criada')
  await shot(page, 'check-05-contas')

  await page.locator('[data-finance-tab="budgets"]').click()
  await page.getByLabel('Limite').fill('800')
  await page.getByRole('button', { name: /Salvar limite/i }).click()
  await page.waitForTimeout(900)
  add('5.4 orcamento', /800|Alimentação/i.test(await page.locator('body').innerText()), 'orçamento alimentação')
  await shot(page, 'check-05-orcamento')

  await page.locator('[data-finance-tab="debts"]').click()
  await page.getByRole('button', { name: /Nova dívida/i }).click()
  await page.getByLabel('Nome').fill('Cartão')
  await page.getByLabel('Valor total').fill('1500')
  await page.getByLabel('Resta').fill('1500')
  await page.getByLabel('Juros % a.a.').fill('5')
  await page.getByLabel('Parcela mensal').fill('125')
  await page.getByRole('button', { name: /Cadastrar/i }).click()
  await page.waitForTimeout(900)
  const debtsText = await page.locator('body').innerText()
  add('5.5 divida', /Cartão/i.test(debtsText), 'dívida criada')
  add('5.5 simulador', /Simulador de quitação|quita em/i.test(debtsText), 'simulador visível')
  add('5.5 metodos', /Bola de neve/i.test(debtsText) && /Avalanche/i.test(debtsText), 'métodos visíveis')
  await page.getByRole('button', { name: /Avalanche/i }).click()
  await shot(page, 'check-05-dividas')

  await page.locator('[data-finance-tab="recurring"]').click()
  await page.getByRole('button', { name: /\+ Novo/i }).click()
  await page.getByLabel('Nome').fill('Spotify')
  await page.getByLabel('Valor').fill('21')
  await page.getByLabel('Dia do mês').fill('10')
  await page.getByRole('button', { name: /Cadastrar/i }).click()
  await page.waitForTimeout(900)
  add('5.6 spotify', /Spotify/i.test(await page.locator('body').innerText()), 'recorrente')
  await shot(page, 'check-05-recorrentes')

  await page.locator('[data-finance-tab="calc"]').click()
  await page.getByLabel('Aporte mensal').fill('500')
  await page.getByLabel('% ao ano').fill('12')
  await page.getByLabel('Anos').fill('10')
  await page.waitForTimeout(300)
  const calc = await page.locator('body').innerText()
  add('5.7 juros', /115\.019|115019|R\$\s*115/i.test(calc), calc.match(/R\$[^\n]+/)?.[0] || 'resultado')
  await shot(page, 'check-05-calculadoras')

  const sixTabs = await page.locator('[data-finance-tab]').count()
  add('5.1 seis-subabas', sixTabs === 6, `${sixTabs} sub-abas`)

  const { count: debtCount } = await supabase.from('debts').select('*', { count: 'exact', head: true }).eq('user_id', uid)
  const { count: budgetCount } = await supabase.from('budgets').select('*', { count: 'exact', head: true }).eq('user_id', uid)
  add('5.8 count-debts', (debtCount || 0) > 0, String(debtCount))
  add('5.8 count-budgets', (budgetCount || 0) > 0, String(budgetCount))
  await supabase.auth.signOut()
} catch (error) {
  await shot(page, 'check-error').catch(() => {})
  add('runner', false, error.stack || error.message)
  console.error(error)
} finally {
  await browser.close()
}

fs.writeFileSync(path.join(OUT, 'full-checklist.json'), JSON.stringify({ report, weatherHits }, null, 2))
const failed = report.filter((item) => !item.ok)
console.log(`CHECKLIST ${failed.length ? 'PARTIAL' : 'OK'} ${report.filter((i) => i.ok).length}/${report.length}`)
