import { chromium } from 'playwright'
import fs from 'fs'
import path from 'path'
import { execSync } from 'child_process'

const OUT = path.join(process.cwd(), 'playwright-output')
const CHROME_USER_DATA = path.join(process.env.LOCALAPPDATA, 'Google', 'Chrome', 'User Data')
const CLONE_DIR = path.join(process.env.TEMP, 'pw-lifeos-chrome')
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

async function shot(page, name) {
  await page.screenshot({ path: path.join(OUT, `${name}.png`), fullPage: true }).catch(() => {})
}

const context = await chromium.launchPersistentContext(CLONE_DIR, {
  channel: 'chrome',
  headless: false,
  viewport: { width: 1440, height: 960 },
  args: ['--disable-extensions', '--disable-blink-features=AutomationControlled', '--profile-directory=Profile 8'],
  ignoreDefaultArgs: ['--enable-automation'],
})
const page = context.pages()[0] || (await context.newPage())
page.setDefaultTimeout(30000)

try {
  await page.goto('https://supabase.com/dashboard/project/isjxfqkvavoaksroutre/settings/api-keys', {
    waitUntil: 'domcontentloaded',
    timeout: 90000,
  })
  await page.waitForTimeout(4000)
  await page.getByText(/legacy|service_role/i).first().click()
  await page.waitForTimeout(2000)
  await shot(page, 'api-keys-legacy')

  const reveal = page.getByRole('button', { name: /reveal|show/i })
  for (let i = 0; i < (await reveal.count()); i += 1) {
    await reveal.nth(i).click().catch(() => {})
    await page.waitForTimeout(300)
  }
  await shot(page, 'api-keys-revealed')

  const serviceKey = await page.evaluate(() => {
    const values = []
    for (const el of document.querySelectorAll('input, textarea, code, pre, [class*="mono"]')) {
      const value = (('value' in el ? el.value : '') || el.textContent || '').trim()
      if ((value.startsWith('eyJ') && value.length > 180) || value.startsWith('sb_secret_')) values.push(value)
    }
    return values.find((v) => v.startsWith('eyJ')) || values[0] || ''
  })

  if (!serviceKey) throw new Error('SERVICE_ROLE_NOT_FOUND')
  console.log('SERVICE_ROLE_KIND=' + (serviceKey.startsWith('eyJ') ? 'jwt' : 'secret') + ' LEN=' + serviceKey.length)

  await page.goto('https://supabase.com/dashboard/project/isjxfqkvavoaksroutre/functions/secrets', {
    waitUntil: 'domcontentloaded',
    timeout: 90000,
  })
  await page.waitForTimeout(3500)
  await shot(page, 'functions-secrets')

  const body = await page.locator('body').innerText()
  const already = /SUPABASE_SERVICE_ROLE_KEY/.test(body)
  console.log('SECRET_ALREADY=' + already)

  if (!already) {
    const add = page.getByRole('button', { name: /add secret|new secret/i }).first()
    if (await add.count()) await add.click()
    await page.waitForTimeout(800)
    const inputs = page.locator('input:visible')
    await inputs.nth(0).fill('SUPABASE_SERVICE_ROLE_KEY')
    await inputs.nth(1).fill(serviceKey)
    await page.getByRole('button', { name: /save|add/i }).last().click()
    await page.waitForTimeout(2000)
  }

  await shot(page, 'functions-secrets-final')
  console.log('SECRETS_OK')
} catch (error) {
  await shot(page, 'secrets-error')
  console.error('SECRETS_FAIL', error.message)
  process.exitCode = 1
} finally {
  await context.close().catch(() => {})
}
