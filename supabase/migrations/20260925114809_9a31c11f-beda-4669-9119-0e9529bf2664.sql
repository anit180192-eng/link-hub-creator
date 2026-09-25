CREATE OR REPLACE FUNCTION public.effective_plan(_user_id uuid)
RETURNS text LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT COALESCE((SELECT 'premium' FROM public.account_entitlements e
    WHERE e.user_id = _user_id AND e.plan = 'premium' AND e.current_period_end IS NOT NULL
      AND ((e.status = 'active' AND e.current_period_end + interval '24 hours' > now())
        OR (e.status IN ('past_due','canceled') AND e.current_period_end > now()))), 'free')
$$;
REVOKE ALL ON FUNCTION public.effective_plan(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.effective_plan(uuid) TO service_role;

CREATE OR REPLACE FUNCTION public.apply_paddle_event(
  p_event_id text, p_event_type text, p_occurred_at timestamptz, p_ent jsonb)
RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE uid uuid; n int;
BEGIN
  IF p_event_id IS NULL OR length(p_event_id) = 0 OR length(p_event_id) > 200 THEN
    RAISE EXCEPTION 'invalid event id' USING ERRCODE = '22023';
  END IF;
  INSERT INTO public.paddle_webhook_events(event_id, event_type, occurred_at)
    VALUES (p_event_id, left(coalesce(p_event_type, ''), 100), p_occurred_at)
    ON CONFLICT (event_id) DO NOTHING;
  GET DIAGNOSTICS n = ROW_COUNT;
  IF n = 0 THEN RETURN 'duplicate'; END IF;
  IF p_ent IS NULL THEN RETURN 'ignored'; END IF;

  uid := (p_ent->>'user_id')::uuid;
  PERFORM pg_advisory_xact_lock(hashtext('entitlement:' || uid::text));
  INSERT INTO public.account_entitlements AS e
    (user_id, plan, status, current_period_end, paddle_customer_id, paddle_subscription_id, last_event_at)
  VALUES (uid, p_ent->>'plan', p_ent->>'status', (p_ent->>'current_period_end')::timestamptz,
    p_ent->>'paddle_customer_id', p_ent->>'paddle_subscription_id', p_occurred_at)
  ON CONFLICT (user_id) DO UPDATE SET
    plan = EXCLUDED.plan, status = EXCLUDED.status, current_period_end = EXCLUDED.current_period_end,
    paddle_customer_id = COALESCE(EXCLUDED.paddle_customer_id, e.paddle_customer_id),
    paddle_subscription_id = EXCLUDED.paddle_subscription_id, last_event_at = EXCLUDED.last_event_at
  WHERE e.last_event_at IS NULL OR e.last_event_at <= EXCLUDED.last_event_at;
  GET DIAGNOSTICS n = ROW_COUNT;
  RETURN CASE WHEN n = 0 THEN 'stale' ELSE 'applied' END;
END $$;
REVOKE ALL ON FUNCTION public.apply_paddle_event(text, text, timestamptz, jsonb) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.apply_paddle_event(text, text, timestamptz, jsonb) TO service_role;