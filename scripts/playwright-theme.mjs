import { chromium } from 'playwright'
import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')
const OUT = path.join(ROOT, 'playwright-output')
fs.mkdirSync(OUT, { recursive: true })

const EMAIL = 'heroi.teste@lifeos.app'
const PASSWORD = 'LifeOS123!'
const APP = 'http://localhost:5173'
const SUPABASE_URL = 'https://isjxfqkvavoaksroutre.supabase.co'
const SUPABASE_KEY = 'sb_publishable_6K-0CffRhhuPUfvPoGsARw_oTu31N__'

function luminance(color) {
  const match = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/)
  if (!match) return -1
  const r = Number(match[1])
  const g = Number(match[2])
  const b = Number(match[3])
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255
}

async function readTheme(page) {
  return page.evaluate(() => {
    const html = document.documentElement
    const body = document.body
    return {
      theme: html.getAttribute('data-theme'),
      htmlBg: getComputedStyle(html).backgroundColor,
      bodyBg: getComputedStyle(body).backgroundColor,
    }
  })
}

async function waitForTheme(page, name) {
  await page.waitForFunction((theme) => document.documentElement.getAttribute('data-theme') === theme, name, {
    timeout: 8000,
  })
}

async function querySkin() {
  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)
  const { data: auth, error: authError } = await supabase.auth.signInWithPassword({
    email: EMAIL,
    password: PASSWORD,
  })
  if (authError) throw authError
  const { data, error } = await supabase.from('profiles').select('skin_active').eq('id', auth.user.id).single()
  await supabase.auth.signOut()
  if (error) throw error
  return data.skin_active
}

async function shot(page, name) {
  const file = path.join(OUT, `${name}.png`)
  await page.screenshot({ path: file, fullPage: true })
  console.log(`screenshot: ${file}`)
  return file
}

const browser = await chromium.launch({
  headless: true,
  channel: 'chrome',
})
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } })

try {
  await page.goto(`${APP}/login`, { waitUntil: 'networkidle' })
  if (!page.url().includes('/dashboard') && !page.url().includes('/settings')) {
    await page.locator('input[type="email"]').fill(EMAIL)
    await page.locator('input[type="password"]').fill(PASSWORD)
    await page.getByRole('button', { name: /Entrar na Jornada/i }).click()
    await page.waitForURL(/\/(dashboard|settings)/, { timeout: 20000 })
  }

  await page.goto(`${APP}/settings`, { waitUntil: 'networkidle' })
  await page.getByRole('heading', { name: 'Aparência' }).waitFor({ timeout: 15000 })

  const skyrimCard = page.locator('button').filter({ hasText: 'Skyrim' }).first()
  const cleanCard = page.locator('button').filter({ hasText: 'Clean' }).first()

  await skyrimCard.click()
  await waitForTheme(page, 'skyrim')
  await page.waitForTimeout(1200)
  const skyrimState = await readTheme(page)
  const skyrimLum = luminance(skyrimState.htmlBg)
  const skyrimShot = await shot(page, 'theme-skyrim')
  const skyrimDb = await querySkin()
  console.log('skyrim', JSON.stringify({ ...skyrimState, lum: skyrimLum, db: skyrimDb }))
  if (skyrimLum >= 0.5) throw new Error(`Fundo Skyrim deveria ser escuro. htmlBg=${skyrimState.htmlBg}`)
  if (skyrimDb !== 'skyrim') throw new Error(`skin_active esperado skyrim, recebido ${skyrimDb}`)

  await cleanCard.click()
  await waitForTheme(page, 'clean')
  await page.waitForTimeout(1200)
  const cleanState = await readTheme(page)
  const cleanLum = luminance(cleanState.htmlBg)
  const cleanShot = await shot(page, 'theme-clean')
  const cleanDb = await querySkin()
  console.log('clean', JSON.stringify({ ...cleanState, lum: cleanLum, db: cleanDb }))
  if (cleanLum <= 0.5) throw new Error(`Fundo Clean deveria ser claro. htmlBg=${cleanState.htmlBg}`)
  if (cleanDb !== 'clean') throw new Error(`skin_active esperado clean, recebido ${cleanDb}`)

  await skyrimCard.click()
  await waitForTheme(page, 'skyrim')
  await page.waitForTimeout(1200)
  const backState = await readTheme(page)
  const backLum = luminance(backState.htmlBg)
  await shot(page, 'theme-skyrim-back')
  const backDb = await querySkin()
  console.log('skyrim-back', JSON.stringify({ ...backState, lum: backLum, db: backDb }))
  if (backLum >= 0.5) throw new Error(`Fundo Skyrim (volta) deveria ser escuro. htmlBg=${backState.htmlBg}`)
  if (backDb !== 'skyrim') throw new Error(`skin_active esperado skyrim após volta, recebido ${backDb}`)

  const report = {
    ok: true,
    skyrimShot,
    cleanShot,
    skyrim: skyrimState,
    clean: cleanState,
    back: backState,
    db: { afterSkyrim: skyrimDb, afterClean: cleanDb, afterBack: backDb },
  }
  fs.writeFileSync(path.join(OUT, 'theme-report.json'), JSON.stringify(report, null, 2))
  console.log('THEME_TEST_OK')
} catch (error) {
  await shot(page, 'theme-error').catch(() => {})
  console.error('THEME_TEST_FAIL', error)
  process.exitCode = 1
} finally {
  await browser.close()
}
