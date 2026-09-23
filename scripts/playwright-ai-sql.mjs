import { chromium } from 'playwright'
import fs from 'fs'
import path from 'path'
import { execSync } from 'child_process'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')
const OUT = path.join(ROOT, 'playwright-output')
const CHROME_USER_DATA = path.join(process.env.LOCALAPPDATA, 'Google', 'Chrome', 'User Data')
const CLONE_DIR = path.join(process.env.TEMP, 'pw-lifeos-chrome')
fs.mkdirSync(OUT, { recursive: true })

const SQL = `CREATE TABLE IF NOT EXISTS public.ai_analyses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  analysis TEXT NOT NULL,
  analysis_type TEXT NOT NULL,
  plan_at_time TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.ai_analyses ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "analyses_own" ON public.ai_analyses;
CREATE POLICY "analyses_own" ON public.ai_analyses
  FOR ALL USING (auth.uid() = user_id);`

function robocopy(src, dest) {
  try {
    execSync(
      `robocopy "${src}" "${dest}" /E /NFL /NDL /NJH /NJS /R:1 /W:1 /XD Cache "Code Cache" GPUCache "Service Worker" DawnGraphiteCache DawnWebGPUCache blob_storage "OptimizationGuidePredictionModels" Crashpad`,
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
  console.log(`screenshot: ${file}`)
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
  await page.goto('https://supabase.com/dashboard/project/isjxfqkvavoaksroutre/sql/new', {
    waitUntil: 'domcontentloaded',
    timeout: 90000,
  })
  await page.waitForTimeout(6000)
  await shot(page, 'ai-sql-editor')
  if (/sign-in|login/i.test(page.url())) throw new Error(`LOGIN_WALL ${page.url()}`)

  const editor = page.locator('.monaco-editor').first()
  await editor.waitFor({ timeout: 45000 })
  await editor.click()
  const applied = await page.evaluate((sql) => {
    const monaco = window.monaco
    if (!monaco?.editor) return 'no-monaco'
    const editors = monaco.editor.getEditors?.() || []
    if (editors[0]) {
      editors[0].setValue(sql)
      return 'editor'
    }
    return 'missing'
  }, SQL)
  console.log(`sql via ${applied}`)
  if (applied !== 'editor') {
    await page.keyboard.press('Control+A')
    await page.keyboard.insertText(SQL)
  }

  const runButton = page.getByRole('button', { name: /^run$/i }).or(page.getByRole('button', { name: /run query/i }))
  if (await runButton.count()) await runButton.first().click()
  else await page.keyboard.press('Control+Enter')

  const confirmRun = page.getByRole('button', { name: /run query/i })
  if (await confirmRun.count()) await confirmRun.first().click()
  await page.waitForTimeout(3000)
  await shot(page, 'ai-sql-result')
  const body = await page.locator('body').innerText()
  console.log(body.replace(/\s+/g, ' ').slice(0, 600))
  console.log('AI_SQL_OK')
} catch (error) {
  await shot(page, 'ai-sql-error')
  console.error('AI_SQL_FAIL', error.message)
  process.exitCode = 1
} finally {
  await context.close().catch(() => {})
}
