import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { bindingSig, paddleApiBase } from "./paddle";
import { effectivePlan, type BillingEnvironment } from "./plans";

const env = () => ({
  environment: (process.env["PADDLE_ENVIRONMENT"] === "production" ? "production" : "sandbox") as BillingEnvironment,
  clientToken: process.env["PADDLE_CLIENT_TOKEN"] ?? "",
  priceId: process.env["PADDLE_PRICE_ID"] ?? "",
  apiKey: process.env["PADDLE_API_KEY"] ?? "",
  webhookSecret: process.env["PADDLE_WEBHOOK_SECRET"] ?? "",
});
/** Live checkout is enabled only after live credentials and the database switch agree. */
export const isBillingConfigured = (e: ReturnType<typeof env>) =>
  !!(e.clientToken && e.priceId && e.apiKey && e.webhookSecret) &&
  (e.environment === "sandbox" ? e.clientToken.startsWith("test_") : !e.clientToken.startsWith("test_"));

/** Production checkout needs a separate, explicit launch switch. */
const isCheckoutEnabled = (e: ReturnType<typeof env>) =>
  process.env["PADDLE_CHECKOUT_ENABLED"] === "true" &&
  (e.environment === "sandbox" || process.env["PADDLE_LIVE_CHECKOUT_ENABLED"] === "true");

async function activeBillingEnvironment(): Promise<BillingEnvironment | null> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data, error } = await (supabaseAdmin as any).from("billing_settings").select("active_environment").eq("id", true).single();
  return error ? null : data?.active_environment ?? null;
}

/** Public, safe config for the /pay payment-link page: the client-side token only (it is designed to be public). */
export const getPublicPaddleConfig = createServerFn({ method: "GET" }).handler(async () => {
  const e = env();
  const ok = isBillingConfigured(e) && (await activeBillingEnvironment()) === e.environment;
  return { environment: e.environment, clientToken: ok ? e.clientToken : null };
});

export const getBillingConfig = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const e = env();
    const dbEnvironment = await activeBillingEnvironment();
    const configured = isBillingConfigured(e) && dbEnvironment === e.environment;
    const { data } = await (context.supabase as any).from("account_entitlements").select("plan,status,current_period_end,scheduled_cancel_at,billing_environment,paddle_customer_id,paddle_subscription_id").eq("user_id", context.userId).maybeSingle();
    const matching = dbEnvironment === e.environment && data?.billing_environment === e.environment;
    return {
      configured,
      checkoutEnabled: configured && isCheckoutEnabled(e),
      environment: e.environment,
      clientToken: configured ? e.clientToken : null,
      email: (context.claims as any)?.email ?? null,
      plan: matching ? effectivePlan(data, new Date(), e.environment) : "free",
      membership: matching ? { status: data.status, currentPeriodEnd: data.current_period_end, scheduledCancelAt: data.scheduled_cancel_at } : null,
      canManage: configured && matching && !!data?.paddle_customer_id,
    };
  });

/** Creates the Premium transaction server-side so custom_data (user binding) can't be edited in the browser. */
export const createCheckoutTransaction = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const e = env();
    if (!isCheckoutEnabled(e)) throw new Error("Premium sign-ups are paused while payments are being set up");
    if (!isBillingConfigured(e) || (await activeBillingEnvironment()) !== e.environment) throw new Error("Checkout isn't available yet");
    const { data: existing } = await (context.supabase as any).from("account_entitlements").select("plan,status,current_period_end,billing_environment").eq("user_id", context.userId).maybeSingle();
    if (effectivePlan(existing, new Date(), e.environment) === "premium") throw new Error("This account already has Premium. Open Membership to manage it.");
    const res = await fetch(`${paddleApiBase(e.environment)}/transactions`, {
      method: "POST",
      headers: { Authorization: `Bearer ${e.apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        items: [{ price_id: e.priceId, quantity: 1 }],
        custom_data: { user_id: context.userId, lpb_sig: await bindingSig(context.userId, e.webhookSecret) },
      }),
    });
    const json: any = await res.json().catch(() => null);
    const id = json?.data?.id;
    if (!res.ok || typeof id !== "string") throw new Error("Couldn't start checkout");
    return { transactionId: id };
  });

async function portalUrl(userId: string, action: "overview" | "cancel") {
  const e = env();
  if (!isBillingConfigured(e) || (await activeBillingEnvironment()) !== e.environment) throw new Error("Billing is not configured yet");
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data } = await (supabaseAdmin as any).from("account_entitlements").select("paddle_customer_id,paddle_subscription_id,billing_environment").eq("user_id", userId).maybeSingle();
  if (data?.billing_environment !== e.environment || !data?.paddle_customer_id || !data?.paddle_subscription_id) throw new Error("No subscription found for this account");
  const res = await fetch(`${paddleApiBase(e.environment)}/customers/${encodeURIComponent(data.paddle_customer_id)}/portal-sessions`, {
    method: "POST",
    headers: { Authorization: `Bearer ${e.apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({ subscription_ids: [data.paddle_subscription_id] }),
  });
  if (!res.ok) throw new Error("Couldn't open billing management");
  const json: any = await res.json();
  const urls = json?.data?.urls;
  const url = action === "cancel"
    ? urls?.subscriptions?.find((s: any) => s.id === data.paddle_subscription_id)?.cancel_subscription
    : urls?.general?.overview;
  if (typeof url !== "string" || !url.startsWith("https://")) throw new Error("Couldn't open billing management");
  return { url };
}

export const createBillingPortal = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    return portalUrl(context.userId, "overview");
  });

export const createCancellationPortal = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => portalUrl(context.userId, "cancel"));
