import { createFileRoute } from "@tanstack/react-router";
import { mapSubscriptionEvent, verifyBinding, verifyPaddleSignature } from "@/lib/paddle";

export const Route = createFileRoute("/api/public/paddle-webhook")({
  staticData: { sitemap: false },
  server: {
    handlers: {
      POST: async ({ request }) => {
        const secret = process.env["PADDLE_WEBHOOK_SECRET"] ?? "";
        const priceId = process.env["PADDLE_PRICE_ID"] ?? "";
        if (!secret || !priceId) return new Response("Not configured", { status: 503 });
        const raw = await request.text(); // exact raw body — required for the signature
        if (raw.length > 1_000_000) return new Response("Too large", { status: 413 });
        if (!(await verifyPaddleSignature(raw, request.headers.get("paddle-signature"), secret))) return new Response("Invalid signature", { status: 401 });

        let event: any;
        try { event = JSON.parse(raw); } catch { return new Response("Bad JSON", { status: 400 }); }
        if (typeof event?.event_id !== "string") return new Response("Bad event", { status: 400 });

        // Only honour user bindings our server created (see createCheckoutTransaction).
        const update = (await verifyBinding(event, secret)) ? mapSubscriptionEvent(event, priceId) : null;
        const occurredAt = typeof event.occurred_at === "string" && !isNaN(Date.parse(event.occurred_at)) ? event.occurred_at : new Date().toISOString();
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        // One atomic DB transaction: dedupe + ordering + entitlement update.
        const { data, error } = await (supabaseAdmin as any).rpc("apply_paddle_event", {
          p_event_id: event.event_id, p_event_type: String(event.event_type ?? ""), p_occurred_at: occurredAt, p_ent: update,
        });
        if (error) return new Response("Processing failed", { status: 500 }); // nothing committed; Paddle retries
        return new Response(`ok (${data})`);
      },
    },
  },
});
