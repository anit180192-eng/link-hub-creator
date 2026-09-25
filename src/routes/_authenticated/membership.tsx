import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";
import { Brand } from "@/components/Brand";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { createBillingPortal, createCancellationPortal, getBillingConfig } from "@/lib/billing.functions";
import { PLAN_LIMITS, PREMIUM_PRICE_LABEL } from "@/lib/plans";

export const Route = createFileRoute("/_authenticated/membership")({
  staticData: { sitemap: false },
  head: () => ({ meta: [{ title: "Membership — Landing Page Builder" }] }),
  component: MembershipPage,
});

function MembershipPage() {
  const fetchConfig = useServerFn(getBillingConfig);
  const portal = useServerFn(createBillingPortal);
  const cancelPortal = useServerFn(createCancellationPortal);
  const { data, isLoading, isError } = useQuery({ queryKey: ["billing-config"], queryFn: () => fetchConfig(), refetchInterval: 30_000 });
  const [busy, setBusy] = useState(false);
  const premium = data?.plan === "premium";
  const trialing = data?.membership?.status === "trialing";
  const end = data?.membership?.currentPeriodEnd;
  const endDate = end ? new Intl.DateTimeFormat("en-GB", { dateStyle: "long" }).format(new Date(end)) : "Not available";
  const cancelled = data?.membership?.status === "canceled";
  const renewalStopping = cancelled || Boolean(data?.membership?.scheduledCancelAt);

  async function visitPaddle(cancel: boolean) {
    setBusy(true);
    try {
      const { url } = cancel ? await cancelPortal() : await portal();
      window.location.assign(url);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Couldn't open billing");
      setBusy(false);
    }
  }

  return <div className="dark min-h-screen bg-hub-background px-4 py-8 text-hub-foreground">
    <div className="mx-auto max-w-2xl">
      <div className="flex items-center justify-between"><Brand/><a href="/dashboard" className="text-sm text-hub-accent hover:underline">Back to builder</a></div>
      <main className="mt-8 rounded-lg border border-hub-border bg-hub-surface p-6 sm:p-8">
        <p className="text-xs font-semibold uppercase text-hub-accent">Account</p>
        <h1 className="mt-2 font-display text-3xl font-semibold">Your membership</h1>
        {isLoading ? <p className="mt-6 text-hub-muted">Loading membership…</p> : isError ? <p className="mt-6 text-hub-muted">Membership could not be loaded. Refresh to try again.</p> : <>
          <p className="mt-6 rounded-md border border-hub-accent/40 bg-hub-elevated p-4 font-semibold">{premium ? trialing ? "Premium trial active" : "Premium active" : "Free plan"}</p>
          {premium ? <dl className="mt-6 space-y-4 text-sm">
            <div><dt className="text-hub-muted">{trialing ? "Trial ends" : "Current period ends"}</dt><dd className="mt-1 font-semibold">{endDate}</dd></div>
            <div><dt className="text-hub-muted">{trialing ? "First payment" : "Renewal"}</dt><dd className="mt-1">{renewalStopping ? "Cancellation scheduled — Premium remains until the date above" : trialing ? `£9.99 for the first year on ${endDate}, unless you cancel first` : "Yearly, unless you cancel in Paddle"}</dd></div>
            <div><dt className="text-hub-muted">Included</dt><dd className="mt-1">{PLAN_LIMITS.premium.profiles} profiles · {PLAN_LIMITS.premium.tabsPerProfile} tabs per profile</dd></div>
            {data?.environment === "sandbox" ? <p className="text-hub-muted">This is a sandbox test membership. No real payment was taken.</p> : null}
          </dl> : <p className="mt-5 text-sm text-hub-muted">Free includes {PLAN_LIMITS.free.profiles} profiles and {PLAN_LIMITS.free.tabsPerProfile} tabs per profile. Premium is {PREMIUM_PRICE_LABEL}. Saved items above Free limits stay archived until Premium is restored.</p>}
          {premium && data?.canManage ? <div className="mt-7 flex flex-wrap gap-3">
            <Button variant="outline" disabled={busy} onClick={() => visitPaddle(false)}>Manage billing in Paddle</Button>
            {!renewalStopping ? <AlertDialog><AlertDialogTrigger asChild><Button variant="outline" disabled={busy}>Cancel renewal</Button></AlertDialogTrigger><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Cancel your next renewal?</AlertDialogTitle><AlertDialogDescription>Cancelling stops the next yearly renewal. It does not automatically refund the current payment. Your Premium access continues until {endDate}. Paddle will ask you to confirm the cancellation.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Keep membership</AlertDialogCancel><AlertDialogAction onClick={() => visitPaddle(true)}>Continue to Paddle</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog> : null}
          </div> : null}
        </>}
      </main>
    </div>
  </div>;
}
