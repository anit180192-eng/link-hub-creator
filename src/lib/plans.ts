export type Plan = "free" | "premium";
export type BillingEnvironment = "sandbox" | "production";
export type EntitlementRow = { plan: string; status: string; current_period_end: string | null; billing_environment?: string | null } | null | undefined;

export const PLAN_LIMITS: Record<Plan, { profiles: number; tabsPerProfile: number }> = {
  free: { profiles: 2, tabsPerProfile: 5 },
  premium: { profiles: 10, tabsPerProfile: 50 },
};
export const PREMIUM_PRICE_LABEL = "£9.99 per year";

/** Renewal webhooks can arrive late; allow 24h after period end before an "active" row stops counting. */
export const ACTIVE_GRACE_MS = 24 * 60 * 60 * 1000;

/** Mirrors public.effective_plan() in the database. */
export function effectivePlan(row: EntitlementRow, now = new Date(), environment: BillingEnvironment = "sandbox"): Plan {
  if (!row || row.plan !== "premium" || !row.current_period_end || (row.billing_environment ?? "sandbox") !== environment) return "free";
  const end = new Date(row.current_period_end).getTime();
  if (isNaN(end)) return "free";
  if (row.status === "active") return end + ACTIVE_GRACE_MS > now.getTime() ? "premium" : "free";
  if (row.status === "past_due" || row.status === "canceled") return end > now.getTime() ? "premium" : "free";
  return "free";
}
export const limitsFor = (plan: Plan) => PLAN_LIMITS[plan];

/** Keep excess content visible and intact after a downgrade, but prevent opening it. */
export const isProfileArchived = (index: number, plan: Plan) => index < 0 || index >= PLAN_LIMITS[plan].profiles;
export const isTabArchived = (index: number, plan: Plan, profileArchived = false) =>
  profileArchived || index < 0 || index >= PLAN_LIMITS[plan].tabsPerProfile;

export function limitMessage(kind: "profiles" | "tabs", plan: Plan): string {
  const l = PLAN_LIMITS[plan];
  if (plan === "premium") return kind === "profiles" ? `Premium allows up to ${l.profiles} profiles.` : `Premium allows up to ${l.tabsPerProfile} tabs per profile.`;
  const base = kind === "profiles" ? `The Free plan allows up to ${l.profiles} profiles.` : `The Free plan allows up to ${l.tabsPerProfile} tabs per profile.`;
  return `${base} Premium (${PREMIUM_PRICE_LABEL}) allows ${PLAN_LIMITS.premium.profiles} profiles and ${PLAN_LIMITS.premium.tabsPerProfile} tabs per profile.`;
}

/** Turns a database limit error into friendly copy; returns null for other errors. */
export function friendlyLimitError(message: string, plan: Plan): string | null {
  if (message.includes("PLAN_LIMIT_PROFILES")) return limitMessage("profiles", plan);
  if (message.includes("PLAN_LIMIT_TABS")) return limitMessage("tabs", plan);
  return null;
}
