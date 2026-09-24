import { chromium } from 'playwright'
import fs from 'fs'
import path from 'path'
import { execSync } from 'child_process'

const OUT = path.join(process.cwd(), 'playwright-output')
const CHROME_USER_DATA = path.join(process.env.LOCALAPPDATA, 'Google', 'Chrome', 'User Data')
const CLONE_DIR = path.join(process.env.TEMP, 'pw-lifeos-chrome')
const SQL = fs.readFileSync(path.join(process.cwd(), 'supabase', 'sql', 'streak.sql'), 'utf8')
fs.mkdirSync(OUT, { recursive: true })

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

async function setSql(page, sql) {
  await page.waitForFunction(() => Boolean(window.monaco?.editor?.getEditors?.()?.length), null, { timeout: 90000 })
  await page.evaluate((value) => {
    const editors = window.monaco?.editor?.getEditors?.() || []
    if (editors[0]) editors[0].setValue(value)
  }, sql)
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
try {
  await page.goto('https://supabase.com/dashboard/project/isjxfqkvavoaksroutre/sql/new', {
    waitUntil: 'domcontentloaded',
    timeout: 90000,
  })
  await page.waitForTimeout(8000)
  if (/sign-in|login/i.test(page.url())) throw new Error('LOGIN_WALL ' + page.url())
  await page.keyboard.press('Escape')
  await setSql(page, SQL)
  const runButton = page.getByRole('button', { name: /^run$/i }).or(page.getByRole('button', { name: /run query/i }))
  if (await runButton.count()) await runButton.first().click()
  else await page.keyboard.press('Control+Enter')
  await page.waitForTimeout(4000)
  await page.screenshot({ path: path.join(OUT, 'streak-sql.png') })
  const body = await page.locator('body').innerText()
  console.log(/error|failed|permission/i.test(body) && !/Success|Success\./i.test(body) ? 'SQL_WARN' : 'SQL_OK')
  console.log(body.replace(/\s+/g, ' ').slice(0, 1200))
} catch (error) {
  console.error('SQL_FAIL', error.message)
  process.exitCode = 1
} finally {
  await context.close().catch(() => {})
}
