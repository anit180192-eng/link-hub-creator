const KEY = "lpb-post-login";

/** Call right before leaving the site to sign in with an outside provider. */
export function markPostLoginRedirect() {
  try {
    sessionStorage.setItem(KEY, String(Date.now()));
  } catch {
    /* storage unavailable */
  }
}

/** True (once) if a sign-in was started in this tab within the last 15 minutes. */
export function consumePostLoginRedirect(): boolean {
  try {
    const value = sessionStorage.getItem(KEY);
    if (!value) return false;
    sessionStorage.removeItem(KEY);
    return Date.now() - Number(value) < 15 * 60 * 1000;
  } catch {
    return false;
  }
}

export function hasPendingPostLoginRedirect(): boolean {
  try {
    return !!sessionStorage.getItem(KEY);
  } catch {
    return false;
  }
}
