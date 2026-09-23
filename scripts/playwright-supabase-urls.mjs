import { chromium } from 'playwright'
import fs from 'fs'
import path from 'path'
import { execSync } from 'child_process'

const SITE = 'https://pablojns.github.io/life-os'
const REDIRECTS = [
  'https://pablojns.github.io/life-os',
  'https://pablojns.github.io/life-os/**',
  'https://pablojns.github.io/life-os/dashboard',
].join('\n')
const CHROME_USER_DATA = path.join(process.env.LOCALAPPDATA, 'Google', 'Chrome', 'User Data')
const CLONE_DIR = path.join(process.env.TEMP, 'pw-lifeos-chrome')
const OUT = path.join(process.cwd(), 'playwright-output')
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
const page = context.pages()[0] || (await context.newPage())
page.setDefaultTimeout(45000)

try {
  await page.goto('https://supabase.com/dashboard/project/isjxfqkvavoaksroutre/auth/url-configuration', {
    waitUntil: 'domcontentloaded',
    timeout: 90000,
  })
  await page.waitForTimeout(5000)
  if (/sign-in|login/i.test(page.url())) throw new Error('LOGIN_WALL')

  await page.keyboard.press('Escape')
  await page.waitForTimeout(500)

  const site = page.getByLabel('Site URL')
  await site.waitFor({ timeout: 20000 })
  const current = await site.inputValue()
  console.log('CURRENT_SITE=' + current)
  if (current !== SITE) {
    await site.click({ clickCount: 3 })
    await page.keyboard.press('Control+A')
    await page.keyboard.insertText(SITE)
    const save = page.getByRole('button', { name: /save changes/i })
    await save.click()
    await page.waitForTimeout(1500)
    console.log('SITE_URL_SAVED')
  }

  await page.getByRole('button', { name: /add url/i }).first().click()
  const box = page.getByPlaceholder(/mydomain|http/i).first()
  await box.waitFor({ timeout: 8000 })
  await box.fill(REDIRECTS)
  await page.getByRole('button', { name: /save urls|save/i }).last().click()
  await page.waitForTimeout(2000)
  await page.screenshot({ path: path.join(OUT, 'supabase-urls-final.png'), fullPage: true })
  console.log('REDIRECTS_SAVED')
} catch (error) {
  console.error(error.message)
  await page.screenshot({ path: path.join(OUT, 'supabase-urls-error.png'), fullPage: true }).catch(() => {})
} finally {
  await context.close()
}
