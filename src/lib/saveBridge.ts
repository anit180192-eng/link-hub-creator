export const SAVE_BRIDGE_VERSION = 1;
export const MAX_SAVE_URL = 500;
export const MAX_SAVE_TITLE = 60;

export type SaveCurrentMessage = { url: string; title: string };

/** Validate an LPB_SAVE_CURRENT message. Returns null when it must be ignored. */
export function parseSaveCurrent(
  data: unknown,
  meta: { sourceIsWindow: boolean; origin: string; expectedOrigin: string },
): SaveCurrentMessage | null {
  if (!meta.sourceIsWindow || meta.origin !== meta.expectedOrigin) return null;
  if (!data || typeof data !== "object") return null;
  const d = data as Record<string, unknown>;
  if (d.type !== "LPB_SAVE_CURRENT" || d.version !== SAVE_BRIDGE_VERSION) return null;
  if (typeof d.url !== "string" || d.url.length > 2048) return null;
  let u: URL;
  try { u = new URL(d.url.trim()); } catch { return null; }
  if (u.protocol !== "http:" && u.protocol !== "https:") return null;
  if (u.username || u.password) return null;
  const url = u.toString();
  if (url.length > MAX_SAVE_URL) return null;
  const rawTitle = typeof d.title === "string" ? d.title.slice(0, 500) : "";
  const title = rawTitle.replace(/\s+/g, " ").trim().slice(0, MAX_SAVE_TITLE);
  return { url, title };
}
