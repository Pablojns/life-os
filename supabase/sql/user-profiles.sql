CREATE TABLE IF NOT EXISTS public.user_profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  profile_type TEXT,
  profile_name TEXT,
  quiz_answers JSONB,
  suggested_theme TEXT,
  onboarding_completed BOOLEAN DEFAULT false,
  wake_time TEXT,
  sleep_time TEXT,
  work_type TEXT,
  main_challenge TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "profiles_own" ON public.user_profiles;
CREATE POLICY "profiles_own" ON public.user_profiles
  FOR ALL USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT SELECT, INSERT, UPDATE ON public.user_profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.user_profiles TO service_role;
NOTIFY pgrst, 'reload schema';

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS profile_type TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS profile_name TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS quiz_answers JSONB;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS suggested_theme TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS wake_time TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS sleep_time TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS work_type TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS main_challenge TEXT;
