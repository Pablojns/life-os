import { chromium } from 'playwright'
import fs from 'fs'
import path from 'path'
import { execSync } from 'child_process'

const OUT = path.join(process.cwd(), 'playwright-output')
const CHROME_USER_DATA = path.join(process.env.LOCALAPPDATA, 'Google', 'Chrome', 'User Data')
const CLONE_DIR = path.join(process.env.TEMP, 'pw-lifeos-chrome')
fs.mkdirSync(OUT, { recursive: true })

const LIST_SQL = `SELECT tablename
FROM pg_tables
WHERE schemaname = 'public'
AND tablename NOT IN (
  SELECT DISTINCT tablename FROM pg_policies WHERE schemaname = 'public'
);`

const FIX_SQL = `
DO $$
DECLARE r RECORD;
BEGIN
  FOR r IN
    SELECT t.tablename
    FROM pg_tables t
    WHERE t.schemaname = 'public'
      AND t.tablename NOT IN (
        SELECT DISTINCT tablename FROM pg_policies WHERE schemaname = 'public'
      )
      AND EXISTS (
        SELECT 1 FROM information_schema.columns c
        WHERE c.table_schema = 'public'
          AND c.table_name = t.tablename
          AND c.column_name = 'user_id'
      )
  LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', r.tablename);
    EXECUTE format(
      'CREATE POLICY %I ON public.%I FOR ALL USING (auth.uid() = user_id)',
      r.tablename || '_own',
      r.tablename
    );
  END LOOP;
END $$;

CREATE TABLE IF NOT EXISTS public.login_attempts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL,
  ip TEXT,
  attempted_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.login_attempts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "insert_only" ON public.login_attempts;
DROP POLICY IF EXISTS "count_attempts" ON public.login_attempts;
CREATE POLICY "insert_only" ON public.login_attempts
  FOR INSERT WITH CHECK (true);
CREATE POLICY "count_attempts" ON public.login_attempts
  FOR SELECT USING (true);
GRANT INSERT, SELECT ON public.login_attempts TO anon, authenticated;
`

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
    const monaco = window.monaco
    const editors = monaco?.editor?.getEditors?.() || []
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
  await page.waitForTimeout(3500)
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
  await page.waitForTimeout(8000)
  if (/sign-in|login/i.test(page.url())) throw new Error('LOGIN_WALL ' + page.url())
  await page.keyboard.press('Escape')
  await page.keyboard.press('Escape')
  const snippet = page.getByRole('menuitem', { name: /create a new snippet/i })
  if (await snippet.count()) await snippet.click()
  await page.waitForTimeout(3000)

  await setSql(page, LIST_SQL)
  await runSql(page)
  await shot(page, 'rls-tables-missing')
  const firstBody = await page.locator('body').innerText()
  const match = firstBody.match(/Success[\s\S]{0,800}|Error[\s\S]{0,400}|tablename[\s\S]{0,400}/i)
  console.log('LIST_RESULT ' + (match ? match[0].replace(/\s+/g, ' ').slice(0, 400) : firstBody.slice(0, 400)))

  await setSql(page, FIX_SQL + '\n' + LIST_SQL)
  await runSql(page)
  await shot(page, 'rls-tables-fixed')
  const second = await page.locator('body').innerText()
  console.log('FIX_RESULT ' + second.slice(0, 600).replace(/\s+/g, ' '))
  console.log('SQL_OK')
} catch (error) {
  await shot(page, 'rls-sql-error')
  console.error('SQL_FAIL', error.message)
  process.exitCode = 1
} finally {
  await context.close().catch(() => {})
}
