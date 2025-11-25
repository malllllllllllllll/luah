-- supabase/policies.sql
-- Enable and configure Row Level Security (RLS) for Luah.

-- 1) Enable RLS on tables
ALTER TABLE public.vents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vent_comments ENABLE ROW LEVEL SECURITY;

-- 2) Allow anyone to SELECT vents (read-only public)
CREATE POLICY "allow_select_vents_public"
  ON public.vents
  FOR SELECT
  USING (true);

-- 3) Allow anonymous INSERT for vents, with length + mood checks
CREATE POLICY "allow_insert_vents_anon"
  ON public.vents
  FOR INSERT
  WITH CHECK (
    char_length(text) > 0
    AND char_length(text) <= 600
    AND mood IN ('Uncategorized','Calm','Heavy','Hopeful','Tired','Anxious')
  );

-- 4) Allow anyone to SELECT comments for a vent
CREATE POLICY "allow_select_comments_public"
  ON public.vent_comments
  FOR SELECT
  USING (true);

-- 5) Allow anonymous INSERT for comments, with length check
CREATE POLICY "allow_insert_comments_anon"
  ON public.vent_comments
  FOR INSERT
  WITH CHECK (
    char_length(text) > 0
    AND char_length(text) <= 300
  );

-- Optional: you can later tighten this (e.g. rate limiting via triggers,
-- blocking spammy IPs, or requiring auth).
