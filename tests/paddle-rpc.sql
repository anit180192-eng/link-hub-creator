-- Self-rolling-back check of apply_paddle_event (duplicate, out-of-order, grace, grants).
-- Always ends with an exception so nothing is committed; read the message for PASS/FAIL.
DO $$
DECLARE u uuid; r text; ent jsonb; res text := '';
BEGIN
  SELECT user_id INTO u FROM public.pages LIMIT 1;
  ent := jsonb_build_object('user_id',u,'plan','premium','status','active','current_period_end',now()+interval '1 year','paddle_customer_id','ctm_t','paddle_subscription_id','sub_t','billing_environment','sandbox');
  r := public.apply_paddle_event('evt_other_env','subscription.activated',now(),ent || '{"billing_environment":"production"}'); IF r<>'wrong_environment' THEN RAISE EXCEPTION 'FAIL environment %',r; END IF;
  r := public.apply_paddle_event('evt_t2','subscription.updated',now(),ent);                 IF r<>'applied' THEN RAISE EXCEPTION 'FAIL newer %',r; END IF;
  r := public.apply_paddle_event('evt_t2','subscription.updated',now(),ent);                 IF r<>'duplicate' THEN RAISE EXCEPTION 'FAIL dup %',r; END IF;
  r := public.apply_paddle_event('evt_t1','subscription.canceled',now()-interval '1 hour',
        ent || '{"status":"canceled"}');                                                    IF r<>'stale' THEN RAISE EXCEPTION 'FAIL stale %',r; END IF;
  IF (SELECT status FROM public.account_entitlements WHERE user_id=u)<>'active' THEN RAISE EXCEPTION 'FAIL overwritten'; END IF;
  IF NOT EXISTS (SELECT 1 FROM public.paddle_webhook_events WHERE event_id='evt_t1') THEN RAISE EXCEPTION 'FAIL stale not recorded'; END IF;
  IF public.effective_plan(u)<>'premium' THEN RAISE EXCEPTION 'FAIL plan'; END IF;
  r := public.apply_paddle_event('evt_cancel_scheduled','subscription.updated',now()+interval '1 second',
    ent || jsonb_build_object('scheduled_cancel_at',now()+interval '1 year'));
  IF r<>'applied' OR NOT EXISTS (SELECT 1 FROM public.account_entitlements
    WHERE user_id=u AND scheduled_cancel_at IS NOT NULL AND status='active') THEN
    RAISE EXCEPTION 'FAIL scheduled cancellation'; END IF;
  UPDATE public.account_entitlements SET current_period_end=now()-interval '25 hours' WHERE user_id=u;
  IF public.effective_plan(u)<>'free' THEN RAISE EXCEPTION 'FAIL expired active still premium'; END IF;
  UPDATE public.account_entitlements SET current_period_end=now()-interval '23 hours' WHERE user_id=u;
  IF public.effective_plan(u)<>'premium' THEN RAISE EXCEPTION 'FAIL grace'; END IF;
  IF has_function_privilege('anon','public.apply_paddle_event(text,text,timestamptz,jsonb)','EXECUTE')
     OR has_function_privilege('authenticated','public.apply_paddle_event(text,text,timestamptz,jsonb)','EXECUTE')
     OR has_function_privilege('authenticated','public.effective_plan(uuid)','EXECUTE')
     OR has_function_privilege('anon','public.effective_plan(uuid)','EXECUTE') THEN RAISE EXCEPTION 'FAIL grants'; END IF;
  RAISE EXCEPTION 'ALL PASS (rolled back)';
END $$;
