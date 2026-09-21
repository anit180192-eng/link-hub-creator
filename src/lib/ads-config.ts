/**
 * Site-wide Google AdSense configuration.
 * Ads with this publisher ID show on every published landing page (/p/...),
 * so ad revenue goes to the site owner's AdSense account.
 *
 * ADSENSE_CLIENT alone enables AdSense auto-ads (Google places ads
 * automatically). When ADSENSE_SLOT is also provided, a manual ad unit
 * is rendered at the bottom of each published page for precise placement.
 */
export const ADSENSE_CLIENT = "ca-pub-7242078241100237";
export const ADSENSE_SLOT = "";

/** Publisher ID configured — auto-ads will load on published pages. */
export const adsConfigured = Boolean(ADSENSE_CLIENT);

/** Both publisher ID and ad slot configured — manual ad unit placement. */
export const hasAdSlot = Boolean(ADSENSE_CLIENT && ADSENSE_SLOT);
