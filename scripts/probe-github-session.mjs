import { chromium } from 'playwright'
import path from 'path'

const CLONE_DIR = path.join(process.env.TEMP, 'pw-lifeos-chrome')
const context = await chromium.launchPersistentContext(CLONE_DIR, {
  channel: 'chrome',
  headless: false,
  viewport: { width: 1280, height: 800 },
  args: ['--disable-extensions', '--disable-blink-features=AutomationControlled', '--profile-directory=Profile 8'],
  ignoreDefaultArgs: ['--enable-automation'],
})
const page = context.pages()[0] || (await context.newPage())
await page.goto('https://github.com', { waitUntil: 'domcontentloaded', timeout: 90000 })
await page.waitForTimeout(4000)
console.log('URL=' + page.url())
console.log('TITLE=' + (await page.title()))
const body = (await page.locator('body').innerText()).slice(0, 400)
console.log(body)
await page.screenshot({
  path: path.join(process.cwd(), 'playwright-output', 'github-probe.png'),
})
await context.close()
