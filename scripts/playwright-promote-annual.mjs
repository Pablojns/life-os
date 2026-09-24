import { chromium } from 'playwright'
import fs from 'fs'
import path from 'path'
import { execSync } from 'child_process'

const OUT = path.join(process.cwd(), 'playwright-output')
const CHROME_USER_DATA = path.join(process.env.LOCALAPPDATA, 'Google', 'Chrome', 'User Data')
const CLONE_DIR = path.join(process.env.TEMP, 'pw-lifeos-chrome')
fs.mkdirSync(OUT, { recursive: true })

const SQL = `UPDATE public.profiles
SET
  plan = 'annual',
  plan_expires_at = NOW() + INTERVAL '365 days'
WHERE email = 'heroi.teste@lifeos.app';

SELECT email, plan, plan_expires_at
FROM public.profiles
WHERE email = 'heroi.teste@lifeos.app';`

function robocopy(src, dest) {
  try {
    execSync(
      `robocopy "${src}" "${dest}" /E /NFL /NDL /NJH /NJS /R:1 /W:1 /XD Cache "Code Cache" GPUCache "Service Worker" DawnGraphiteCache DawnWebGPUCache blob_storage Crashpad`,
      { stdio: 'ignore' },
    )
  } catch (error) {
    if ((error.status ?? 0) >= 16) throw error
  }
}

function cloneChromeProfiles() {
  fs.mkdirSync(CLONE_DIR, { recursive: true })
  const localState = path.join(CHROME_USER_DATA, 'Local State')
  if (fs.existsSync(localState)) fs.copyFileSync(localState, path.join(CLONE_DIR, 'Local State'))
  for (const name of ['Profile 8', 'Profile 9', 'Profile 10']) {
    const src = path.join(CHROME_USER_DATA, name)
    if (fs.existsSync(src)) robocopy(src, path.join(CLONE_DIR, name))
  }
}

async function shot(page, name) {
  const file = path.join(OUT, `${name}.png`)
  await page.screenshot({ path: file, fullPage: true }).catch(() => {})
  console.log('screenshot ' + file)
}

async function setSql(page, sql) {
  await page.waitForFunction(() => Boolean(window.monaco?.editor?.getEditors?.()?.length), null, {
    timeout: 90000,
  })
  const applied = await page.evaluate((value) => {
    const editors = window.monaco?.editor?.getEditors?.() || []
    if (editors[0]) {
      editors[0].setValue(value)
      editors[0].focus()
      return 'set'
    }
    return 'missing'
  }, sql)
  if (applied !== 'set') throw new Error('monaco missing')
}

async function runSql(page) {
  const runButton = page.getByRole('button', { name: /^run$/i }).or(page.getByRole('button', { name: /run query/i }))
  if (await runButton.count()) await runButton.first().click()
  else await page.keyboard.press('Control+Enter')
  const confirmRun = page.getByRole('button', { name: /run query/i })
  if (await confirmRun.count()) await confirmRun.first().click()
  await page.waitForTimeout(4000)
}

cloneChromeProfiles()
const context = await chromium.launchPersistentContext(CLONE_DIR, {
  channel: 'chrome',
  headless: false,
  viewport: { width: 1440, height: 960 },
  args: ['--disable-extensions', '--disable-blink-features=AutomationControlled', '--profile-directory=Profile 8'],
  ignoreDefaultArgs: ['--enable-automation'],
})
const page = context.pages()[0] || (await context.newPage())
page.setDefaultTimeout(45000)

try {
  await page.goto('https://supabase.com/dashboard/project/isjxfqkvavoaksroutre/editor', {
    waitUntil: 'domcontentloaded',
    timeout: 90000,
  })
  await page.waitForTimeout(4000)
  if (/sign-in|login/i.test(page.url())) throw new Error('LOGIN_WALL ' + page.url())
  await page.goto('https://supabase.com/dashboard/project/isjxfqkvavoaksroutre/sql/new', {
    waitUntil: 'domcontentloaded',
    timeout: 90000,
  })
  await page.waitForTimeout(8000)
  await page.keyboard.press('Escape')
  await page.keyboard.press('Escape')
  const snippet = page.getByRole('menuitem', { name: /create a new snippet/i })
  if (await snippet.count()) await snippet.click()
  await page.waitForTimeout(2500)

  await setSql(page, SQL)
  await runSql(page)
  await shot(page, 'promote-annual-sql')
  const body = await page.locator('body').innerText()
  const snippetText = body.replace(/\s+/g, ' ').slice(0, 1200)
  console.log(snippetText)
  const updated = /1 row|Success|annual/i.test(body)
  console.log(updated ? 'ANNUAL_OK' : 'ANNUAL_CHECK')
  if (!/annual/i.test(body)) {
    console.log('SELECT_BODY_MISSING_ANNUAL')
  }
} catch (error) {
  await shot(page, 'promote-annual-error')
  console.error('SQL_FAIL', error.message)
  process.exitCode = 1
} finally {
  await context.close().catch(() => {})
}
