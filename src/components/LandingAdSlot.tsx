import { useEffect, useRef } from "react";
import { useLocation } from "@tanstack/react-router";
import { ADSENSE_CLIENT, ADSENSE_SLOT, ADSENSE_SCRIPT_SRC, hasAdSlot } from "@/lib/ads-config";

declare global {
  interface Window { adsbygoogle?: unknown[]; }
}

let scriptReady: Promise<void> | undefined;
function loadAdSense() {
  return scriptReady ??= new Promise<void>((resolve, reject) => {
    const script = document.createElement("script");
    script.async = true;
    script.crossOrigin = "anonymous";
    script.src = ADSENSE_SCRIPT_SRC;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("AdSense unavailable"));
    document.head.appendChild(script);
  });
}

/** One explicitly placed banner on marketing content; never on shared pages. */
export function LandingAdSlot() {
  const pathname = useLocation({ select: (location) => location.pathname });
  const allowed = pathname === "/" || pathname === "/setup";
  const pushed = useRef(false);

  useEffect(() => {
    if (!allowed || !hasAdSlot || window.location.hostname !== "landingpagebuilder.aurunex.com") return;
    let active = true;
    loadAdSense().then(() => {
      if (!active || pushed.current) return;
      pushed.current = true;
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    }).catch(() => {
      // Keep the reserved space visible if ads are blocked or unavailable.
    });
    return () => { active = false; };
  }, [allowed]);

  if (!allowed || !hasAdSlot) return null;

  return (
    <aside aria-label="Advertisement" className="content-ad mx-auto w-full max-w-5xl px-5 py-8 sm:py-10">
      <p className="mb-3 text-center text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
        Advertisement
      </p>
      <div className="grid">
        <div className="ad-placeholder col-start-1 row-start-1 flex min-h-[90px] items-center justify-center rounded-lg border border-dashed border-border bg-muted/20 px-4 text-center text-xs text-muted-foreground pointer-events-none">
          Ads will appear here when available.
        </div>
        <ins
        className="adsbygoogle col-start-1 row-start-1 block w-full"
        style={{ display: "block", minHeight: 90 }}
        data-ad-client={ADSENSE_CLIENT}
        data-ad-slot={ADSENSE_SLOT}
        data-ad-format="horizontal"
        data-full-width-responsive="false"
      />
      </div>
    </aside>
  );
}
