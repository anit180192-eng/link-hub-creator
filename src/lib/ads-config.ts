/**
 * Manual ads belong only on the public homepage and setup guide.
 * Auto ads are excluded for this app in AdSense; /p/* stays ad-free.
 * A configured unit does not imply that Google has approved ad serving.
 */
export const ADSENSE_CLIENT = "ca-pub-7242078241100237";
export const ADSENSE_SLOT = "7625774306";
export const adsConfigured = Boolean(ADSENSE_CLIENT);
export const hasAdSlot = Boolean(ADSENSE_CLIENT && ADSENSE_SLOT);
export const ADSENSE_SCRIPT_SRC = ADSENSE_CLIENT
  ? `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENT}`
  : "";
