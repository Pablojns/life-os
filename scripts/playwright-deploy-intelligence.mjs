import { chromium } from 'playwright'
import fs from 'fs'
import path from 'path'
import { execSync, spawnSync } from 'child_process'

const OUT = path.join(process.cwd(), 'playwright-output')
const CHROME_USER_DATA = path.join(process.env.LOCALAPPDATA, 'Google', 'Chrome', 'User Data')
const CLONE_DIR = path.join(process.env.TEMP, 'pw-lifeos-chrome')
const TOKEN_FILE = path.join(process.env.TEMP, 'lifeos-supabase-token.txt')
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

fs.mkdirSync(CLONE_DIR, { recursive: true })
const localState = path.join(CHROME_USER_DATA, 'Local State')
if (fs.existsSync(localState)) fs.copyFileSync(localState, path.join(CLONE_DIR, 'Local State'))
const src = path.join(CHROME_USER_DATA, 'Profile 8')
if (fs.existsSync(src)) robocopy(src, path.join(CLONE_DIR, 'Profile 8'))

const context = await chromium.launchPersistentContext(CLONE_DIR, {
  channel: 'chrome',
  headless: false,
  viewport: { width: 1440, height: 960 },
  args: ['--disable-extensions', '--disable-blink-features=AutomationControlled', '--profile-directory=Profile 8'],
  ignoreDefaultArgs: ['--enable-automation'],
})
await context.grantPermissions(['clipboard-read', 'clipboard-write'])
const page = context.pages()[0] || (await context.newPage())
page.setDefaultTimeout(45000)

try {
  await page.goto('https://supabase.com/dashboard/account/tokens', {
    waitUntil: 'domcontentloaded',
    timeout: 90000,
  })
  await page.waitForTimeout(3500)
  if (/sign-in|login/i.test(page.url())) throw new Error('LOGIN_WALL ' + page.url())

  await page.getByRole('button', { name: /generate new token/i }).click()
  await page.waitForTimeout(1200)
  const legacy = page.getByText(/create legacy token/i)
  if (await legacy.count()) await legacy.first().click()
  await page.waitForTimeout(1200)

  const nameInput = page.getByLabel(/name/i).first()
  await nameInput.waitFor({ timeout: 15000 })
  await nameInput.fill('lifeos-intel-deploy')
  await page.getByRole('button', { name: /generate token/i }).last().click()
  await page.getByRole('heading', { name: 'Token created' }).first().waitFor({ timeout: 20000 })
  await page.waitForTimeout(800)

  const copy = page.getByRole('button', { name: /copy/i }).first()
  await copy.click()
  await page.waitForTimeout(400)
  let token = ''
  try {
    token = (await page.evaluate(() => navigator.clipboard.readText())).trim()
  } catch {
    token = ''
  }
  if (!token.startsWith('sbp_') || token.length < 20) {
    token = await page.evaluate(() => {
      const inputs = [...document.querySelectorAll('input')]
      return inputs.map((el) => el.value).find((v) => v && v.startsWith('sbp_') && v.length > 20) || ''
    })
  }
  if (!token.startsWith('sbp_') || token.length < 20) throw new Error('TOKEN_NOT_FOUND')
  fs.writeFileSync(TOKEN_FILE, token, { encoding: 'utf8' })
} catch (error) {
  console.error('TOKEN_FAIL', error.message)
  await context.close().catch(() => {})
  process.exit(1)
}

const env = { ...process.env, SUPABASE_ACCESS_TOKEN: fs.readFileSync(TOKEN_FILE, 'utf8').trim() }
for (const name of ['send-notifications', 'ai-coach']) {
  console.log('DEPLOY_START ' + name)
  const result = spawnSync(
    'npx',
    ['supabase', 'functions', 'deploy', name, '--project-ref', 'isjxfqkvavoaksroutre', '--yes'],
    { cwd: process.cwd(), env, encoding: 'utf8', shell: true },
  )
  const out = `${result.stdout || ''}\n${result.stderr || ''}`
  console.log(out.replace(/sbp_[A-Za-z0-9]+/g, 'sbp_[redacted]').slice(-1200))
  console.log('DEPLOY_EXIT_' + name + '=' + result.status)
}

try {
  fs.unlinkSync(TOKEN_FILE)
} catch {
  /* ignore */
}

await page.goto('https://supabase.com/dashboard/project/isjxfqkvavoaksroutre/functions', {
  waitUntil: 'domcontentloaded',
  timeout: 90000,
})
await page.waitForTimeout(5000)
await page.screenshot({ path: path.join(OUT, 'functions-intelligence.png') })
await context.close().catch(() => {})
