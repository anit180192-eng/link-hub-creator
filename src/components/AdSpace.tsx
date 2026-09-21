import { Megaphone, Check, ExternalLink } from "lucide-react";
import { AdUnit } from "@/components/PublicAdSlot";
import { ADSENSE_CLIENT, ADSENSE_SLOT, adsConfigured } from "@/lib/ads-config";

/**
 * Builder-page panel for site ads. Ads run on every published landing page
 * using the site owner's AdSense account (see src/lib/ads-config.ts).
 * This panel shows the status and a live preview — never an ad itself unless
 * ads are configured, and it is not part of any user's page output.
 */
export function AdSpace() {
  return (
    <section aria-label="Advertisement settings" className="mt-6">
      <div className="mb-2 flex items-center justify-between gap-2">
        <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">
          Ads on published pages
        </p>
        {adsConfigured ? (
          <p className="flex items-center gap-1.5 text-xs text-accent">
            <Check className="h-3.5 w-3.5" aria-hidden="true" />
            Live
          </p>
        ) : null}
      </div>

      <div className="overflow-hidden rounded-xl border border-border bg-card">
        {adsConfigured ? (
          <div className="p-3">
            <AdUnit client={ADSENSE_CLIENT} slot={ADSENSE_SLOT} />
            <p className="mt-2 text-xs text-muted-foreground">
              This ad appears at the bottom of every published landing page,
              above the footer. Earnings go to the connected AdSense account.
            </p>
          </div>
        ) : (
          <div className="flex min-h-[180px] flex-col items-center justify-center gap-2 p-6 text-center">
            <Megaphone className="h-5 w-5 text-accent" aria-hidden="true" />
            <p className="text-sm font-medium text-foreground">
              Earn from your published pages
            </p>
            <p className="max-w-[38ch] text-xs text-muted-foreground">
              Ads will appear at the bottom of every published landing page —
              never inside the page's own design or the downloaded file. Sign up
              for Google AdSense, get your site approved, then share your
              publisher ID and ad slot to switch ads on.
            </p>
            <a
              href="https://adsense.google.com/start/"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-1 inline-flex items-center gap-1.5 text-xs font-medium text-primary underline-offset-4 hover:underline"
            >
              Sign up for Google AdSense
              <ExternalLink className="h-3 w-3" aria-hidden="true" />
            </a>
          </div>
        )}
      </div>
    </section>
  );
}
