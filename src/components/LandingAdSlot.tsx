import { useEffect } from "react";
import { ADSENSE_CLIENT, ADSENSE_SLOT, adsConfigured, hasAdSlot } from "@/lib/ads-config";

declare global {
  interface Window {
    adsbygoogle?: unknown[];
  }
}

/** Loads the AdSense loader script once (idempotent — skips if already in head). */
function loadAdSenseScript(client: string) {
  const src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${client}`;
  if (document.querySelector(`script[src="${src}"]`)) return;
  const script = document.createElement("script");
  script.async = true;
  script.crossOrigin = "anonymous";
  script.src = src;
  document.head.appendChild(script);
}

/**
 * Small, subtle AdSense holder for the app's main landing page.
 * Slim single-row strip — never taller than ~120px — so it stays
 * unobtrusive. Shows a live ad unit when a slot is configured,
 * otherwise a clean labelled placeholder while auto-ads load.
 */
export function LandingAdSlot() {
  useEffect(() => {
    if (!adsConfigured) return;
    loadAdSenseScript(ADSENSE_CLIENT);
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch {
      // AdSense blocked or not yet approved — placeholder stays.
    }
  }, []);

  if (!adsConfigured) return null;

  return (
    <div className="mx-auto max-w-7xl px-5 lg:px-8">
      <div
        className="mx-auto flex max-w-[728px] min-h-[90px] items-center justify-center rounded-lg border border-dashed border-border/60 bg-card/30 px-4"
        style={{ maxHeight: 120 }}
      >
        {hasAdSlot ? (
          <ins
            className="adsbygoogle block w-full"
            style={{ display: "block", minHeight: 90 }}
            data-ad-client={ADSENSE_CLIENT}
            data-ad-slot={ADSENSE_SLOT}
            data-ad-format="auto"
            data-full-width-responsive="true"
          />
        ) : (
          <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
            Advertisement
          </p>
        )}
      </div>
    </div>
  );
}
