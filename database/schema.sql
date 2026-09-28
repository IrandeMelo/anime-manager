CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS public.animes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text NOT NULL DEFAULT (auth.user_id()),
  name text NOT NULL CHECK (char_length(trim(name)) > 0),
  season integer NOT NULL DEFAULT 1 CHECK (season >= 1),
  current_episode integer NOT NULL DEFAULT 0 CHECK (current_episode >= 0),
  status text NOT NULL DEFAULT 'watching'
    CHECK (status IN ('watching','paused','completed','planned')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.animes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own animes"
  ON public.animes
  FOR ALL
  TO authenticated
  USING ((SELECT auth.user_id()) = user_id)
  WITH CHECK ((SELECT auth.user_id()) = user_id);

GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.animes TO authenticated;

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER animes_set_updated_at
BEFORE UPDATE ON public.animes
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();
