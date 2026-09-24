CREATE TABLE IF NOT EXISTS public.chat_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role TEXT CHECK (role IN ('user','assistant')) NOT NULL,
  content TEXT NOT NULL,
  action_taken TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.scheduled_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  event_datetime TIMESTAMPTZ NOT NULL,
  notify_at TIMESTAMPTZ NOT NULL,
  notified BOOLEAN DEFAULT false,
  notification_type TEXT DEFAULT 'reminder',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.daily_challenges (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  challenge_date DATE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  xp_bonus INTEGER DEFAULT 10,
  kind TEXT DEFAULT 'habits',
  target INTEGER DEFAULT 2,
  completed BOOLEAN DEFAULT false,
  UNIQUE (user_id, challenge_date)
);

CREATE TABLE IF NOT EXISTS public.quiz_plays (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  play_date DATE NOT NULL,
  score INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.quests ADD COLUMN IF NOT EXISTS due_date DATE;
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS payment_method TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS expo_push_token TEXT;

ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scheduled_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_plays ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "chat_own" ON public.chat_messages;
DROP POLICY IF EXISTS "events_own" ON public.scheduled_events;
DROP POLICY IF EXISTS "challenges_own" ON public.daily_challenges;
DROP POLICY IF EXISTS "quiz_own" ON public.quiz_plays;

CREATE POLICY "chat_own" ON public.chat_messages FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "events_own" ON public.scheduled_events FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "challenges_own" ON public.daily_challenges FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "quiz_own" ON public.quiz_plays FOR ALL USING (auth.uid() = user_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.chat_messages, public.scheduled_events, public.daily_challenges, public.quiz_plays TO authenticated;

SELECT 'chat_messages' AS table, COUNT(*)::text AS rows FROM public.chat_messages
UNION ALL SELECT 'scheduled_events', COUNT(*)::text FROM public.scheduled_events
UNION ALL SELECT 'daily_challenges', COUNT(*)::text FROM public.daily_challenges
UNION ALL SELECT 'quiz_plays', COUNT(*)::text FROM public.quiz_plays;
