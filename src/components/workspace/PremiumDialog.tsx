import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { createBillingPortal, createCancellationPortal, createCheckoutTransaction, getBillingConfig } from "@/lib/billing.functions";
import { PLAN_LIMITS, PREMIUM_PRICE_LABEL, PREMIUM_TRIAL_LABEL } from "@/lib/plans";

const dateLabel = (value: string | null | undefined) => value ? new Intl.DateTimeFormat("en-GB", { dateStyle: "long" }).format(new Date(value)) : "—";

export function PremiumDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const fetchConfig = useServerFn(getBillingConfig);
  const portal = useServerFn(createBillingPortal);
  const cancelPortal = useServerFn(createCancellationPortal);
  const startTxn = useServerFn(createCheckoutTransaction);
  const cfg = useQuery({ queryKey: ["billing-config"], queryFn: () => fetchConfig(), enabled: open, refetchInterval: open ? 3000 : false });
  const [busy, setBusy] = useState(false);
  const c = cfg.data;
  const premium = c?.plan === "premium";
  const trialing = c?.membership?.status === "trialing";
  const renewalStopping = c?.membership?.status === "canceled" || Boolean(c?.membership?.scheduledCancelAt);

  const checkout = async () => {
    if (!c?.checkoutEnabled) return;
    setBusy(true);
    try {
      const { checkoutUrl } = await startTxn();
      window.location.assign(checkoutUrl);
    } catch (e) { toast.error(e instanceof Error ? e.message : "Couldn't open checkout"); } finally { setBusy(false); }
  };
  const manage = async (cancel = false) => {
    setBusy(true);
    try { const { url } = cancel ? await cancelPortal() : await portal(); window.location.assign(url); } catch (e) { toast.error(e instanceof Error ? e.message : "Couldn't open billing"); } finally { setBusy(false); }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{premium ? "Your Premium membership" : c?.checkoutEnabled ? "Go Premium" : "Premium sign-ups paused"}</DialogTitle>
          <DialogDescription>
            {c?.checkoutEnabled && c.trialEligible ? PREMIUM_TRIAL_LABEL : PREMIUM_PRICE_LABEL} (GBP). Free: {PLAN_LIMITS.free.profiles} profiles, {PLAN_LIMITS.free.tabsPerProfile} tabs per profile. Premium: {PLAN_LIMITS.premium.profiles} profiles, {PLAN_LIMITS.premium.tabsPerProfile} tabs per profile.
            {c && !c.checkoutEnabled ? " New memberships will open once payment setup is approved. Your Free account remains available." : ""}
            {c?.checkoutEnabled && c.environment === "sandbox" ? " Test mode: no real charges." : ""}
          </DialogDescription>
        </DialogHeader>
        {premium ? <div className="rounded-md border p-4 text-sm"><p className="font-semibold text-emerald-600">{trialing ? "Free trial active" : "Active member"}</p><p className="mt-2">{renewalStopping ? "Access until" : trialing ? "Trial ends" : "Current period ends"}: <strong>{dateLabel(c?.membership?.currentPeriodEnd)}</strong></p><p className="mt-2">{renewalStopping ? "Cancellation scheduled; no next charge." : trialing ? "Stripe will charge £9.99 for the first year when your trial ends unless you cancel first." : "Your subscription renews yearly unless you cancel it in Stripe."}</p></div> : null}
        <div className="flex flex-wrap justify-end gap-2">
          {c?.canManage ? <Button variant="outline" disabled={busy} onClick={() => manage()}>Manage billing</Button> : null}
          {premium && c?.canManage && !renewalStopping ? <AlertDialog><AlertDialogTrigger asChild><Button variant="outline" disabled={busy}>Cancel renewal</Button></AlertDialogTrigger><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Cancel your next renewal?</AlertDialogTitle><AlertDialogDescription>Cancelling in Stripe stops the next yearly renewal. It does not automatically refund your current payment. Premium access continues until the paid-through date shown here. Stripe will ask you to confirm the cancellation.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Keep membership</AlertDialogCancel><AlertDialogAction onClick={() => manage(true)}>Continue to Stripe</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog> : null}
          {!premium ? <Button disabled={busy || !c?.checkoutEnabled} onClick={checkout}>{c?.checkoutEnabled ? c.trialEligible ? "Start 9-day free trial" : `Upgrade — ${PREMIUM_PRICE_LABEL}` : "Memberships paused"}</Button> : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}
