/**
 * Site-wide Google AdSense configuration.
 * Ads with this publisher ID show on every published landing page (/p/...),
 * so ad revenue goes to the site owner's AdSense account.
 * Filled in once the owner's AdSense account is approved.
 */
export const ADSENSE_CLIENT = "";
export const ADSENSE_SLOT = "";

export const adsConfigured = Boolean(ADSENSE_CLIENT && ADSENSE_SLOT);
