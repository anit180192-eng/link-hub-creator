import { useEffect, useRef, useState } from "react";
import { Megaphone } from "lucide-react";

declare global {
  interface Window {
    adsbygoogle?: unknown[];
  }
}

const ADSENSE_CLIENT = import.meta.env.VITE_GOOGLE_ADSENSE_CLIENT as
  | string
  | undefined;
const ADSENSE_SLOT = import.meta.env.VITE_GOOGLE_ADSENSE_SLOT as
  | string
  | undefined;

/**
 * Reserved ad area for the builder page (dashboard) only.
 * Renders a live Google AdSense unit once VITE_GOOGLE_ADSENSE_CLIENT and
 * VITE_GOOGLE_ADSENSE_SLOT are configured; otherwise shows a styled
 * placeholder so the layout is already in place.
 * Never rendered on published or downloaded landing pages.
 */
export function AdSpace() {
  const pushed = useRef(false);
  const [configured] = useState(() => Boolean(ADSENSE_CLIENT && ADSENSE_SLOT));

  useEffect(() => {
    if (!configured || pushed.current) return;
    pushed.current = true;

    const scriptId = "adsbygoogle-js";
    if (!document.getElementById(scriptId)) {
      const script = document.createElement("script");
      script.id = scriptId;
      script.async = true;
      script.crossOrigin = "anonymous";
      script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENT}`;
      document.head.appendChild(script);
    }
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch {
      // AdSense blocked (ad blocker or not yet approved) — placeholder stays visible.
    }
  }, [configured]);

  return (
    <section aria-label="Advertisement" className="mt-6">
      <p className="mb-2 text-xs uppercase tracking-[0.14em] text-muted-foreground">
        Advertisement
      </p>
      <div className="overflow-hidden rounded-xl border border-border bg-card">
        {configured ? (
          <ins
            className="adsbygoogle block"
            style={{ display: "block", minHeight: 250 }}
            data-ad-client={ADSENSE_CLIENT}
            data-ad-slot={ADSENSE_SLOT}
            data-ad-format="auto"
            data-full-width-responsive="true"
          />
        ) : (
          <div className="flex min-h-[250px] flex-col items-center justify-center gap-2 p-6 text-center">
            <Megaphone className="h-5 w-5 text-accent" aria-hidden="true" />
            <p className="text-sm font-medium text-foreground">
              Your ad space is ready
            </p>
            <p className="max-w-[26ch] text-xs text-muted-foreground">
              Connect your Google AdSense account and ads will appear here on
              the builder page only — never on your published landing page.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
