import { describe, expect, it } from "vitest";
import { hmacHex, mapSubscriptionEvent, paddleApiBase, verifyPaddleSignature } from "../src/lib/paddle";

const secret = "pdl_ntfset_test_secret";
const body = '{"event_id":"evt_1","event_type":"subscription.created"}';
const now = 1_790_000_000;
const sign = async (ts: number, b = body, s = secret) => `ts=${ts};h1=${await hmacHex(s, `${ts}:${b}`)}`;

describe("verifyPaddleSignature", () => {
  it("accepts a valid signature on the raw body", async () => expect(await verifyPaddleSignature(body, await sign(now), secret, now)).toBe(true));
  it("rejects a tampered body", async () => expect(await verifyPaddleSignature(body + " ", await sign(now), secret, now)).toBe(false));
  it("rejects a wrong secret", async () => expect(await verifyPaddleSignature(body, await sign(now, body, "other"), secret, now)).toBe(false));
  it("rejects old timestamps (replay)", async () => expect(await verifyPaddleSignature(body, await sign(now - 301), secret, now)).toBe(false));
  it("rejects missing/malformed headers", async () => {
    expect(await verifyPaddleSignature(body, null, secret, now)).toBe(false);
    expect(await verifyPaddleSignature(body, "ts=abc;h1=00", secret, now)).toBe(false);
    expect(await verifyPaddleSignature(body, await sign(now), "", now)).toBe(false);
  });
});

const uid = "3f1c2b8e-1111-4a2b-9c3d-123456789abc";
const ev = (over: any = {}) => ({
  event_id: "evt_1", event_type: "subscription.activated", occurred_at: "2026-09-25T12:00:00Z",
  data: { id: "sub_1", status: "active", customer_id: "ctm_1", custom_data: { user_id: uid }, items: [{ price: { id: "pri_premium" } }], current_billing_period: { ends_at: "2027-09-25T12:00:00Z" }, ...over },
});

describe("mapSubscriptionEvent", () => {
  it("maps an active Premium subscription", () => {
    expect(mapSubscriptionEvent(ev(), "pri_premium")).toMatchObject({ user_id: uid, plan: "premium", status: "active", paddle_customer_id: "ctm_1", paddle_subscription_id: "sub_1", current_period_end: "2027-09-25T12:00:00Z" });
  });
  it("maps canceled and past_due", () => {
    expect(mapSubscriptionEvent(ev({ status: "canceled" }), "pri_premium")?.status).toBe("canceled");
    expect(mapSubscriptionEvent(ev({ status: "past_due" }), "pri_premium")?.status).toBe("past_due");
  });
  it("ignores other prices, missing/invalid user ids, and non-subscription events", () => {
    expect(mapSubscriptionEvent(ev(), "pri_other")).toBeNull();
    expect(mapSubscriptionEvent(ev({ custom_data: {} }), "pri_premium")).toBeNull();
    expect(mapSubscriptionEvent(ev({ custom_data: { user_id: "x' or 1=1" } }), "pri_premium")).toBeNull();
    expect(mapSubscriptionEvent({ ...ev(), event_type: "transaction.completed" }, "pri_premium")).toBeNull();
  });
  it("defaults to the sandbox API", () => {
    expect(paddleApiBase(undefined)).toBe("https://sandbox-api.paddle.com");
    expect(paddleApiBase("production")).toBe("https://api.paddle.com");
  });
});
