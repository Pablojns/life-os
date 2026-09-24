ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS streak_days INTEGER DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS last_active_date DATE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS longest_streak INTEGER DEFAULT 0;

CREATE TABLE IF NOT EXISTS public.notification_sends (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  slot TEXT NOT NULL,
  sent_on DATE DEFAULT CURRENT_DATE,
  UNIQUE (user_id, slot, sent_on)
);

ALTER TABLE public.notification_sends ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS push_token TEXT;

CREATE INDEX IF NOT EXISTS notification_sends_user_slot_day ON public.notification_sends (user_id, slot, sent_on);
CREATE INDEX IF NOT EXISTS profiles_expo_push ON public.profiles (id) WHERE expo_push_token IS NOT NULL OR push_token IS NOT NULL;
CREATE INDEX IF NOT EXISTS quests_user_completed_at ON public.quests (user_id, completed_at);
CREATE INDEX IF NOT EXISTS transactions_user_date ON public.transactions (user_id, transaction_date);
CREATE INDEX IF NOT EXISTS profiles_streak ON public.profiles (streak_days DESC);
