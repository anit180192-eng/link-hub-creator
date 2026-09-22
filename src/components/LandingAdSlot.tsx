import { useEffect, useRef, useState } from "react";
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
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!allowed || !hasAdSlot || window.location.hostname !== "landingpagebuilder.aurunex.com") return;
    let active = true;
    loadAdSense().then(() => {
      if (!active || pushed.current) return;
      pushed.current = true;
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    }).catch(() => { if (active) setFailed(true); });
    return () => { active = false; };
  }, [allowed]);

  if (!allowed || !hasAdSlot || failed) return null;

  return (
    <aside aria-label="Advertisement" className="content-ad mx-auto w-full max-w-5xl px-5 py-8 sm:py-10">
      <p className="mb-3 text-center text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
        Advertisement
      </p>
      <ins
        className="adsbygoogle block w-full"
        style={{ display: "block", minHeight: 90 }}
        data-ad-client={ADSENSE_CLIENT}
        data-ad-slot={ADSENSE_SLOT}
        data-ad-format="horizontal"
        data-full-width-responsive="false"
      />
    </aside>
  );
}
