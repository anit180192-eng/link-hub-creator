ALTER TABLE public.account_entitlements
  ADD COLUMN paddle_customer_id text,
  ADD COLUMN paddle_subscription_id text,
  ADD COLUMN last_event_at timestamptz;
CREATE UNIQUE INDEX account_entitlements_paddle_sub_idx ON public.account_entitlements(paddle_subscription_id) WHERE paddle_subscription_id IS NOT NULL;

CREATE TABLE public.paddle_webhook_events (
  event_id text PRIMARY KEY,
  event_type text NOT NULL,
  occurred_at timestamptz,
  processed_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.paddle_webhook_events TO service_role;
ALTER TABLE public.paddle_webhook_events ENABLE ROW LEVEL SECURITY;