ALTER TABLE public.pages ADD COLUMN pin_protected boolean NOT NULL DEFAULT false;

-- PIN hashes: server-only
CREATE TABLE public.account_security (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  pin_hash text NOT NULL,
  pin_salt text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.account_security TO service_role;
ALTER TABLE public.account_security ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER update_account_security_updated_at
  BEFORE UPDATE ON public.account_security
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Browsers that unlocked a page (short visit or trusted)
CREATE TABLE public.device_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  token_hash text NOT NULL UNIQUE,
  kind text NOT NULL DEFAULT 'session',
  label text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  last_used_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz
);
GRANT SELECT, DELETE ON public.device_tokens TO authenticated;
GRANT ALL ON public.device_tokens TO service_role;
ALTER TABLE public.device_tokens ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owners view their browsers" ON public.device_tokens
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Owners remove their browsers" ON public.device_tokens
  FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE INDEX device_tokens_user_id_idx ON public.device_tokens(user_id);

-- Wrong-PIN tracking for lockouts: server-only
CREATE TABLE public.pin_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  ip_hash text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.pin_attempts TO service_role;
ALTER TABLE public.pin_attempts ENABLE ROW LEVEL SECURITY;
CREATE INDEX pin_attempts_owner_created_idx ON public.pin_attempts(owner_id, created_at);

-- Links of PIN-protected pages are never publicly readable
DROP POLICY IF EXISTS "Links of published pages are public" ON public.links;
CREATE POLICY "Links of published pages are public" ON public.links
  FOR SELECT TO anon
  USING (EXISTS (
    SELECT 1 FROM public.pages p
    WHERE p.id = links.page_id AND p.published = true AND p.pin_protected = false
  ));