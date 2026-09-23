import { chromium } from 'playwright'
import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const OUT = path.join(__dirname, '..', 'playwright-output')
fs.mkdirSync(OUT, { recursive: true })

const EMAIL = 'heroi.teste@lifeos.app'
const PASSWORD = 'LifeOS123!'
const APP = 'http://localhost:5173'
const SUPABASE_URL = 'https://isjxfqkvavoaksroutre.supabase.co'
const SUPABASE_KEY = 'sb_publishable_6K-0CffRhhuPUfvPoGsARw_oTu31N__'

async function shot(page, name) {
  const file = path.join(OUT, `${name}.png`)
  await page.screenshot({ path: file, fullPage: true })
  console.log(`screenshot: ${file}`)
}

async function withUser() {
  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)
  const { data: auth, error } = await supabase.auth.signInWithPassword({ email: EMAIL, password: PASSWORD })
  if (error) throw error
  return { supabase, id: auth.user.id }
}

async function resetFinance() {
  const { supabase, id } = await withUser()
  await supabase.from('transactions').delete().eq('user_id', id)
  await supabase.from('financial_goals').delete().eq('user_id', id)
  await supabase.from('finances').delete().eq('user_id', id)
  await supabase.auth.signOut()
}

async function queryFinance() {
  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)
  const { data: auth, error: authError } = await supabase.auth.signInWithPassword({ email: EMAIL, password: PASSWORD })
  if (authError) throw authError
  const id = auth.user.id
  const [finances, goals, transactions] = await Promise.all([
    supabase.from('finances').select('income, fixed_costs').eq('user_id', id).maybeSingle(),
    supabase.from('financial_goals').select('name, target_amount, current_amount, icon').eq('user_id', id),
    supabase.from('transactions').select('amount, type, category').eq('user_id', id),
  ])
  await supabase.auth.signOut()
  return {
    finances: finances.data,
    goals: goals.data,
    transactions: transactions.data,
    errors: [finances.error, goals.error, transactions.error].filter(Boolean).map((item) => item.message),
  }
}

const deadline = new Date()
deadline.setMonth(deadline.getMonth() + 12)
const deadlineValue = deadline.toISOString().slice(0, 10)

const browser = await chromium.launch({ headless: true, channel: 'chrome' })
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
page.setDefaultTimeout(20000)

try {
  await resetFinance()
  await page.goto(`${APP}/login`, { waitUntil: 'networkidle' })
  if (!page.url().includes('/dashboard')) {
    await page.locator('input[type="email"]').fill(EMAIL)
    await page.locator('input[type="password"]').fill(PASSWORD)
    await page.getByRole('button', { name: /Entrar na Jornada/i }).click()
    await page.waitForURL(/\/dashboard/, { timeout: 20000 })
  }

  await page.getByRole('tab', { name: /Finanças/i }).click()
  await page.getByRole('heading', { name: 'Finanças' }).waitFor()
  await shot(page, 'finance-01-tab')

  await page.locator('label:has-text("Renda") input').fill('5000')
  await page.locator('label:has-text("Gastos fixos") input').fill('2000')
  await page.getByRole('button', { name: /Salvar configuração/i }).click()
  await page.waitForTimeout(1200)
  await shot(page, 'finance-02-config')

  await page.getByRole('button', { name: /\+ Nova meta/i }).click()
  await page.locator('label:has-text("Nome") input').fill('Reserva de Emergência')
  await page.locator('label:has-text("Alvo") input').fill('10000')
  await page.locator('label:has-text("Prazo") input').fill(deadlineValue)
  await page.locator('label:has-text("Ícone") input').fill('🛡️')
  await page.getByRole('button', { name: /Criar meta/i }).click()
  await page.getByText('Reserva de Emergência').waitFor()
  await shot(page, 'finance-03-goal')

  await page.locator('label:has-text("Valor") input').fill('150')
  await page.locator('label:has-text("Descrição") input').fill('Mercado')
  await page.getByRole('button', { name: /^Registrar$/i }).click()
  await page.waitForTimeout(1200)
  await shot(page, 'finance-04-expense')

  await page.getByRole('button', { name: /^Receita$/i }).click()
  await page.locator('label:has-text("Valor") input').fill('5000')
  await page.locator('label:has-text("Descrição") input').fill('Salário mensal')
  await page.getByRole('button', { name: /^Registrar$/i }).click()
  await page.waitForTimeout(1500)

  await page.getByText('R$ 5.000,00').first().waitFor()
  await page.getByText('R$ 150,00').first().waitFor()
  await page.getByText('R$ 4.850,00').first().waitFor()
  await page.getByText(/Alimentação/).first().waitFor()
  await shot(page, 'finance-05-summary')
  await shot(page, 'finance-06-charts')

  await page.getByRole('tab', { name: /Hábitos/i }).click()
  await page.getByRole('heading', { name: 'Hábitos' }).waitFor()
  await page.getByRole('button', { name: /Novo hábito/i }).click()
  await page.locator('label:has-text("Nome") input').fill('Disciplina Financeira')
  await page.getByRole('button', { name: /^Adicionar$/i }).click()
  await page.getByText('Disciplina Financeira').waitFor({ timeout: 10000 })
  const today = new Date().getDate()
  await page.getByRole('button', { name: `Disciplina Financeira dia ${today}` }).click()
  await page.getByText(/Hábito concluído! \+R\$ 1,00 na sua meta/i).waitFor({ timeout: 8000 })
  await shot(page, 'finance-07-habit-toast')

  const db = await queryFinance()
  fs.writeFileSync(path.join(OUT, 'finance-db.json'), JSON.stringify(db, null, 2))
  console.log(JSON.stringify(db, null, 2))
  if (db.errors.length) throw new Error(db.errors.join('; '))
  if (Number(db.finances?.income) !== 5000) throw new Error(`income=${db.finances?.income}`)
  if (!db.goals?.some((goal) => goal.name === 'Reserva de Emergência')) throw new Error('meta ausente')
  if (!db.transactions?.some((item) => item.type === 'expense' && Number(item.amount) === 150)) throw new Error('despesa ausente')
  if (!db.transactions?.some((item) => item.type === 'income' && Number(item.amount) === 5000)) throw new Error('receita ausente')
  console.log('FINANCE_OK')
} catch (error) {
  await shot(page, 'finance-error')
  console.error('FINANCE_FAIL', error.message)
  process.exitCode = 1
} finally {
  await browser.close()
}
