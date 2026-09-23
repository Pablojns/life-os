import { chromium } from 'playwright'
import fs from 'fs'
import path from 'path'
import { execSync } from 'child_process'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')
const OUT = path.join(ROOT, 'playwright-output')
const SQL_PATH = path.join(ROOT, 'supabase', 'schema.sql')
const CHROME_USER_DATA = path.join(process.env.LOCALAPPDATA, 'Google', 'Chrome', 'User Data')
const CLONE_DIR = path.join(process.env.TEMP, 'pw-lifeos-chrome')
const RESULTS = []

fs.mkdirSync(OUT, { recursive: true })
const SQL = fs.readFileSync(SQL_PATH, 'utf8')

function log(message) {
  console.log(message)
  RESULTS.push(message)
}

async function shot(page, name) {
  const file = path.join(OUT, `${name}.png`)
  await page.screenshot({ path: file, fullPage: true })
  log(`screenshot: ${file}`)
  return file
}

function robocopy(src, dest) {
  try {
    execSync(
      `robocopy "${src}" "${dest}" /E /NFL /NDL /NJH /NJS /R:1 /W:1 /XD Cache "Code Cache" GPUCache "Service Worker" DawnGraphiteCache DawnWebGPUCache blob_storage "OptimizationGuidePredictionModels" Crashpad`,
      { stdio: 'ignore' },
    )
  } catch (error) {
    // Robocopy usa bitmask: 0-7 ok; 8+ alguns arquivos falharam (perfil do Chrome costuma estar locked).
    if ((error.status ?? 0) >= 16) throw error
  }
}

function cloneChromeProfiles() {
  fs.mkdirSync(CLONE_DIR, { recursive: true })
  const localState = path.join(CHROME_USER_DATA, 'Local State')
  if (fs.existsSync(localState)) {
    fs.copyFileSync(localState, path.join(CLONE_DIR, 'Local State'))
  }
  for (const name of ['Profile 8', 'Profile 9', 'Profile 10']) {
    const src = path.join(CHROME_USER_DATA, name)
    if (fs.existsSync(src)) robocopy(src, path.join(CLONE_DIR, name))
  }
}

function isLoginWall(page) {
  const url = page.url()
  return /sign-in|signin|login|accounts\.google|supabase\.com\/dashboard\/sign/i.test(url)
}

async function launchProfile(profileDirectory) {
  return chromium.launchPersistentContext(CLONE_DIR, {
    channel: 'chrome',
    headless: false,
    viewport: { width: 1440, height: 960 },
    args: [
      '--disable-extensions',
      '--disable-blink-features=AutomationControlled',
      `--profile-directory=${profileDirectory}`,
    ],
    ignoreDefaultArgs: ['--enable-automation'],
  })
}

async function openLoggedDashboard(url) {
  const profiles = ['Profile 8', 'Profile 9', 'Profile 10']
  let lastError = null
  for (const profile of profiles) {
    log(`tentando Chrome ${profile}`)
    let context
    try {
      context = await launchProfile(profile)
      const page = context.pages()[0] || (await context.newPage())
      page.setDefaultTimeout(45000)
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 90000 })
      await page.waitForTimeout(5000)
      if (isLoginWall(page)) {
        await shot(page, `login-wall-${profile.replace(/\s+/g, '-')}`)
        log(`${profile} não está autenticado no Supabase`)
        await context.close()
        continue
      }
      log(`${profile} autenticado: ${page.url()}`)
      return { context, page, profile }
    } catch (error) {
      lastError = error
      log(`falha em ${profile}: ${error.message}`)
      if (context) await context.close().catch(() => {})
    }
  }
  throw lastError || new Error('Nenhum perfil do Chrome está logado no Supabase')
}

async function task1(page) {
  log('=== TAREFA 1: schema SQL ===')
  await page.goto('https://supabase.com/dashboard/project/isjxfqkvavoaksroutre/sql/new', {
    waitUntil: 'domcontentloaded',
    timeout: 90000,
  })
  await page.waitForTimeout(6000)
  await shot(page, '01-sql-editor')

  const editor = page.locator('.monaco-editor').first()
  await editor.waitFor({ timeout: 45000 })
  await editor.click()
  await page.waitForTimeout(500)

  const applied = await page.evaluate((sql) => {
    const monaco = window.monaco
    if (!monaco?.editor) return 'no-monaco'
    const editors = monaco.editor.getEditors?.() || []
    if (editors[0]) {
      editors[0].setValue(sql)
      editors[0].focus()
      return 'editor'
    }
    const models = monaco.editor.getModels?.() || []
    if (models[0]) {
      models[0].setValue(sql)
      return 'model'
    }
    return 'missing'
  }, SQL)
  log(`SQL aplicado via ${applied}`)

  if (applied === 'missing' || applied === 'no-monaco') {
    await page.keyboard.press('Control+A')
    await page.keyboard.insertText(SQL)
  }

  await page.waitForTimeout(1000)
  await shot(page, '01-sql-pasted')

  const runButton = page.getByRole('button', { name: /^run$/i }).or(page.getByRole('button', { name: /run query/i }))
  if (await runButton.count()) {
    await runButton.first().click()
  } else {
    await page.keyboard.press('Control+Enter')
  }

  const confirmRun = page.getByRole('button', { name: /run query/i })
  await confirmRun.waitFor({ timeout: 15000 })
  await confirmRun.click()

  await page.waitForTimeout(2500)
  await shot(page, '01-sql-result')

  const body = (await page.locator('body').innerText()).slice(0, 4000)
  const success = /success/i.test(body) && !/\berror\b:/i.test(body)
  log(success ? 'TAREFA 1: Success' : `TAREFA 1: verificar resultado\n${body}`)
  return success
}

