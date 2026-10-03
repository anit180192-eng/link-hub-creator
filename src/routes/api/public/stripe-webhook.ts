import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/public/stripe-webhook")({
  staticData: { sitemap: false },
  server: { handlers: { POST: async ({ request }) => {
    const secret = process.env["STRIPE_WEBHOOK_SECRET"] ?? "";
    if (!secret.startsWith("whsec_")) return new Response("Not configured", { status: 503 });
    const raw = await request.text();
    if (raw.length > 1_000_000) return new Response("Too large", { status: 413 });
    const { verifyStripeSignature, stripeRequest, stripeEntitlement, stripeConfigured } = await import("@/lib/stripe.server");
    if (!stripeConfigured() || !(await verifyStripeSignature(raw, request.headers.get("stripe-signature"), secret))) return new Response("Invalid signature", { status: 401 });
    let event: any;
    try { event = JSON.parse(raw); } catch { return new Response("Bad JSON", { status: 400 }); }
    if (!/^evt_[A-Za-z0-9]+$/.test(event?.id ?? "") || event?.livemode !== false) return new Response("Bad event", { status: 400 });
    const type = String(event.type ?? "");
    const object = event?.data?.object;
    let subscriptionId: string | undefined;
    if (type.startsWith("customer.subscription.")) subscriptionId = object?.id;
    if (type === "checkout.session.completed" && object?.mode === "subscription") subscriptionId = object?.subscription;
    let entitlement = null;
    if (subscriptionId && /^sub_[A-Za-z0-9]+$/.test(subscriptionId)) {
      // Fetch the current subscription so delayed/out-of-order events cannot restore old access.
      const subscription = await stripeRequest(`subscriptions/${encodeURIComponent(subscriptionId)}`, undefined, "GET");
      entitlement = stripeEntitlement(subscription);
    }
    const occurredAt = Number.isFinite(event.created) ? new Date(event.created * 1000).toISOString() : new Date().toISOString();
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await (supabaseAdmin as any).rpc("apply_stripe_event", {
      p_event_id: event.id, p_event_type: type, p_occurred_at: occurredAt, p_ent: entitlement,
    });
    if (error) return new Response("Processing failed", { status: 500 });
    return new Response(`ok (${data})`);
  } } },
});
