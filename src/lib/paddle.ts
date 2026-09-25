// Pure Paddle Billing helpers (no secrets, no I/O) — safe to unit test.
export const SIGNATURE_TOLERANCE_SECONDS = 300;

const enc = new TextEncoder();
const toHex = (buf: ArrayBuffer) => [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
function safeEqual(a: string, b: string) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export async function hmacHex(secret: string, message: string) {
  const key = await crypto.subtle.importKey("raw", enc.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  return toHex(await crypto.subtle.sign("HMAC", key, enc.encode(message)));
}

/** Verifies a `Paddle-Signature: ts=...;h1=...` header against the exact raw body. */
export async function verifyPaddleSignature(rawBody: string, header: string | null, secret: string, nowSeconds = Math.floor(Date.now() / 1000)) {
  if (!header || !secret) return false;
  const parts = header.split(";").map((p) => p.trim().split("="));
  const ts = parts.find(([k]) => k === "ts")?.[1];
  const sigs = parts.filter(([k]) => k === "h1").map(([, v]) => v ?? "");
  if (!ts || !/^\d+$/.test(ts) || !sigs.length) return false;
  if (Math.abs(nowSeconds - Number(ts)) > SIGNATURE_TOLERANCE_SECONDS) return false;
  const expected = await hmacHex(secret, `${ts}:${rawBody}`);
  return sigs.some((s) => safeEqual(s, expected));
}

export type EntitlementUpdate = {
  user_id: string;
  plan: "free" | "premium";
  status: "active" | "trialing" | "past_due" | "canceled";
  current_period_end: string | null;
  scheduled_cancel_at: string | null;
  paddle_customer_id: string | null;
  paddle_subscription_id: string;
  billing_environment: "sandbox" | "production";
  last_event_at: string;
};

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Maps a subscription.* event for our Premium price to an entitlement row, or null to ignore. */
export function mapSubscriptionEvent(event: any, premiumPriceId: string, environment: "sandbox" | "production" = "sandbox"): EntitlementUpdate | null {
  if (!event || typeof event.event_type !== "string" || !event.event_type.startsWith("subscription.")) return null;
  const d = event.data;
  if (!d?.id) return null;
  const hasPrice = Array.isArray(d.items) && d.items.some((i: any) => i?.price?.id === premiumPriceId);
  if (!hasPrice) return null;
  const userId = d.custom_data?.user_id;
  if (typeof userId !== "string" || !UUID.test(userId)) return null;
  const end = d.current_billing_period?.ends_at ?? d.scheduled_change?.effective_at ?? null;
  const scheduledCancelAt = d.scheduled_change?.action === "cancel" ? d.scheduled_change.effective_at ?? null : null;
  const s = d.status;
  const status = s === "active" || s === "trialing" ? s : s === "past_due" ? "past_due" : "canceled";
  return {
    user_id: userId,
    plan: "premium", // effective access for canceled/past_due is decided by current_period_end
    status,
    current_period_end: end,
    scheduled_cancel_at: scheduledCancelAt,
    paddle_customer_id: d.customer_id ?? null,
    paddle_subscription_id: d.id,
    billing_environment: environment,
    last_event_at: event.occurred_at ?? new Date().toISOString(),
  };
}

/** Server-issued tag binding a checkout to a Supabase user; browsers can't forge it without the webhook secret. */
export const bindingSig = (userId: string, secret: string) => hmacHex(secret, `lpb-user-binding:v1:${userId}`);
export async function verifyBinding(event: any, secret: string) {
  const cd = event?.data?.custom_data;
  if (!cd || typeof cd.user_id !== "string" || typeof cd.lpb_sig !== "string" || !secret) return false;
  return safeEqual(cd.lpb_sig, await bindingSig(cd.user_id, secret));
}
/** Paddle transaction IDs passed as ?_ptxn= on payment links (checkout, payment-method update, dunning). */
export const isTransactionId = (v: unknown): v is string => typeof v === "string" && /^txn_[a-z0-9]{26}$/.test(v);

export const paddleApiBase = (env: string | undefined) => (env === "production" ? "https://api.paddle.com" : "https://sandbox-api.paddle.com");
