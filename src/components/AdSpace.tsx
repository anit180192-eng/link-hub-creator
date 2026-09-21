import { useEffect, useRef, useState } from "react";
import { Megaphone, Settings2, Check, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

declare global {
  interface Window {
    adsbygoogle?: unknown[];
  }
}

const STORAGE_KEY = "lpb.adsense.config";

const ENV_CLIENT = import.meta.env["VITE_GOOGLE_ADSENSE_CLIENT"] as
  | string
  | undefined;
const ENV_SLOT = import.meta.env["VITE_GOOGLE_ADSENSE_SLOT"] as
  | string
  | undefined;

export type AdConfig = { client: string; slot: string };

const CLIENT_RE = /^ca-pub-\d{16}$/;
const SLOT_RE = /^\d{8,12}$/;

export function validateClient(value: string): string | null {
  const v = value.trim();
  if (!v) return "Enter your publisher ID.";
  if (!CLIENT_RE.test(v))
    return "Publisher ID looks like ca-pub- followed by 16 digits.";
  return null;
}

export function validateSlot(value: string): string | null {
  const v = value.trim();
  if (!v) return "Enter your ad slot ID.";
  if (!SLOT_RE.test(v)) return "Ad slot ID is 8–12 digits, numbers only.";
  return null;
}

function readStored(): AdConfig | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<AdConfig>;
    if (
      typeof parsed.client === "string" &&
      typeof parsed.slot === "string" &&
      !validateClient(parsed.client) &&
      !validateSlot(parsed.slot)
    ) {
      return { client: parsed.client, slot: parsed.slot };
    }
  } catch {
    // ignore malformed stored value
  }
  return null;
}

function AdUnit({ config }: { config: AdConfig }) {
  const pushed = useRef<string | null>(null);
  const key = `${config.client}:${config.slot}`;

  useEffect(() => {
    if (pushed.current === key) return;
    pushed.current = key;

    const scriptId = "adsbygoogle-js";
    if (!document.getElementById(scriptId)) {
      const script = document.createElement("script");
      script.id = scriptId;
      script.async = true;
      script.crossOrigin = "anonymous";
      script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${config.client}`;
      document.head.appendChild(script);
    }
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch {
      // AdSense blocked or not yet approved — the frame stays empty.
    }
  }, [key]);

  return (
    <ins
      key={key}
      className="adsbygoogle block"
      style={{ display: "block", minHeight: 250 }}
      data-ad-client={config.client}
      data-ad-slot={config.slot}
      data-ad-format="auto"
      data-full-width-responsive="true"
    />
  );
}

/**
 * Reserved ad area for the builder page (dashboard) only.
 * Never rendered on published or downloaded landing pages.
 */
export function AdSpace() {
  const [config, setConfig] = useState<AdConfig | null>(null);
  const [open, setOpen] = useState(false);
  const [client, setClient] = useState("");
  const [slot, setSlot] = useState("");
  const [errors, setErrors] = useState<{ client?: string; slot?: string }>({});
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const stored = readStored();
    if (stored) {
      setConfig(stored);
      setClient(stored.client);
      setSlot(stored.slot);
      return;
    }
    if (ENV_CLIENT && ENV_SLOT) {
      const envConfig = { client: ENV_CLIENT, slot: ENV_SLOT };
      setConfig(envConfig);
      setClient(envConfig.client);
      setSlot(envConfig.slot);
    }
  }, []);

  function handleSave(event: React.FormEvent) {
    event.preventDefault();
    const clientError = validateClient(client);
    const slotError = validateSlot(slot);
    setErrors({
      ...(clientError ? { client: clientError } : {}),
      ...(slotError ? { slot: slotError } : {}),
    });
    if (clientError || slotError) return;

    const next = { client: client.trim(), slot: slot.trim() };
    setConfig(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      // storage unavailable — config still applies for this session
    }
    setSaved(true);
    setOpen(false);
    window.setTimeout(() => setSaved(false), 3000);
  }

  function handleRemove() {
    setConfig(null);
    setClient("");
    setSlot("");
    setErrors({});
    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
  }

  return (
    <section aria-label="Advertisement" className="mt-6">
      <div className="mb-2 flex items-center justify-between gap-2">
        <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">
          Advertisement
        </p>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
        >
          <Settings2 className="mr-1.5 h-3.5 w-3.5" aria-hidden="true" />
          {config ? "Ad settings" : "Set up ads"}
        </Button>
      </div>

      {saved ? (
        <p className="mb-2 flex items-center gap-1.5 text-xs text-accent">
          <Check className="h-3.5 w-3.5" aria-hidden="true" />
          Ad settings saved
        </p>
      ) : null}

      {open ? (
        <form
          onSubmit={handleSave}
          className="mb-3 space-y-3 rounded-xl border border-border bg-card p-4"
        >
          <div className="space-y-1.5">
            <Label htmlFor="adsense-client">AdSense publisher ID</Label>
            <Input
              id="adsense-client"
              value={client}
              onChange={(e) => setClient(e.target.value)}
              placeholder="ca-pub-1234567890123456"
              aria-invalid={Boolean(errors.client)}
              aria-describedby={errors.client ? "adsense-client-error" : undefined}
            />
            {errors.client ? (
              <p
                id="adsense-client-error"
                className="flex items-center gap-1.5 text-xs text-primary"
              >
                <AlertCircle className="h-3.5 w-3.5" aria-hidden="true" />
                {errors.client}
              </p>
            ) : null}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="adsense-slot">Ad slot ID</Label>
            <Input
              id="adsense-slot"
              value={slot}
              onChange={(e) => setSlot(e.target.value)}
              placeholder="1234567890"
              inputMode="numeric"
              aria-invalid={Boolean(errors.slot)}
              aria-describedby={errors.slot ? "adsense-slot-error" : undefined}
            />
            {errors.slot ? (
              <p
                id="adsense-slot-error"
                className="flex items-center gap-1.5 text-xs text-primary"
              >
                <AlertCircle className="h-3.5 w-3.5" aria-hidden="true" />
                {errors.slot}
              </p>
            ) : null}
          </div>

          <div className="flex flex-wrap gap-2">
            <Button type="submit" size="sm">
              Save &amp; preview
            </Button>
            {config ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleRemove}
              >
                Remove ads
              </Button>
            ) : null}
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setOpen(false)}
            >
              Close
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Ads show here on the builder only — never on your published or
            downloaded landing page.
          </p>
        </form>
      ) : null}

      <div className="overflow-hidden rounded-xl border border-border bg-card">
        {config ? (
          <AdUnit config={config} />
        ) : (
          <div className="flex min-h-[250px] flex-col items-center justify-center gap-2 p-6 text-center">
            <Megaphone className="h-5 w-5 text-accent" aria-hidden="true" />
            <p className="text-sm font-medium text-foreground">
              Your ad space is ready
            </p>
            <p className="max-w-[26ch] text-xs text-muted-foreground">
              Add your Google AdSense publisher ID and ad slot to show ads here
              on the builder page only.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
