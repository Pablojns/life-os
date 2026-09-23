-- PROFILES
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT,
  name TEXT,
  plan TEXT DEFAULT 'free' CHECK (plan IN ('free','monthly','quarterly','semiannual','annual')),
  plan_expires_at TIMESTAMPTZ,
  skin_active TEXT DEFAULT 'skyrim',
  level INTEGER DEFAULT 1,
  xp INTEGER DEFAULT 0,
  total_xp INTEGER DEFAULT 0,
  rank TEXT DEFAULT 'Iniciante',
  attr_forca INTEGER DEFAULT 0,
  attr_inteligencia INTEGER DEFAULT 0,
  attr_vitalidade INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- QUESTS
CREATE TABLE IF NOT EXISTS public.quests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  reward TEXT,
  xp INTEGER DEFAULT 10,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- HABITS
CREATE TABLE IF NOT EXISTS public.habits (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  xp_per_day INTEGER DEFAULT 5,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- HABIT CHECKS
CREATE TABLE IF NOT EXISTS public.habit_checks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  habit_id UUID REFERENCES public.habits(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  check_date DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(habit_id, check_date)
);

-- NOTES
CREATE TABLE IF NOT EXISTS public.notes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  body TEXT,
  reminder_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- REWARDS
CREATE TABLE IF NOT EXISTS public.rewards (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  cost_xp INTEGER DEFAULT 50,
  claimed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- FINANCES
CREATE TABLE IF NOT EXISTS public.finances (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  income NUMERIC DEFAULT 0,
  fixed_costs NUMERIC DEFAULT 0,
  goal_name TEXT,
  goal_amount NUMERIC DEFAULT 0,
  goal_current NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- AI ANALYSES
CREATE TABLE IF NOT EXISTS public.ai_analyses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  analysis TEXT NOT NULL,
  analysis_type TEXT NOT NULL,
  plan_at_time TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- FINANCIAL GOALS
CREATE TABLE IF NOT EXISTS public.financial_goals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  target_amount NUMERIC NOT NULL,
  current_amount NUMERIC DEFAULT 0,
  deadline DATE,
  icon TEXT DEFAULT '🎯',
  color TEXT DEFAULT '#C9A84C',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- TRANSACTIONS
CREATE TABLE IF NOT EXISTS public.transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  amount NUMERIC NOT NULL,
  category TEXT,
  description TEXT,
  transaction_date DATE DEFAULT CURRENT_DATE,
  type TEXT DEFAULT 'expense' CHECK (type IN ('income','expense')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ROW LEVEL SECURITY
ALTER TABLE public.profiles      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quests         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.habits         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.habit_checks   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notes          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rewards        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.finances       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_analyses    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financial_goals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "profiles_own" ON public.profiles;
DROP POLICY IF EXISTS "quests_own" ON public.quests;
DROP POLICY IF EXISTS "habits_own" ON public.habits;
DROP POLICY IF EXISTS "checks_own" ON public.habit_checks;
DROP POLICY IF EXISTS "notes_own" ON public.notes;
DROP POLICY IF EXISTS "rewards_own" ON public.rewards;
DROP POLICY IF EXISTS "finances_own" ON public.finances;
DROP POLICY IF EXISTS "transactions_own" ON public.transactions;
DROP POLICY IF EXISTS "analyses_own" ON public.ai_analyses;
DROP POLICY IF EXISTS "goals_own" ON public.financial_goals;

CREATE POLICY "profiles_own"      ON public.profiles      FOR ALL USING (auth.uid() = id);
CREATE POLICY "quests_own"        ON public.quests        FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "habits_own"        ON public.habits        FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "checks_own"        ON public.habit_checks  FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "notes_own"         ON public.notes         FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "rewards_own"       ON public.rewards       FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "finances_own"      ON public.finances      FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "transactions_own"  ON public.transactions  FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "analyses_own"      ON public.ai_analyses   FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "goals_own"         ON public.financial_goals FOR ALL USING (auth.uid() = user_id);

-- TRIGGER: cria profile automaticamente ao cadastrar
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email)
  VALUES (NEW.id, NEW.email)
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Backfill de usuários já existentes (ex.: conta de teste)
INSERT INTO public.profiles (id, email, name)
SELECT
  id,
  email,
  COALESCE(raw_user_meta_data->>'name', split_part(email, '@', 1))
FROM auth.users
ON CONFLICT (id) DO NOTHING;
