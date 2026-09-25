import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { loadPaddle } from "@/lib/paddleClient";
import { createBillingPortal, createCheckoutTransaction, getBillingConfig } from "@/lib/billing.functions";
import { PLAN_LIMITS, PREMIUM_PRICE_LABEL, type Plan } from "@/lib/plans";

export function PremiumDialog({ open, onOpenChange, plan }: { open: boolean; onOpenChange: (o: boolean) => void; plan: Plan }) {
  const fetchConfig = useServerFn(getBillingConfig);
  const portal = useServerFn(createBillingPortal);
  const startTxn = useServerFn(createCheckoutTransaction);
  const cfg = useQuery({ queryKey: ["billing-config"], queryFn: () => fetchConfig(), enabled: open, staleTime: 60_000 });
  const [busy, setBusy] = useState(false);
  const c = cfg.data;

  const checkout = async () => {
    if (!c?.configured || !c.clientToken) return;
    setBusy(true);
    try {
      const [Paddle, { transactionId }] = await Promise.all([loadPaddle(c.environment, c.clientToken), startTxn()]);
      Paddle.Checkout.open({ transactionId, ...(c.email ? { customer: { email: c.email } } : {}) });
      onOpenChange(false);
    } catch (e) { toast.error(e instanceof Error ? e.message : "Couldn't open checkout"); } finally { setBusy(false); }
  };
  const manage = async () => {
    setBusy(true);
    try { const { url } = await portal(); window.open(url, "_blank", "noopener"); } catch (e) { toast.error(e instanceof Error ? e.message : "Couldn't open billing"); } finally { setBusy(false); }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{plan === "premium" ? "You're on Premium" : c?.configured ? "Go Premium" : "Premium — coming soon"}</DialogTitle>
          <DialogDescription>
            Premium costs {PREMIUM_PRICE_LABEL} (GBP), billed yearly. Free: {PLAN_LIMITS.free.profiles} profiles, {PLAN_LIMITS.free.tabsPerProfile} tabs per profile. Premium: {PLAN_LIMITS.premium.profiles} profiles, {PLAN_LIMITS.premium.tabsPerProfile} tabs per profile.
            {c && !c.configured ? " Checkout isn't available yet — your account stays on Free until it launches." : ""}
            {c?.configured ? " Test mode: no real charges." : ""}
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-wrap justify-end gap-2">
          {c?.canManage ? <Button variant="outline" disabled={busy} onClick={manage}>Manage billing</Button> : null}
          {plan !== "premium" ? <Button disabled={busy || !c?.configured} onClick={checkout}>{c?.configured ? `Upgrade — ${PREMIUM_PRICE_LABEL}` : "Coming soon"}</Button> : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}
