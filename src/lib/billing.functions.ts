import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { bindingSig, paddleApiBase } from "./paddle";

const env = () => ({
  environment: process.env["PADDLE_ENVIRONMENT"] === "production" ? "production" : "sandbox",
  clientToken: process.env["PADDLE_CLIENT_TOKEN"] ?? "",
  priceId: process.env["PADDLE_PRICE_ID"] ?? "",
  apiKey: process.env["PADDLE_API_KEY"] ?? "",
  webhookSecret: process.env["PADDLE_WEBHOOK_SECRET"] ?? "",
});
/** Purchases only in sandbox and only when every required value exists. */
export const isBillingConfigured = (e: ReturnType<typeof env>) =>
  e.environment === "sandbox" && !!(e.clientToken && e.priceId && e.apiKey && e.webhookSecret);

/** Public, safe config for the /pay payment-link page: the client-side token only (it is designed to be public). */
export const getPublicPaddleConfig = createServerFn({ method: "GET" }).handler(async () => {
  const e = env();
  const ok = e.environment === "sandbox" && e.clientToken.startsWith("test_");
  return { environment: e.environment, clientToken: ok ? e.clientToken : null };
});

export const getBillingConfig = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const e = env();
    const configured = isBillingConfigured(e);
    const { data } = await (context.supabase as any).from("account_entitlements").select("paddle_customer_id").eq("user_id", context.userId).maybeSingle();
    return {
      configured,
      environment: e.environment,
      clientToken: configured ? e.clientToken : null,
      email: (context.claims as any)?.email ?? null,
      canManage: configured && !!data?.paddle_customer_id,
    };
  });

/** Creates the Premium transaction server-side so custom_data (user binding) can't be edited in the browser. */
export const createCheckoutTransaction = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const e = env();
    if (!isBillingConfigured(e)) throw new Error("Checkout isn't available yet");
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

export const createBillingPortal = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const e = env();
    if (!isBillingConfigured(e)) throw new Error("Billing is not configured yet");
    const { data } = await (context.supabase as any).from("account_entitlements").select("paddle_customer_id,paddle_subscription_id").eq("user_id", context.userId).maybeSingle();
    if (!data?.paddle_customer_id) throw new Error("No subscription found for this account");
    const res = await fetch(`${paddleApiBase(e.environment)}/customers/${encodeURIComponent(data.paddle_customer_id)}/portal-sessions`, {
      method: "POST",
      headers: { Authorization: `Bearer ${e.apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify(data.paddle_subscription_id ? { subscription_ids: [data.paddle_subscription_id] } : {}),
    });
    if (!res.ok) throw new Error("Couldn't open billing management");
    const json: any = await res.json();
    const url = json?.data?.urls?.general?.overview;
    if (typeof url !== "string") throw new Error("Couldn't open billing management");
    return { url };
  });
