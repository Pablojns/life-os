import { chromium } from 'playwright'
import fs from 'fs'
import path from 'path'
import { execSync } from 'child_process'

const CHROME_USER_DATA = path.join(process.env.LOCALAPPDATA, 'Google', 'Chrome', 'User Data')
const CLONE_DIR = path.join(process.env.TEMP, 'pw-lifeos-chrome')
const OUT = path.join(process.cwd(), 'playwright-output')
fs.mkdirSync(OUT, { recursive: true })

function robocopy(src, dest) {
  try {
    execSync(
      `robocopy "${src}" "${dest}" /E /NFL /NDL /NJH /NJS /R:1 /W:1 /XD Cache "Code Cache" GPUCache "Service Worker" DawnGraphiteCache DawnWebGPUCache blob_storage "OptimizationGuide PredictionModels" Crashpad`,
      { stdio: 'ignore' },
    )
  } catch (error) {
    if ((error.status ?? 0) >= 16) throw error
  }
}

fs.mkdirSync(CLONE_DIR, { recursive: true })
const localState = path.join(CHROME_USER_DATA, 'Local State')
if (fs.existsSync(localState)) fs.copyFileSync(localState, path.join(CLONE_DIR, 'Local State'))
for (const name of ['Profile 8', 'Profile 9', 'Profile 10']) {
  const src = path.join(CHROME_USER_DATA, name)
  if (fs.existsSync(src)) robocopy(src, path.join(CLONE_DIR, name))
}

const context = await chromium.launchPersistentContext(CLONE_DIR, {
  channel: 'chrome',
  headless: false,
  viewport: { width: 1280, height: 800 },
  args: ['--disable-extensions', '--disable-blink-features=AutomationControlled', '--profile-directory=Profile 8'],
  ignoreDefaultArgs: ['--enable-automation'],
})
const page = context.pages()[0] || (await context.newPage())
await page.goto('https://vercel.com/dashboard', { waitUntil: 'domcontentloaded', timeout: 90000 })
await page.waitForTimeout(5000)
console.log('URL=' + page.url())
console.log('TITLE=' + (await page.title()))
await page.screenshot({ path: path.join(OUT, 'vercel-probe.png'), fullPage: true })
await context.close()
