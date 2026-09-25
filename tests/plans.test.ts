import { describe, expect, it } from "vitest";
import { effectivePlan, friendlyLimitError, isProfileArchived, isTabArchived, limitMessage, limitsFor } from "../src/lib/plans";

const now = new Date("2026-09-25T12:00:00Z");
describe("plans", () => {
  it("defaults to free with no entitlement", () => {
    expect(effectivePlan(null, now)).toBe("free");
    expect(limitsFor("free")).toEqual({ profiles: 2, tabsPerProfile: 5 });
  });
  it("premium limits are 10 profiles / 50 tabs", () => expect(limitsFor("premium")).toEqual({ profiles: 10, tabsPerProfile: 50 }));
  it("archives only content beyond the current plan limits, and restores it on Premium", () => {
    expect(isProfileArchived(1, "free")).toBe(false);
    expect(isProfileArchived(2, "free")).toBe(true);
    expect(isTabArchived(4, "free")).toBe(false);
    expect(isTabArchived(5, "free")).toBe(true);
    expect(isTabArchived(0, "free", true)).toBe(true);
    expect(isProfileArchived(2, "premium")).toBe(false);
    expect(isTabArchived(5, "premium")).toBe(false);
  });
  it("active premium is premium only while paid-through (+24h grace)", () => {
    expect(effectivePlan({ plan: "premium", status: "active", current_period_end: "2026-10-25T00:00:00Z" }, now)).toBe("premium");
    expect(effectivePlan({ plan: "premium", status: "active", current_period_end: "2026-09-25T00:00:00Z" }, now)).toBe("premium");
    expect(effectivePlan({ plan: "premium", status: "active", current_period_end: "2026-09-24T11:00:00Z" }, now)).toBe("free");
    expect(effectivePlan({ plan: "premium", status: "active", current_period_end: null }, now)).toBe("free");
  });
  it("canceled premium keeps access until period end", () => {
    expect(effectivePlan({ plan: "premium", status: "canceled", current_period_end: "2026-10-01T00:00:00Z" }, now)).toBe("premium");
    expect(effectivePlan({ plan: "premium", status: "canceled", current_period_end: "2026-09-01T00:00:00Z" }, now)).toBe("free");
    expect(effectivePlan({ plan: "premium", status: "past_due", current_period_end: null }, now)).toBe("free");
  });
  it("unknown plan values fall back to free", () => expect(effectivePlan({ plan: "gold", status: "active", current_period_end: null }, now)).toBe("free"));
  it("sandbox entitlement never grants production access", () => {
    expect(effectivePlan({ plan: "premium", status: "active", current_period_end: "2027-09-25", billing_environment: "sandbox" }, now, "production")).toBe("free");
    expect(effectivePlan({ plan: "premium", status: "active", current_period_end: "2027-09-25", billing_environment: "production" }, now, "production")).toBe("premium");
  });
  it("free copy mentions yearly GBP price", () => {
    const m = limitMessage("tabs", "free");
    expect(m).toContain("5 tabs");
    expect(m).toContain("£9.99 per year");
    expect(m).not.toContain("coming soon");
  });
  it("maps database limit errors", () => {
    expect(friendlyLimitError("PLAN_LIMIT_PROFILES: x", "free")).toContain("2 profiles");
    expect(friendlyLimitError("PLAN_LIMIT_TABS: x", "premium")).toBe("Premium allows up to 50 tabs per profile.");
    expect(friendlyLimitError("duplicate key", "free")).toBeNull();
  });
});
