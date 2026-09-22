import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { AlertCircle, Check, ChevronDown, KeyRound, Lock, LockOpen, MonitorSmartphone, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import {
  getSecurityStatus,
  removeAllBrowsers,
  removeTrustedBrowser,
  setPin,
} from "@/lib/security.functions";

function formatDate(value: string) {
  return new Date(value).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
}

function PinInput({ id, value, onChange, label }: { id: string; value: string; onChange: (v: string) => void; label: string }) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      <InputOTP id={id} maxLength={6} inputMode="numeric" pattern="^[0-9]*$" value={value} onChange={onChange}>
        <InputOTPGroup>
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <InputOTPSlot key={i} index={i} className="h-10 w-10" />
          ))}
        </InputOTPGroup>
      </InputOTP>
    </div>
  );
}

export function PinSecurityPanel({
  pageName,
  pageProtected,
  onToggle,
  toggling,
}: {
  pageName: string;
  pageProtected: boolean;
  onToggle: (value: boolean) => void;
  toggling: boolean;
}) {
  const queryClient = useQueryClient();
  const fetchStatus = useServerFn(getSecurityStatus);
  const savePin = useServerFn(setPin);
  const removeOne = useServerFn(removeTrustedBrowser);
  const removeAll = useServerFn(removeAllBrowsers);

  const status = useQuery({ queryKey: ["security"], queryFn: () => fetchStatus() });
  const [editing, setEditing] = useState(false);
  const [pin, setPinValue] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);

  const hasPin = !!status.data?.hasPin;
  const devices = status.data?.devices ?? [];

  const savePinMutation = useMutation({
    mutationFn: async () => {
      if (!/^\d{6}$/.test(pin)) throw new Error("Your PIN must be exactly 6 digits.");
      if (/^(\d)\1{5}$/.test(pin) || "0123456789".includes(pin) || "9876543210".includes(pin)) {
        throw new Error("Pick something harder to guess than repeated or sequential digits.");
      }
      if (pin !== confirm) throw new Error("The two PINs don't match.");
      await savePin({ data: { pin } });
    },
    onSuccess: () => {
      toast.success(hasPin ? "PIN changed" : "PIN saved");
      setPinValue("");
      setConfirm("");
      setError(null);
      setEditing(false);
      queryClient.invalidateQueries({ queryKey: ["security"] });
    },
    onError: (e: Error) => setError(e.message),
  });

  const removeMutation = useMutation({
    mutationFn: (id: string | null) => (id ? removeOne({ data: { id } }) : removeAll()),
    onSuccess: (_d, id) => {
      toast.success(id ? "Browser removed" : "All browsers removed");
      queryClient.invalidateQueries({ queryKey: ["security"] });
    },
    onError: () => toast.error("Couldn't remove that browser"),
  });

  const showForm = !hasPin || editing;

  return (
    <section className="rounded-xl border border-border bg-card p-6" aria-labelledby="pin-heading">
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-border bg-background text-primary">
          <KeyRound className="h-5 w-5" aria-hidden="true" />
        </span>
        <div>
          <h2 id="pin-heading" className="font-display text-lg">PIN & trusted browsers</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Your page link is public, so anyone with it could see your links. Add a 6-digit PIN to keep them private.
          </p>
        </div>
      </div>

      <div className="mt-4 rounded-lg border border-border bg-background p-4 text-sm">
        <p className="font-semibold text-foreground">How the PIN works across your pages</p>
        <ul className="mt-2 space-y-1.5 text-muted-foreground">
          <li className="flex gap-2">
            <span className="text-primary" aria-hidden="true">•</span>
            <span><span className="font-medium text-foreground">One PIN for every page.</span> You set it once and it protects all your pages — personal, office, any page you create.</span>
          </li>
          <li className="flex gap-2">
            <span className="text-primary" aria-hidden="true">•</span>
            <span><span className="font-medium text-foreground">Lock each page separately.</span> The switch below turns the PIN on or off for the page you're editing. You can lock some pages and leave others open.</span>
          </li>
          <li className="flex gap-2">
            <span className="text-primary" aria-hidden="true">•</span>
            <span><span className="font-medium text-foreground">Trusted browsers skip the PIN everywhere.</span> Once a browser is trusted, it opens any of your locked pages without asking — across every page you own.</span>
          </li>
        </ul>
      </div>

      <ol className="mt-4 grid gap-2 text-sm text-muted-foreground sm:grid-cols-3">
        <li className="rounded-lg border border-border bg-background p-3">
          <span className="font-semibold text-foreground">1. New browser</span>
          <br />The first time your link opens in a browser, it asks for your PIN.
        </li>
        <li className="rounded-lg border border-border bg-background p-3">
          <span className="font-semibold text-foreground">2. Trust it</span>
          <br />After the right PIN, you choose whether to trust that browser.
        </li>
        <li className="rounded-lg border border-border bg-background p-3">
          <span className="font-semibold text-foreground">3. No more PIN</span>
          <br />Trusted browsers open straight away. Others ask every time.
        </li>
      </ol>

      {/* Account PIN */}
      <div className="mt-5 border-t border-border pt-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm font-semibold">Your PIN</p>
          {status.isLoading ? null : hasPin ? (
            <span className="inline-flex items-center gap-1 text-xs font-medium text-accent">
              <Check className="h-3.5 w-3.5" aria-hidden="true" /> PIN is set
              {status.data?.pinUpdatedAt ? ` · ${formatDate(status.data.pinUpdatedAt)}` : ""}
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground">
              <AlertCircle className="h-3.5 w-3.5" aria-hidden="true" /> No PIN yet
            </span>
          )}
        </div>
        <p className="mt-1 text-xs text-muted-foreground">
          One PIN covers all your pages. We store it scrambled, so nobody — not even us — can read it.
        </p>

        {status.isLoading ? null : showForm ? (
          <form
            className="mt-4 space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              savePinMutation.mutate();
            }}
          >
            <div className="flex flex-wrap gap-6">
              <PinInput id="new-pin" label={hasPin ? "New PIN" : "Choose a PIN"} value={pin} onChange={(v) => { setPinValue(v); setError(null); }} />
              <PinInput id="confirm-pin" label="Type it again" value={confirm} onChange={(v) => { setConfirm(v); setError(null); }} />
            </div>
            {error ? (
              <p role="alert" className="flex items-start gap-2 text-sm text-destructive">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" /> {error}
              </p>
            ) : null}
            <div className="flex gap-2">
              <Button type="submit" disabled={savePinMutation.isPending || pin.length !== 6 || confirm.length !== 6}>
                {savePinMutation.isPending ? "Saving…" : hasPin ? "Change PIN" : "Save PIN"}
              </Button>
              {hasPin ? (
                <Button type="button" variant="ghost" onClick={() => { setEditing(false); setError(null); setPinValue(""); setConfirm(""); }}>
                  Cancel
                </Button>
              ) : null}
            </div>
          </form>
        ) : (
          <Button className="mt-3" variant="outline" size="sm" onClick={() => setEditing(true)}>
            Change PIN
          </Button>
        )}
      </div>

      {/* Per page toggle */}
      <div className="mt-5 flex items-start justify-between gap-4 border-t border-border pt-5">
        <div>
          <Label htmlFor="pin-protect" className="flex items-center gap-2 text-sm font-semibold">
            {pageProtected ? <Lock className="h-4 w-4 text-primary" aria-hidden="true" /> : <LockOpen className="h-4 w-4 text-muted-foreground" aria-hidden="true" />}
            Ask for the PIN on “{pageName || "this page"}”
          </Label>
          <p className="mt-1 text-xs text-muted-foreground">
            {hasPin
              ? pageProtected
                ? "On. New browsers must enter your PIN to see this page's links."
                : "Off. Anyone with the link can see this page."
              : "Save a PIN above to turn this on."}
          </p>
        </div>
        <Switch
          id="pin-protect"
          checked={pageProtected}
          disabled={toggling || (!hasPin && !pageProtected)}
          onCheckedChange={onToggle}
        />
      </div>

      {/* Trusted browsers */}
      <div className="mt-5 border-t border-border pt-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm font-semibold">Trusted browsers</p>
          {devices.length > 1 ? (
            <Button
              variant="ghost"
              size="sm"
              disabled={removeMutation.isPending}
              onClick={() => {
                if (window.confirm("Remove all trusted browsers? Each one will ask for your PIN again.")) {
                  removeMutation.mutate(null);
                }
              }}
            >
              Remove all
            </Button>
          ) : null}
        </div>
        <p className="mt-1 text-xs text-muted-foreground">
          These browsers won't ask for your PIN. Remove any you don't recognise, or ones you no longer use.
        </p>
        {devices.length === 0 ? (
          <p className="mt-3 rounded-lg border border-dashed border-border px-3 py-4 text-center text-sm text-muted-foreground">
            No trusted browsers yet.
          </p>
        ) : (
          <ul className="mt-3 divide-y divide-border rounded-lg border border-border bg-background">
            {devices.map((device) => (
              <li key={device.id} className="flex items-center gap-3 px-3 py-2.5">
                <MonitorSmartphone className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{device.label || "Browser"}</p>
                  <p className="text-xs text-muted-foreground">
                    Trusted {formatDate(device.created_at)} · last used {formatDate(device.last_used_at)}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  aria-label={`Remove ${device.label || "browser"}`}
                  disabled={removeMutation.isPending}
                  onClick={() => removeMutation.mutate(device.id)}
                >
                  <Trash2 className="h-4 w-4" aria-hidden="true" />
                </Button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
