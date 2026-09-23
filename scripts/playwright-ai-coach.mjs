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

async function queryAnalyses() {
  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)
  const { data: auth, error: authError } = await supabase.auth.signInWithPassword({ email: EMAIL, password: PASSWORD })
  if (authError) throw authError
  const { data, error } = await supabase
    .from('ai_analyses')
    .select('id, analysis, analysis_type, plan_at_time, created_at')
    .eq('user_id', auth.user.id)
    .order('created_at', { ascending: false })
    .limit(1)
  await supabase.auth.signOut()
  if (error) throw error
  return data?.[0] || null
}

const browser = await chromium.launch({ headless: true, channel: 'chrome' })
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } })
page.setDefaultTimeout(20000)

try {
  await page.goto(`${APP}/login`, { waitUntil: 'networkidle' })
  if (!page.url().includes('/dashboard')) {
    await page.locator('input[type="email"]').fill(EMAIL)
    await page.locator('input[type="password"]').fill(PASSWORD)
    await page.getByRole('button', { name: /Entrar na Jornada/i }).click()
    await page.waitForURL(/\/dashboard/, { timeout: 20000 })
  }

  await page.getByRole('tab', { name: /IA Coach/i }).click()
  await page.getByRole('heading', { name: /IA Coach/i }).waitFor()
  await shot(page, 'ai-coach-tab')

  await page.getByRole('button', { name: /Analisar minha semana/i }).click()
  await page.getByRole('article').getByText('Análise Semanal', { exact: true }).first().waitFor({ timeout: 20000 })
  await page.waitForTimeout(2500)
  await shot(page, 'ai-coach-result')

  const resultText = await page.locator('article').first().innerText()
  fs.writeFileSync(path.join(OUT, 'ai-coach-text.txt'), resultText)
  console.log('ANALYSIS_TEXT_START')
  console.log(resultText.slice(0, 1200))
  console.log('ANALYSIS_TEXT_END')

  const row = await queryAnalyses()
  if (!row?.analysis) throw new Error('Nenhum registro em ai_analyses')
  fs.writeFileSync(path.join(OUT, 'ai-coach-row.json'), JSON.stringify({ id: row.id, type: row.analysis_type, plan: row.plan_at_time }, null, 2))
  console.log(`ai_analyses id=${row.id} type=${row.analysis_type} plan=${row.plan_at_time}`)
  console.log('AI_COACH_OK')
} catch (error) {
  await shot(page, 'ai-coach-error')
  console.error('AI_COACH_FAIL', error.message)
  process.exitCode = 1
} finally {
  await browser.close()
}
