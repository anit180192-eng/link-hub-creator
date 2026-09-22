-- Keep client privileges as narrow as the application's RLS policies.
-- RLS alone does not apply to operations such as TRUNCATE.
REVOKE ALL ON public.account_security, public.pin_attempts FROM PUBLIC, anon, authenticated;
REVOKE ALL ON public.device_tokens FROM PUBLIC, anon, authenticated;
GRANT SELECT (id, user_id, kind, label, created_at, last_used_at, expires_at), DELETE
  ON public.device_tokens TO authenticated;
REVOKE ALL ON public.pages, public.links, public.profiles FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.pages, public.links TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.pages, public.links, public.profiles TO authenticated;
-- profiles is the obsolete single-page model; public pages now come from pages.
DROP POLICY IF EXISTS "Published profiles are public" ON public.profiles;

-- Reserve an attempt BEFORE computing a PIN hash. The owner-scoped transaction
-- lock makes counting and reservation atomic across workers and client IPs.
-- This function never elevates privileges and is callable only by the server.
CREATE OR REPLACE FUNCTION public.reserve_pin_attempt(p_owner_id uuid, p_ip_hash text)
RETURNS TABLE (allowed boolean, attempt_id uuid, remaining integer)
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $$
DECLARE
  browser_attempts integer;
  owner_attempts integer;
  reserved_id uuid;
  cutoff timestamptz;
BEGIN
  IF p_owner_id IS NULL OR p_ip_hash IS NULL OR p_ip_hash !~ '^[a-f0-9]{64}$' THEN
    RAISE EXCEPTION 'Invalid attempt context' USING ERRCODE = '22023';
  END IF;
  PERFORM pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(p_owner_id::text, 0));
  cutoff := pg_catalog.clock_timestamp() - interval '15 minutes';
  DELETE FROM public.pin_attempts WHERE owner_id = p_owner_id AND created_at < cutoff;
  SELECT count(*) FILTER (WHERE ip_hash = p_ip_hash), count(*)
    INTO browser_attempts, owner_attempts
    FROM public.pin_attempts WHERE owner_id = p_owner_id AND created_at >= cutoff;
  IF browser_attempts >= 5 OR owner_attempts >= 30 THEN
    RETURN QUERY SELECT false, NULL::uuid, 0;
    RETURN;
  END IF;
  INSERT INTO public.pin_attempts(owner_id, ip_hash, created_at)
    VALUES (p_owner_id, p_ip_hash, pg_catalog.clock_timestamp()) RETURNING id INTO reserved_id;
  RETURN QUERY SELECT true, reserved_id, least(5 - browser_attempts - 1, 30 - owner_attempts - 1);
END;
$$;
REVOKE ALL ON FUNCTION public.reserve_pin_attempt(uuid, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.reserve_pin_attempt(uuid, text) TO service_role;

NOTIFY pgrst, 'reload schema';