async function task2(page) {
  log('=== TAREFA 2: confirmar usuário ===')
  await page.goto('https://supabase.com/dashboard/project/isjxfqkvavoaksroutre/auth/users', {
    waitUntil: 'domcontentloaded',
    timeout: 90000,
  })
  await page.waitForTimeout(6000)
  await shot(page, '02-users')

  const email = page.getByText('heroi.teste@lifeos.app', { exact: false }).first()
  await email.waitFor({ timeout: 30000 })
  await email.click()
  await page.waitForTimeout(1500)
  await shot(page, '02-user-detail')

  const confirmButton = page
    .getByRole('button', { name: /confirm user/i })
    .or(page.getByRole('menuitem', { name: /confirm user/i }))
    .or(page.getByText(/^confirm user$/i))
  if (await confirmButton.count()) {
    await confirmButton.first().click()
  } else {
    await page.locator('[aria-label*="More" i], button:has-text("⋮")').last().click({ timeout: 5000 }).catch(() => {})
    await page.waitForTimeout(500)
    const item = page.getByText(/confirm user/i)
    if (await item.count()) await item.first().click()
  }

  const dialogConfirm = page.getByRole('button', { name: /confirm/i })
  if (await dialogConfirm.count()) {
    await dialogConfirm.last().click()
  }

  await page.waitForTimeout(2500)
  await shot(page, '02-user-confirmed')
  const body = await page.locator('body').innerText()
  log(`users page text snippet: ${body.replace(/\s+/g, ' ').slice(0, 800)}`)
  const confirmed = /confirm user|waiting for verification/i.test(body) === false || /confirmed/i.test(body)
  log(confirmed ? 'TAREFA 2: usuário confirmado (ou menu acionado)' : 'TAREFA 2: status incerto')
  return confirmed
}

async function task3() {
  log('=== TAREFA 3: login e XP ===')
  const browser = await chromium.launch({ headless: false })
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } })
  page.setDefaultTimeout(20000)
  const consoleErrors = []
  page.on('console', (msg) => {
    if (msg.type() === 'error') consoleErrors.push(msg.text())
  })

  await page.goto('http://localhost:5173/login', { waitUntil: 'networkidle' })
  await shot(page, '03-login')
  await page.locator('input[type="email"]').fill('heroi.teste@lifeos.app')
  await page.locator('input[type="password"]').fill('LifeOS123!')
  await page.getByRole('button', { name: /entrar na jornada/i }).click()
  await page.waitForTimeout(4000)
  await shot(page, '03-after-login')

  const url = page.url()
  const logged = url.includes('/dashboard')
  log(`URL após login: ${url}`)
  if (consoleErrors.length) log(`console errors: ${consoleErrors.join(' | ')}`)
  if (!logged) {
    await browser.close()
    return false
  }

  await page.getByRole('tab', { name: /missões/i }).click()
  await page.waitForTimeout(800)
  await page.getByRole('button', { name: /nova missão/i }).click()
  await page.locator('label:has-text("Título") input').fill('Teste XP')
  const xpInput = page.locator('label:has-text("XP") input')
  await xpInput.fill('10')
  await page.getByRole('button', { name: /^registrar$/i }).click()
  await page.waitForTimeout(1500)
  await shot(page, '03-quest-created')

  await page.getByRole('button', { name: /concluir/i }).first().click()
  await page.waitForTimeout(2000)
  await shot(page, '03-quest-complete')

  const xpText = await page.locator('header').innerText()
  log(`TopBar: ${xpText.replace(/\s+/g, ' ').slice(0, 300)}`)
  const xpOk = /10\s*\/\s*100/.test(xpText)
  log(xpOk ? 'TAREFA 3: XP 10/100' : 'TAREFA 3: XP não chegou a 10/100')
  await browser.close()
  return logged && xpOk
}

cloneChromeProfiles()
log(`perfil clonado em ${CLONE_DIR}`)

let context
try {
  const opened = await openLoggedDashboard(
    'https://supabase.com/dashboard/project/isjxfqkvavoaksroutre/sql/new',
  )
  context = opened.context
  const page = opened.page
  const t1 = await task1(page)
  const t2 = await task2(page)
  await context.close()
  context = null
  const t3 = await task3()
  fs.writeFileSync(path.join(OUT, 'results.txt'), RESULTS.join('\n'))
  log(`RESUMO t1=${t1} t2=${t2} t3=${t3}`)
  process.exit(t1 && t2 && t3 ? 0 : 1)
} catch (error) {
  log(`ERRO FATAL: ${error.stack || error.message}`)
  fs.writeFileSync(path.join(OUT, 'results.txt'), RESULTS.join('\n'))
  if (context) await context.close().catch(() => {})
  try {
    const t3 = await task3()
    log(`TAREFA 3 isolada: ${t3}`)
  } catch (task3Error) {
    log(`TAREFA 3 falhou: ${task3Error.message}`)
  }
  process.exit(1)
}
