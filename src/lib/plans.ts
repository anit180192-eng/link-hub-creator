export type Plan = "free" | "premium";
export type EntitlementRow = { plan: string; status: string; current_period_end: string | null } | null | undefined;

export const PLAN_LIMITS: Record<Plan, { profiles: number; tabsPerProfile: number }> = {
  free: { profiles: 2, tabsPerProfile: 5 },
  premium: { profiles: 10, tabsPerProfile: 50 },
};
export const PREMIUM_PRICE_LABEL = "£9.99 per year";
/** Checkout is not configured yet — keep Premium marked as coming soon. */
export const PREMIUM_CHECKOUT_AVAILABLE = false;

/** Mirrors public.effective_plan() in the database. */
export function effectivePlan(row: EntitlementRow, now = new Date()): Plan {
  if (!row || row.plan !== "premium") return "free";
  if (row.status === "active") return "premium";
  if ((row.status === "past_due" || row.status === "canceled") && row.current_period_end && new Date(row.current_period_end) > now) return "premium";
  return "free";
}
export const limitsFor = (plan: Plan) => PLAN_LIMITS[plan];

export function limitMessage(kind: "profiles" | "tabs", plan: Plan): string {
  const l = PLAN_LIMITS[plan];
  if (plan === "premium") return kind === "profiles" ? `Premium allows up to ${l.profiles} profiles.` : `Premium allows up to ${l.tabsPerProfile} tabs per profile.`;
  const base = kind === "profiles" ? `The Free plan allows up to ${l.profiles} profiles.` : `The Free plan allows up to ${l.tabsPerProfile} tabs per profile.`;
  return `${base} Premium (${PREMIUM_PRICE_LABEL}, coming soon) allows ${PLAN_LIMITS.premium.profiles} profiles and ${PLAN_LIMITS.premium.tabsPerProfile} tabs per profile.`;
}

/** Turns a database limit error into friendly copy; returns null for other errors. */
export function friendlyLimitError(message: string, plan: Plan): string | null {
  if (message.includes("PLAN_LIMIT_PROFILES")) return limitMessage("profiles", plan);
  if (message.includes("PLAN_LIMIT_TABS")) return limitMessage("tabs", plan);
  return null;
}
