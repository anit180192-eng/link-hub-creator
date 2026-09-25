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
    expect(mapSubscriptionEvent(ev(), "pri_premium", "production")).toMatchObject({ user_id: uid, plan: "premium", status: "active", paddle_customer_id: "ctm_1", paddle_subscription_id: "sub_1", billing_environment: "production", current_period_end: "2027-09-25T12:00:00Z" });
  });
  it("maps canceled and past_due", () => {
    expect(mapSubscriptionEvent(ev({ status: "canceled" }), "pri_premium")?.status).toBe("canceled");
    expect(mapSubscriptionEvent(ev({ status: "past_due" }), "pri_premium")?.status).toBe("past_due");
  });
  it("preserves trialing status and its trial end date", () => {
    expect(mapSubscriptionEvent(ev({ status: "trialing", current_billing_period: { ends_at: "2026-10-04T12:00:00Z" } }), "pri_premium") ).toMatchObject({ status: "trialing", current_period_end: "2026-10-04T12:00:00Z" });
  });
  it("tracks an end-of-period cancellation without revoking active access", () => {
    const update = mapSubscriptionEvent(ev({ scheduled_change: { action: "cancel", effective_at: "2027-09-25T12:00:00Z" } }), "pri_premium");
    expect(update).toMatchObject({ status: "active", scheduled_cancel_at: "2027-09-25T12:00:00Z" });
    expect(mapSubscriptionEvent(ev({ scheduled_change: null }), "pri_premium")?.scheduled_cancel_at).toBeNull();
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

import { bindingSig, isTransactionId, verifyBinding } from "../src/lib/paddle";
describe("server-issued user binding", () => {
  const ws = "pdl_ntfset_secret";
  const withCd = (cd: any) => ({ data: { custom_data: cd } });
  it("accepts a binding created by the server", async () => expect(await verifyBinding(withCd({ user_id: uid, lpb_sig: await bindingSig(uid, ws) }), ws)).toBe(true));
  it("rejects browser-edited user ids and missing/forged tags", async () => {
    const sig = await bindingSig(uid, ws);
    expect(await verifyBinding(withCd({ user_id: "3f1c2b8e-2222-4a2b-9c3d-123456789abc", lpb_sig: sig }), ws)).toBe(false);
    expect(await verifyBinding(withCd({ user_id: uid }), ws)).toBe(false);
    expect(await verifyBinding(withCd({ user_id: uid, lpb_sig: await bindingSig(uid, "other") }), ws)).toBe(false);
    expect(await verifyBinding(withCd({ user_id: uid, lpb_sig: sig }), "")).toBe(false);
  });
});
describe("_ptxn payment links", () => {
  it("accepts Paddle transaction ids only", () => {
    expect(isTransactionId("txn_01h04vsc0qhwtsbsxh3422wjs4")).toBe(true);
    expect(isTransactionId("txn_bad")).toBe(false);
    expect(isTransactionId("javascript:alert(1)")).toBe(false);
    expect(isTransactionId(undefined)).toBe(false);
  });
});
