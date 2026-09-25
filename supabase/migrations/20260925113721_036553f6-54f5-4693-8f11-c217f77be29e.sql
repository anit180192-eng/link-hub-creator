CREATE TABLE public.account_entitlements (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  plan text NOT NULL DEFAULT 'free' CHECK (plan IN ('free','premium')),
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active','past_due','canceled')),
  current_period_end timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.account_entitlements TO authenticated;
GRANT ALL ON public.account_entitlements TO service_role;
ALTER TABLE public.account_entitlements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own entitlement" ON public.account_entitlements FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE TRIGGER account_entitlements_updated BEFORE UPDATE ON public.account_entitlements FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE FUNCTION public.effective_plan(_user_id uuid)
RETURNS text LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT COALESCE((SELECT 'premium' FROM public.account_entitlements e
    WHERE e.user_id = _user_id AND e.plan = 'premium'
      AND (e.status = 'active' OR (e.status IN ('past_due','canceled') AND e.current_period_end > now()))), 'free')
$$;
REVOKE ALL ON FUNCTION public.effective_plan(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.effective_plan(uuid) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.enforce_page_limit()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE lim int; n int;
BEGIN
  IF TG_OP = 'UPDATE' AND NEW.user_id = OLD.user_id THEN RETURN NEW; END IF;
  PERFORM pg_advisory_xact_lock(hashtext('pages:' || NEW.user_id::text));
  lim := CASE public.effective_plan(NEW.user_id) WHEN 'premium' THEN 10 ELSE 2 END;
  SELECT count(*) INTO n FROM public.pages WHERE user_id = NEW.user_id;
  IF n >= lim THEN RAISE EXCEPTION 'PLAN_LIMIT_PROFILES: your plan allows up to % profiles', lim USING ERRCODE = 'P0001'; END IF;
  RETURN NEW;
END $$;

CREATE OR REPLACE FUNCTION public.enforce_tab_limit()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE lim int; n int; owner uuid;
BEGIN
  IF TG_OP = 'UPDATE' AND NEW.page_id = OLD.page_id THEN RETURN NEW; END IF;
  SELECT user_id INTO owner FROM public.pages WHERE id = NEW.page_id;
  IF owner IS NULL OR owner <> NEW.user_id THEN RAISE EXCEPTION 'Tab must belong to a profile you own' USING ERRCODE = '42501'; END IF;
  PERFORM pg_advisory_xact_lock(hashtext('tabs:' || NEW.page_id::text));
  lim := CASE public.effective_plan(owner) WHEN 'premium' THEN 50 ELSE 5 END;
  SELECT count(*) INTO n FROM public.page_tabs WHERE page_id = NEW.page_id;
  IF n >= lim THEN RAISE EXCEPTION 'PLAN_LIMIT_TABS: your plan allows up to % tabs per profile', lim USING ERRCODE = 'P0001'; END IF;
  RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION public.enforce_page_limit() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.enforce_tab_limit() FROM PUBLIC, anon, authenticated;

CREATE TRIGGER pages_plan_limit BEFORE INSERT OR UPDATE OF user_id ON public.pages FOR EACH ROW EXECUTE FUNCTION public.enforce_page_limit();
CREATE TRIGGER page_tabs_plan_limit BEFORE INSERT OR UPDATE OF page_id ON public.page_tabs FOR EACH ROW EXECUTE FUNCTION public.enforce_tab_limit();