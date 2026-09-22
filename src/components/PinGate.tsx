import { useEffect, useRef, useState } from "react";
import { useRouter } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { AlertCircle, Lock, MonitorSmartphone, ShieldCheck } from "lucide-react";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { trustThisBrowser, unlockPage } from "@/lib/public-page.functions";
import type { StartPageProfile } from "@/lib/startpage";

type Step = "pin" | "trust";

export function PinGate({ profile }: { profile: StartPageProfile }) {
  const router = useRouter();
  const unlock = useServerFn(unlockPage);
  const trust = useServerFn(trustThisBrowser);
  const [step, setStep] = useState<Step>("pin");
  const [pin, setPin] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const name = profile.display_name || profile.slug;
  const inputRef = useRef<HTMLInputElement>(null);

  // Put the cursor back in the PIN box after a wrong attempt.
  useEffect(() => {
    if (!busy && step === "pin") inputRef.current?.focus();
  }, [busy, step]);

  async function submit(value = pin) {
    if (value.length !== 6 || busy) return;
    setBusy(true);
    setError(null);
    try {
      const result = await unlock({ data: { slug: profile.slug, pin: value } });
      if (result.ok) {
        setStep("trust");
        return;
      }
      setPin("");
      if (result.reason === "wrong_pin") {
        setError(
          `That PIN isn't right. ${result.remaining} ${result.remaining === 1 ? "try" : "tries"} left before a short lock.`,
        );
      } else if (result.reason === "locked_out") {
        setError(`Too many wrong tries. For safety, try again in ${result.minutes} minutes.`);
      } else if (result.reason === "no_pin") {
        setError("The owner hasn't finished setting up a PIN for this page yet.");
      } else {
        setError("This page isn't available right now.");
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  async function finish(trusted: boolean) {
    setBusy(true);
    try {
      if (trusted) await trust({ data: { slug: profile.slug } });
    } catch {
      /* the visit still works even if trusting fails */
    } finally {
      await router.invalidate();
      setBusy(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-hub-background px-4 py-10 text-hub-foreground">
      <div className="w-full max-w-md">
        <a
          href="https://landingpagebuilder.aurunex.com/"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Landing Page Builder home"
          className="mb-6 inline-flex items-center gap-2 text-[11px] font-semibold text-hub-muted transition-colors hover:text-hub-accent"
        >
          <img src="/favicon.svg" alt="" width={20} height={20} className="h-5 w-5 rounded" />
          Landing Page Builder
        </a>

        <div className="rounded-xl border border-hub-border bg-hub-surface p-6 sm:p-8">
          {step === "pin" ? (
            <>
              <div className="flex items-center gap-3">
                {profile.avatar_url ? (
                  <img src={profile.avatar_url} alt="" className="h-12 w-12 rounded-md border border-hub-border object-cover" />
                ) : (
                  <span className="flex h-12 w-12 items-center justify-center rounded-md border border-hub-border bg-hub-background text-hub-accent">
                    <Lock className="h-5 w-5" aria-hidden="true" />
                  </span>
                )}
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-hub-muted">Private page</p>
                  <h1 className="font-display text-xl font-semibold">{name}</h1>
                </div>
              </div>

              <p className="mt-5 text-sm text-hub-muted">
                Enter the 6-digit PIN to see these links. You only need to do this once on a browser
                you trust.
              </p>

              <form
                className="mt-5"
                onSubmit={(e) => {
                  e.preventDefault();
                  submit();
                }}
              >
                <label htmlFor="page-pin" className="sr-only">6-digit PIN</label>
                <InputOTP
                  id="page-pin"
                  ref={inputRef}
                  maxLength={6}
                  inputMode="numeric"
                  pattern="^[0-9]*$"
                  autoFocus
                  value={pin}
                  disabled={busy}
                  onChange={(value) => {
                    setPin(value);
                    setError(null);
                  }}
                  onComplete={(value: string) => submit(value)}
                  aria-describedby={error ? "pin-error" : undefined}
                >
                  <InputOTPGroup>
                    {[0, 1, 2, 3, 4, 5].map((i) => (
                      <InputOTPSlot key={i} index={i} className="h-12 w-11 border-hub-border text-lg" />
                    ))}
                  </InputOTPGroup>
                </InputOTP>

                {error ? (
                  <p id="pin-error" role="alert" className="mt-3 flex items-start gap-2 text-sm text-destructive">
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                    {error}
                  </p>
                ) : null}

                <button
                  type="submit"
                  disabled={pin.length !== 6 || busy}
                  className="mt-5 inline-flex h-10 w-full items-center justify-center rounded-md bg-hub-accent px-4 text-sm font-semibold text-hub-background transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-hub-accent focus-visible:ring-offset-2 focus-visible:ring-offset-hub-surface active:opacity-80 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {busy ? "Checking…" : "Unlock page"}
                </button>
              </form>
            </>
          ) : (
            <>
              <span className="flex h-12 w-12 items-center justify-center rounded-md border border-hub-border bg-hub-background text-hub-accent">
                <MonitorSmartphone className="h-5 w-5" aria-hidden="true" />
              </span>
              <h1 className="mt-4 font-display text-xl font-semibold">Is this your own device?</h1>
              <p className="mt-2 text-sm text-hub-muted">
                PIN accepted. If you trust this browser, we'll remember it and you won't be asked for
                the PIN here again.
              </p>
              <ul className="mt-4 space-y-2 text-sm text-hub-muted">
                <li className="flex gap-2">
                  <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-hub-accent" aria-hidden="true" />
                  Choose <strong className="text-hub-foreground">Trust this browser</strong> on your own
                  laptop, phone or work computer.
                </li>
                <li className="flex gap-2">
                  <Lock className="mt-0.5 h-4 w-4 shrink-0 text-hub-accent" aria-hidden="true" />
                  Choose <strong className="text-hub-foreground">Just this time</strong> on a shared or
                  public computer. You'll be asked again after the browser is closed.
                </li>
                <li className="flex gap-2">
                  <MonitorSmartphone className="mt-0.5 h-4 w-4 shrink-0 text-hub-accent" aria-hidden="true" />
                  The page owner can remove trusted browsers at any time from their account.
                </li>
              </ul>
              <div className="mt-6 grid gap-2 sm:grid-cols-2">
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => finish(true)}
                  className="inline-flex h-10 items-center justify-center rounded-md bg-hub-accent px-4 text-sm font-semibold text-hub-background transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-hub-accent focus-visible:ring-offset-2 focus-visible:ring-offset-hub-surface active:opacity-80 disabled:opacity-50"
                >
                  Trust this browser
                </button>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => finish(false)}
                  className="inline-flex h-10 items-center justify-center rounded-md border border-hub-border px-4 text-sm font-semibold text-hub-foreground transition-colors hover:bg-hub-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-hub-accent active:opacity-80 disabled:opacity-50"
                >
                  Just this time
                </button>
              </div>
            </>
          )}
        </div>
        <p className="mt-4 text-center text-xs text-hub-muted">
          Built with Landing Page Builder by AuruNex
        </p>
      </div>
    </div>
  );
}
