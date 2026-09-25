import { createFileRoute } from "@tanstack/react-router";
import { mapSubscriptionEvent, verifyPaddleSignature } from "@/lib/paddle";

export const Route = createFileRoute("/api/public/paddle-webhook")({
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

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const db = supabaseAdmin as any;
        const seen = await db.from("paddle_webhook_events").select("event_id").eq("event_id", event.event_id).maybeSingle();
        if (seen.data) return new Response("ok (duplicate)");

        const update = mapSubscriptionEvent(event, priceId);
        if (update) {
          const cur = await db.from("account_entitlements").select("last_event_at").eq("user_id", update.user_id).maybeSingle();
          const stale = cur.data?.last_event_at && new Date(cur.data.last_event_at) > new Date(update.last_event_at);
          if (!stale) {
            const up = await db.from("account_entitlements").upsert(update, { onConflict: "user_id" });
            if (up.error) return new Response("Update failed", { status: 500 }); // Paddle retries
          }
        }
        const ins = await db.from("paddle_webhook_events").insert({ event_id: event.event_id, event_type: String(event.event_type ?? ""), occurred_at: event.occurred_at ?? null });
        if (ins.error && ins.error.code !== "23505") return new Response("Record failed", { status: 500 });
        return new Response("ok");
      },
    },
  },
});
