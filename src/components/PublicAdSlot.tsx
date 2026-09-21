import { useEffect, useRef } from "react";
import { ADSENSE_CLIENT, ADSENSE_SLOT, adsConfigured, hasAdSlot } from "@/lib/ads-config";

declare global {
  interface Window {
    adsbygoogle?: unknown[];
  }
}

/** Loads the AdSense script once and pushes a manual ad unit. */
export function AdUnit({ client, slot }: { client: string; slot: string }) {
  const pushed = useRef<string | null>(null);
  const key = `${client}:${slot}`;

  useEffect(() => {
    if (pushed.current === key) return;
    pushed.current = key;

    loadAdSenseScript(client);
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch {
      // AdSense blocked or not yet approved — the frame stays empty.
    }
  }, [key, client]);

  return (
    <ins
      key={key}
      className="adsbygoogle block"
      style={{ display: "block", minHeight: 90 }}
      data-ad-client={client}
      data-ad-slot={slot}
      data-ad-format="auto"
      data-full-width-responsive="true"
    />
  );
}

/** Injects the AdSense loader script (idempotent — skips if already in head). */
function loadAdSenseScript(client: string) {
  const src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${client}`;
  if (document.querySelector(`script[src="${src}"]`)) return;
  const script = document.createElement("script");
  script.id = "adsbygoogle-js";
  script.async = true;
  script.crossOrigin = "anonymous";
  script.src = src;
  document.head.appendChild(script);
}

/**
 * Ad shown on published landing pages, between the links and the footer.
 * - With a publisher ID only: loads the AdSense script so Google auto-ads
 *   can place ads on the page, and reserves a labelled ad area.
 * - With a publisher ID + ad slot: renders a manual ad unit in that area.
 * Renders nothing until the site owner's AdSense ID is configured.
 */
export function PublicAdSlot({ dark }: { dark: boolean }) {
  if (!adsConfigured) return null;

  const labelCls = dark ? "text-muted-foreground" : "text-[#61656b]";

  return (
    <div className="mt-12">
      <p className={`mb-2 text-center text-[10px] uppercase tracking-[0.18em] ${labelCls}`}>
        Advertisement
      </p>
      {hasAdSlot ? (
        <AdUnit client={ADSENSE_CLIENT} slot={ADSENSE_SLOT} />
      ) : (
        <AutoAdsArea client={ADSENSE_CLIENT} dark={dark} />
      )}
    </div>
  );
}

/** Auto-ads mode: loads the script so Google can place ads; reserves the space. */
function AutoAdsArea({ client, dark }: { client: string; dark: boolean }) {
  useEffect(() => {
    loadAdSenseScript(client);
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch {
      // AdSense blocked or not yet approved — the frame stays empty.
    }
  }, [client]);

  return (
    <div
      className="flex min-h-[90px] items-center justify-center rounded-lg border border-dashed"
      style={{
        borderColor: dark ? "rgba(105,201,192,0.25)" : "rgba(97,101,107,0.2)",
      }}
    >
      <p className={`text-[10px] uppercase tracking-[0.14em] ${dark ? "text-muted-foreground" : "text-[#61656b]"}`}>
        Ad space
      </p>
    </div>
  );
}
