/** Stripe calls stay on the server. This integration intentionally accepts test keys only. */
export const STRIPE_API_VERSION = "2025-03-31.basil";
export const STRIPE_SANDBOX_PRICE_ID = "price_1UMQLgLEDPL8gWz7TEDxrG6O";
export const STRIPE_SANDBOX_EMAIL = "aurunex.ventures@gmail.com";

export const stripeConfigured = () =>
  (process.env["STRIPE_SECRET_KEY"] ?? "").startsWith("sk_test_") &&
  (process.env["STRIPE_WEBHOOK_SECRET"] ?? "").startsWith("whsec_") &&
  process.env["STRIPE_PRICE_ID"] === STRIPE_SANDBOX_PRICE_ID;

export const stripeCheckoutEnabled = () => stripeConfigured() && process.env["STRIPE_CHECKOUT_ENABLED"] === "true";

export async function stripeRequest(path: string, params?: URLSearchParams, method = "POST") {
  const key = process.env["STRIPE_SECRET_KEY"] ?? "";
  if (!key.startsWith("sk_test_")) throw new Error("Stripe sandbox is not configured");
  const res = await fetch(`https://api.stripe.com/v1/${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${key}`,
      "Stripe-Version": STRIPE_API_VERSION,
      ...(params ? { "Content-Type": "application/x-www-form-urlencoded" } : {}),
    },
    ...(params ? { body: params } : {}),
  });
  const json: any = await res.json().catch(() => null);
  if (!res.ok) throw new Error(json?.error?.message || "Stripe request failed");
  return json;
}

const encode = new TextEncoder();
const toHex = (buffer: ArrayBuffer) => [...new Uint8Array(buffer)].map((part) => part.toString(16).padStart(2, "0")).join("");
const safeEqual = (a: string, b: string) => {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
};

export async function verifyStripeSignature(body: string, header: string | null, secret: string) {
  if (!header || !secret) return false;
  const parts = header.split(",").map((part) => part.trim().split("="));
  const timestamp = parts.find(([name]) => name === "t")?.[1];
  const signatures = parts.filter(([name]) => name === "v1").map(([, value]) => value ?? "");
  if (!timestamp || !/^\d+$/.test(timestamp) || Math.abs(Date.now() / 1000 - Number(timestamp)) > 300 || !signatures.length) return false;
  const key = await crypto.subtle.importKey("raw", encode.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const expected = toHex(await crypto.subtle.sign("HMAC", key, encode.encode(`${timestamp}.${body}`)));
  return signatures.some((signature) => safeEqual(signature, expected));
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export function stripeEntitlement(subscription: any) {
  const userId = subscription?.metadata?.user_id;
  if (!UUID.test(userId ?? "") || !/^sub_[A-Za-z0-9]+$/.test(subscription?.id ?? "") || subscription?.livemode !== false) return null;
  const items = subscription?.items?.data;
  if (!Array.isArray(items) || !items.some((item: any) => item?.price?.id === STRIPE_SANDBOX_PRICE_ID)) return null;
  const status = subscription.status === "trialing" ? "trialing" : subscription.status === "active" ? "active" : subscription.status === "past_due" ? "past_due" : "canceled";
  const itemEnd = Math.max(...items.map((item: any) => Number(item?.current_period_end) || 0));
  const end = status === "trialing" ? Number(subscription.trial_end) : status === "canceled" ? Number(subscription.ended_at) || itemEnd : itemEnd;
  return {
    user_id: userId,
    status,
    current_period_end: end > 0 ? new Date(end * 1000).toISOString() : null,
    scheduled_cancel_at: subscription.cancel_at_period_end && itemEnd > 0 ? new Date(itemEnd * 1000).toISOString() : null,
    stripe_customer_id: typeof subscription.customer === "string" ? subscription.customer : subscription.customer?.id ?? null,
    stripe_subscription_id: subscription.id,
    billing_environment: "sandbox",
  };
}
