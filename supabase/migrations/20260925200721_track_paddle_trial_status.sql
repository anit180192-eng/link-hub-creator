-- Trial access is Premium until the trial ends, but is not labelled as paid.
ALTER TABLE public.account_entitlements
  DROP CONSTRAINT IF EXISTS account_entitlements_status_check;
ALTER TABLE public.account_entitlements
  ADD CONSTRAINT account_entitlements_status_check
  CHECK (status IN ('active', 'trialing', 'past_due', 'canceled'));

CREATE OR REPLACE FUNCTION public.effective_plan(_user_id uuid)
RETURNS text LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT COALESCE((SELECT 'premium' FROM public.account_entitlements e
    WHERE e.user_id = _user_id AND e.plan = 'premium' AND e.current_period_end IS NOT NULL
      AND e.billing_environment = (SELECT active_environment FROM public.billing_settings WHERE id = true)
      AND ((e.status = 'active' AND e.current_period_end + interval '24 hours' > now())
        OR (e.status IN ('trialing', 'past_due', 'canceled') AND e.current_period_end > now()))), 'free')
$$;
REVOKE ALL ON FUNCTION public.effective_plan(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.effective_plan(uuid) TO service_role;
