import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { effectivePlan } from "./plans";

/** Legacy Paddle payment links are disabled while billing moves to Stripe. */
export const getPublicPaddleConfig = createServerFn({ method: "GET" }).handler(async () => ({ environment: "sandbox" as const, clientToken: null }));

async function sandboxActive() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data, error } = await (supabaseAdmin as any).from("billing_settings").select("active_environment").eq("id", true).single();
  return !error && data?.active_environment === "sandbox";
}

export const getBillingConfig = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { stripeConfigured, stripeCheckoutEnabled, STRIPE_SANDBOX_EMAIL } = await import("./stripe.server");
    const allowed = String((context.claims as any)?.email ?? "").toLowerCase() === STRIPE_SANDBOX_EMAIL;
    const configured = stripeConfigured() && await sandboxActive();
    const { data } = await (context.supabase as any).from("account_entitlements")
      .select("plan,status,current_period_end,scheduled_cancel_at,billing_environment,billing_provider,stripe_customer_id,stripe_subscription_id")
      .eq("user_id", context.userId).maybeSingle();
    const matching = data?.billing_environment === "sandbox" && data?.billing_provider === "stripe";
    return {
      configured,
      checkoutEnabled: configured && allowed && stripeCheckoutEnabled(),
      environment: "sandbox" as const,
      provider: "stripe" as const,
      trialEligible: !data?.stripe_subscription_id,
      plan: matching ? effectivePlan(data, new Date(), "sandbox") : "free" as const,
      membership: matching ? { status: data.status, currentPeriodEnd: data.current_period_end, scheduledCancelAt: data.scheduled_cancel_at } : null,
      canManage: configured && allowed && matching && !!data?.stripe_customer_id,
    };
  });

export const createCheckoutTransaction = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { stripeCheckoutEnabled, stripeRequest, STRIPE_SANDBOX_EMAIL, STRIPE_SANDBOX_PRICE_ID } = await import("./stripe.server");
    if (!stripeCheckoutEnabled() || !(await sandboxActive())) throw new Error("Premium sign-ups are paused while payments are being set up");
    const email = String((context.claims as any)?.email ?? "").toLowerCase();
    if (email !== STRIPE_SANDBOX_EMAIL) throw new Error("Stripe test checkout is limited to the sandbox account");
    const { data: existing } = await (context.supabase as any).from("account_entitlements")
      .select("plan,status,current_period_end,billing_environment,billing_provider,stripe_customer_id,stripe_subscription_id")
      .eq("user_id", context.userId).maybeSingle();
    if (existing?.billing_provider === "stripe" && effectivePlan(existing, new Date(), "sandbox") === "premium") throw new Error("This account already has Premium. Open Membership to manage it.");
    const params = new URLSearchParams({
      mode: "subscription",
      "line_items[0][price]": STRIPE_SANDBOX_PRICE_ID,
      "line_items[0][quantity]": "1",
      client_reference_id: context.userId,
      "subscription_data[metadata][user_id]": context.userId,
      "payment_method_collection": "always",
      success_url: "https://landingpagebuilder.aurunex.com/membership?stripe=success",
      cancel_url: "https://landingpagebuilder.aurunex.com/membership?stripe=cancel",
    });
    if (existing?.stripe_customer_id) params.set("customer", existing.stripe_customer_id);
    else params.set("customer_email", email);
    if (!existing?.stripe_subscription_id) params.set("subscription_data[trial_period_days]", "9");
    if (process.env["STRIPE_MANAGED_PAYMENTS_ENABLED"] === "true") params.set("managed_payments[enabled]", "true");
    const session = await stripeRequest("checkout/sessions", params);
    if (session?.livemode !== false || typeof session?.url !== "string" || !session.url.startsWith("https://checkout.stripe.com/")) throw new Error("Could not start Stripe checkout");
    return { checkoutUrl: session.url };
  });

async function billingPortal(userId: string, email: string) {
  const { stripeConfigured, stripeRequest, STRIPE_SANDBOX_EMAIL } = await import("./stripe.server");
  if (!stripeConfigured() || !(await sandboxActive()) || email.toLowerCase() !== STRIPE_SANDBOX_EMAIL) throw new Error("Billing is not configured yet");
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data } = await (supabaseAdmin as any).from("account_entitlements")
    .select("billing_provider,billing_environment,stripe_customer_id").eq("user_id", userId).maybeSingle();
  if (data?.billing_provider !== "stripe" || data?.billing_environment !== "sandbox" || !data?.stripe_customer_id) throw new Error("No Stripe subscription found for this account");
  const session = await stripeRequest("billing_portal/sessions", new URLSearchParams({
    customer: data.stripe_customer_id,
    return_url: "https://landingpagebuilder.aurunex.com/membership",
  }));
  if (typeof session?.url !== "string" || !session.url.startsWith("https://billing.stripe.com/")) throw new Error("Could not open billing management");
  return { url: session.url };
}

export const createBillingPortal = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => billingPortal(context.userId, String((context.claims as any)?.email ?? "")));

export const createCancellationPortal = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => billingPortal(context.userId, String((context.claims as any)?.email ?? "")));
