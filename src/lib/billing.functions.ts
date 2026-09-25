import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { paddleApiBase } from "./paddle";

const env = () => ({
  environment: process.env["PADDLE_ENVIRONMENT"] === "production" ? "production" : "sandbox",
  clientToken: process.env["PADDLE_CLIENT_TOKEN"] ?? "",
  priceId: process.env["PADDLE_PRICE_ID"] ?? "",
  apiKey: process.env["PADDLE_API_KEY"] ?? "",
  webhookSecret: process.env["PADDLE_WEBHOOK_SECRET"] ?? "",
});

/** Checkout config for the signed-in user. Checkout stays off until all four values exist, and live mode is never enabled here. */
export const getBillingConfig = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const e = env();
    const configured = !!(e.clientToken && e.priceId && e.apiKey && e.webhookSecret) && e.environment === "sandbox";
    const { data } = await (context.supabase as any).from("account_entitlements").select("paddle_customer_id").eq("user_id", context.userId).maybeSingle();
    return {
      configured,
      environment: e.environment,
      clientToken: configured ? e.clientToken : null,
      priceId: configured ? e.priceId : null,
      userId: context.userId,
      email: (context.claims as any)?.email ?? null,
      canManage: configured && !!data?.paddle_customer_id,
    };
  });

/** Opens a Paddle customer portal session for the caller's own Paddle customer. */
export const createBillingPortal = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const e = env();
    if (!e.apiKey) throw new Error("Billing is not configured yet");
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
