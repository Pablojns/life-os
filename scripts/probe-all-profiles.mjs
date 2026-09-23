import { chromium } from 'playwright'
import fs from 'fs'
import path from 'path'
import { execSync } from 'child_process'

const CHROME_USER_DATA = path.join(process.env.LOCALAPPDATA, 'Google', 'Chrome', 'User Data')
const CLONE_DIR = path.join(process.env.TEMP, 'pw-lifeos-chrome-fresh')
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

if (fs.existsSync(CLONE_DIR)) fs.rmSync(CLONE_DIR, { recursive: true, force: true })
fs.mkdirSync(CLONE_DIR, { recursive: true })
const localState = path.join(CHROME_USER_DATA, 'Local State')
if (fs.existsSync(localState)) fs.copyFileSync(localState, path.join(CLONE_DIR, 'Local State'))
for (const name of ['Profile 8', 'Profile 9', 'Profile 10']) {
  const src = path.join(CHROME_USER_DATA, name)
  if (fs.existsSync(src)) robocopy(src, path.join(CLONE_DIR, name))
}

for (const profile of ['Profile 8', 'Profile 9', 'Profile 10']) {
  const src = path.join(CHROME_USER_DATA, profile)
  if (!fs.existsSync(src)) {
    console.log(`SKIP ${profile}`)
    continue
  }
  console.log(`=== ${profile} ===`)
  const context = await chromium.launchPersistentContext(CLONE_DIR, {
    channel: 'chrome',
    headless: false,
    viewport: { width: 1100, height: 720 },
    args: ['--disable-extensions', '--disable-blink-features=AutomationControlled', `--profile-directory=${profile}`],
    ignoreDefaultArgs: ['--enable-automation'],
  })
  const page = context.pages()[0] || (await context.newPage())
  for (const url of ['https://vercel.com/dashboard', 'https://github.com', 'https://accounts.google.com']) {
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 }).catch((e) => console.log(e.message))
    await page.waitForTimeout(3500)
    console.log(`${url} -> ${page.url()}`)
  }
  await page.screenshot({ path: path.join(OUT, `probe-${profile.replace(/\s+/g, '-')}.png`) })
  await context.close()
}
