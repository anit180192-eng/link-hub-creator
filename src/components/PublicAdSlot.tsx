import { useEffect, useRef } from "react";
import { ADSENSE_CLIENT, ADSENSE_SLOT, adsConfigured } from "@/lib/ads-config";

declare global {
  interface Window {
    adsbygoogle?: unknown[];
  }
}

export function AdUnit({ client, slot }: { client: string; slot: string }) {
  const pushed = useRef<string | null>(null);
  const key = `${client}:${slot}`;

  useEffect(() => {
    if (pushed.current === key) return;
    pushed.current = key;

    const scriptId = "adsbygoogle-js";
    if (!document.getElementById(scriptId)) {
      const script = document.createElement("script");
      script.id = scriptId;
      script.async = true;
      script.crossOrigin = "anonymous";
      script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${client}`;
      document.head.appendChild(script);
    }
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

/**
 * Ad shown on published landing pages, between the links and the footer.
 * Renders nothing until the site owner's AdSense IDs are configured.
 */
export function PublicAdSlot({ dark }: { dark: boolean }) {
  if (!adsConfigured) return null;
  return (
    <div className="mt-12">
      <p
        className={`mb-2 text-center text-[10px] uppercase tracking-[0.18em] ${
          dark ? "text-muted-foreground" : "text-[#61656b]"
        }`}
      >
        Advertisement
      </p>
      <AdUnit client={ADSENSE_CLIENT} slot={ADSENSE_SLOT} />
    </div>
  );
}
