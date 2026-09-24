import { chromium } from 'playwright'
import fs from 'fs'
import path from 'path'
import { execSync } from 'child_process'

const OUT = path.join(process.cwd(), 'playwright-output')
const CHROME_USER_DATA = path.join(process.env.LOCALAPPDATA, 'Google', 'Chrome', 'User Data')
const CLONE_DIR = path.join(process.env.TEMP, 'pw-lifeos-chrome')
fs.mkdirSync(OUT, { recursive: true })

const SQL = `
CREATE TABLE IF NOT EXISTS public.debts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  total_amount NUMERIC NOT NULL,
  remaining_amount NUMERIC NOT NULL,
  interest_rate NUMERIC DEFAULT 0,
  monthly_payment NUMERIC DEFAULT 0,
  due_day INTEGER,
  category TEXT DEFAULT 'outros',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.budgets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  category TEXT NOT NULL,
  limit_amount NUMERIC NOT NULL,
  month INTEGER NOT NULL,
  year INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, category, month, year)
);

CREATE TABLE IF NOT EXISTS public.accounts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  type TEXT DEFAULT 'checking' CHECK (type IN ('checking','savings','investment','wallet','credit')),
  balance NUMERIC DEFAULT 0,
  color TEXT DEFAULT '#C9A84C',
  icon TEXT DEFAULT '🏦',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.recurring (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  type TEXT CHECK (type IN ('income','expense')),
  category TEXT,
  day_of_month INTEGER NOT NULL,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.transactions
  ADD COLUMN IF NOT EXISTS account_id UUID REFERENCES public.accounts(id) ON DELETE SET NULL;

ALTER TABLE public.debts      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.budgets    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.accounts   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recurring  ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "debts_own" ON public.debts;
DROP POLICY IF EXISTS "budgets_own" ON public.budgets;
DROP POLICY IF EXISTS "accounts_own" ON public.accounts;
DROP POLICY IF EXISTS "recurring_own" ON public.recurring;

CREATE POLICY "debts_own"     ON public.debts     FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "budgets_own"   ON public.budgets   FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "accounts_own"  ON public.accounts  FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "recurring_own" ON public.recurring FOR ALL USING (auth.uid() = user_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.debts, public.budgets, public.accounts, public.recurring TO authenticated;

SELECT 'debts' AS table, COUNT(*)::text AS rows FROM public.debts
UNION ALL SELECT 'budgets', COUNT(*)::text FROM public.budgets
UNION ALL SELECT 'accounts', COUNT(*)::text FROM public.accounts
UNION ALL SELECT 'recurring', COUNT(*)::text FROM public.recurring;
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
    const editors = window.monaco?.editor?.getEditors?.() || []
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
  await page.waitForTimeout(4000)
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
  await page.waitForTimeout(2500)
  await setSql(page, SQL)
  await runSql(page)
  await shot(page, 'finance-module-sql')
  const body = await page.locator('body').innerText()
  console.log(body.replace(/\s+/g, ' ').slice(0, 1400))
  console.log(/debts|accounts|budgets|recurring|Success/i.test(body) ? 'SQL_OK' : 'SQL_CHECK')
} catch (error) {
  await shot(page, 'finance-module-sql-error')
  console.error('SQL_FAIL', error.message)
  process.exitCode = 1
} finally {
  await context.close().catch(() => {})
}
