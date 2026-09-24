import { chromium } from 'playwright'
import fs from 'fs'
import path from 'path'

const OUT = path.join(process.cwd(), 'playwright-output')
fs.mkdirSync(OUT, { recursive: true })
const APP = 'http://localhost:5173'
const EMAIL = 'heroi.teste@lifeos.app'
const PASSWORD = 'LifeOS123!'

const SHOTS = [
  { theme: 'skyrim', tab: 'quests', file: 'universe-skyrim-quests.png' },
  { theme: 'skyrim', tab: 'finance', file: 'universe-skyrim-finance.png' },
  { theme: 'naruto', tab: 'quests', file: 'universe-naruto-quests.png' },
  { theme: 'naruto', tab: 'stats', file: 'universe-naruto-stats.png' },
  { theme: 'solo', tab: 'quests', file: 'universe-solo-quests.png' },
  { theme: 'solo', tab: 'arena', file: 'universe-solo-arena.png' },
  { theme: 'cyberpunk', tab: 'quests', file: 'universe-cyberpunk-quests.png' },
  { theme: 'clean', tab: 'quests', file: 'universe-clean-quests.png' },
]

const report = { navLetters: [], overflow: [], scenes: [], shots: [] }

const browser = await chromium.launch({ headless: true, channel: 'chrome' })
const context = await browser.newContext({ viewport: { width: 1440, height: 900 } })
const page = await context.newPage()

await page.goto(`${APP}/login`, { waitUntil: 'networkidle' })
if (!page.url().includes('/dashboard')) {
  await page.locator('input[type="email"]').fill(EMAIL)
  await page.locator('input[type="password"]').fill(PASSWORD)
  await page.getByRole('button', { name: /Entrar/i }).first().click()
  await page.waitForURL(/\/(dashboard|settings|onboarding)/, { timeout: 25000 })
}
if (page.url().includes('onboarding')) {
  await page.goto(`${APP}/dashboard`, { waitUntil: 'networkidle' }).catch(() => {})
}

for (const shot of SHOTS) {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto(`${APP}/dashboard?theme=${shot.theme}`, { waitUntil: 'networkidle' })
  await page.locator(`[data-shell="${shot.theme}"]`).waitFor({ timeout: 12000 })
  const tabBtn = page.locator(`[data-tab="${shot.tab}"]`).first()
  if (await tabBtn.count()) {
    const selected = await tabBtn.getAttribute('aria-selected')
    if (selected !== 'true') await tabBtn.click({ force: true })
  }
  await page.waitForTimeout(700)

  const info = await page.evaluate(() => {
    const root = document.querySelector('[data-shell]')
    const scene = getComputedStyle(root).getPropertyValue('--scene')
    const bg = getComputedStyle(root).backgroundImage
    const navText = [...document.querySelectorAll('[data-tab]')]
      .slice(0, 12)
      .map((el) => (el.innerText || '').replace(/\s+/g, ' ').trim())
    return {
      theme: document.documentElement.getAttribute('data-theme'),
      shell: root?.getAttribute('data-shell'),
      scene: scene.trim(),
      bg,
      navText,
      overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth + 2,
    }
  })

  const letterBug = info.navText.filter((text) => /^[A-ZÁÉÍÓÚÂÊÔÃÕ]\s+[A-ZÁÉÍÓÚ]/.test(text))
  if (letterBug.length) report.navLetters.push({ theme: shot.theme, letterBug })
  report.scenes.push({ theme: shot.theme, tab: shot.tab, scene: info.scene, bg: info.bg.slice(0, 80), nav: info.navText.slice(0, 4) })

  const dest = path.join(OUT, shot.file)
  await page.screenshot({ path: dest, fullPage: false })
  report.shots.push(dest)

  await page.setViewportSize({ width: 375, height: 812 })
  await page.waitForTimeout(400)
  const mobile = await page.evaluate(() => ({
    overflow: document.documentElement.scrollWidth > 375 + 2,
    width: document.documentElement.scrollWidth,
  }))
  report.overflow.push({ theme: shot.theme, tab: shot.tab, ...mobile })
  await page.screenshot({ path: path.join(OUT, shot.file.replace('.png', '-mobile.png')) })
}

await browser.close()
console.log(JSON.stringify(report, null, 2))
if (report.navLetters.length) {
  console.error('NAV_LETTERS_FAIL')
  process.exit(1)
}
if (report.overflow.some((item) => item.overflow)) {
  console.error('OVERFLOW_FAIL')
  process.exit(1)
}
console.log('UNIVERSES_OK')
