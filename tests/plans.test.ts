import { describe, expect, it } from "vitest";
import { effectivePlan, friendlyLimitError, limitMessage, limitsFor, PREMIUM_CHECKOUT_AVAILABLE } from "../src/lib/plans";

const now = new Date("2026-09-25T12:00:00Z");
describe("plans", () => {
  it("defaults to free with no entitlement", () => {
    expect(effectivePlan(null, now)).toBe("free");
    expect(limitsFor("free")).toEqual({ profiles: 2, tabsPerProfile: 5 });
  });
  it("premium limits are 10 profiles / 50 tabs", () => expect(limitsFor("premium")).toEqual({ profiles: 10, tabsPerProfile: 50 }));
  it("active premium is premium", () => expect(effectivePlan({ plan: "premium", status: "active", current_period_end: null }, now)).toBe("premium"));
  it("canceled premium keeps access until period end", () => {
    expect(effectivePlan({ plan: "premium", status: "canceled", current_period_end: "2026-10-01T00:00:00Z" }, now)).toBe("premium");
    expect(effectivePlan({ plan: "premium", status: "canceled", current_period_end: "2026-09-01T00:00:00Z" }, now)).toBe("free");
    expect(effectivePlan({ plan: "premium", status: "past_due", current_period_end: null }, now)).toBe("free");
  });
  it("unknown plan values fall back to free", () => expect(effectivePlan({ plan: "gold", status: "active", current_period_end: null }, now)).toBe("free"));
  it("free copy mentions yearly GBP price and coming soon", () => {
    const m = limitMessage("tabs", "free");
    expect(m).toContain("5 tabs");
    expect(m).toContain("£9.99 per year");
    expect(m).toContain("coming soon");
  });
  it("maps database limit errors", () => {
    expect(friendlyLimitError("PLAN_LIMIT_PROFILES: x", "free")).toContain("2 profiles");
    expect(friendlyLimitError("PLAN_LIMIT_TABS: x", "premium")).toBe("Premium allows up to 50 tabs per profile.");
    expect(friendlyLimitError("duplicate key", "free")).toBeNull();
  });
  it("checkout stays disabled until configured", () => expect(PREMIUM_CHECKOUT_AVAILABLE).toBe(false));
});
