-- Stripe is sandbox-only until a separate production launch is reviewed.
ALTER TABLE public.account_entitlements
  ADD COLUMN billing_provider text NOT NULL DEFAULT 'paddle'
    CHECK (billing_provider IN ('paddle', 'stripe')),
  ADD COLUMN stripe_customer_id text,
  ADD COLUMN stripe_subscription_id text;
CREATE UNIQUE INDEX account_entitlements_stripe_sub_idx
  ON public.account_entitlements(stripe_subscription_id) WHERE stripe_subscription_id IS NOT NULL;

CREATE TABLE public.stripe_webhook_events (
  event_id text PRIMARY KEY,
  event_type text NOT NULL,
  occurred_at timestamptz NOT NULL,
  processed_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.stripe_webhook_events ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT ON public.stripe_webhook_events TO service_role;

CREATE OR REPLACE FUNCTION public.apply_stripe_event(
  p_event_id text, p_event_type text, p_occurred_at timestamptz, p_ent jsonb
) RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE uid uuid; n int; active_env text;
BEGIN
  IF p_event_id IS NULL OR p_event_id !~ '^evt_[A-Za-z0-9]+$' OR length(p_event_id) > 200 THEN
    RAISE EXCEPTION 'invalid event id' USING ERRCODE = '22023';
  END IF;
  INSERT INTO public.stripe_webhook_events(event_id, event_type, occurred_at)
    VALUES (p_event_id, left(coalesce(p_event_type, ''), 100), p_occurred_at)
    ON CONFLICT (event_id) DO NOTHING;
  GET DIAGNOSTICS n = ROW_COUNT;
  IF n = 0 THEN RETURN 'duplicate'; END IF;
  IF p_ent IS NULL THEN RETURN 'ignored'; END IF;
  SELECT active_environment INTO active_env FROM public.billing_settings WHERE id = true;
  IF active_env IS DISTINCT FROM 'sandbox' OR p_ent->>'billing_environment' IS DISTINCT FROM 'sandbox' THEN
    RETURN 'wrong_environment';
  END IF;
  uid := (p_ent->>'user_id')::uuid;
  IF p_ent->>'stripe_subscription_id' !~ '^sub_[A-Za-z0-9]+$' THEN
    RAISE EXCEPTION 'invalid subscription' USING ERRCODE = '22023';
  END IF;
  PERFORM pg_advisory_xact_lock(hashtext('entitlement:' || uid::text));
  INSERT INTO public.account_entitlements AS e
    (user_id, plan, status, current_period_end, scheduled_cancel_at, billing_environment,
     billing_provider, stripe_customer_id, stripe_subscription_id, last_event_at)
  VALUES (uid, 'premium', p_ent->>'status', (p_ent->>'current_period_end')::timestamptz,
    (p_ent->>'scheduled_cancel_at')::timestamptz, 'sandbox', 'stripe',
    p_ent->>'stripe_customer_id', p_ent->>'stripe_subscription_id', p_occurred_at)
  ON CONFLICT (user_id) DO UPDATE SET
    plan = EXCLUDED.plan, status = EXCLUDED.status,
    current_period_end = EXCLUDED.current_period_end,
    scheduled_cancel_at = EXCLUDED.scheduled_cancel_at,
    billing_environment = EXCLUDED.billing_environment,
    billing_provider = 'stripe',
    stripe_customer_id = COALESCE(EXCLUDED.stripe_customer_id, e.stripe_customer_id),
    stripe_subscription_id = EXCLUDED.stripe_subscription_id,
    paddle_customer_id = NULL, paddle_subscription_id = NULL,
    last_event_at = EXCLUDED.last_event_at
  WHERE e.last_event_at IS NULL OR e.last_event_at <= EXCLUDED.last_event_at;
  GET DIAGNOSTICS n = ROW_COUNT;
  RETURN CASE WHEN n = 0 THEN 'stale' ELSE 'applied' END;
END $$;
REVOKE ALL ON FUNCTION public.apply_stripe_event(text, text, timestamptz, jsonb) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.apply_stripe_event(text, text, timestamptz, jsonb) TO service_role;
