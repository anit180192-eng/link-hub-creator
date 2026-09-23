// Server-only helpers for PIN protection and trusted browsers.
import { getCookie, getRequestHeader, getRequestIP, setCookie } from "@tanstack/react-start/server";

export const PIN_REGEX = /^\d{6}$/;
export const MAX_ATTEMPTS_PER_BROWSER = 5;
export const MAX_ATTEMPTS_PER_OWNER = 30;
export const LOCKOUT_MINUTES = 15;
export const VISIT_HOURS = 12;
export const TRUSTED_MAX_AGE = 60 * 60 * 24 * 400; // also enforced server-side
const PBKDF2_ITERATIONS = 100_000;

const enc = new TextEncoder();

function toHex(buf: ArrayBuffer | Uint8Array) {
  return Array.from(buf instanceof Uint8Array ? buf : new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function fromHex(hex: string) {
  const out = new Uint8Array(hex.length / 2);
  for (let i = 0; i < out.length; i++) out[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  return out;
}

export function randomHex(bytes: number) {
  const b = new Uint8Array(bytes);
  crypto.getRandomValues(b);
  return toHex(b);
}

export async function sha256(value: string) {
  return toHex(await crypto.subtle.digest("SHA-256", enc.encode(value)));
}

export async function hashPin(pin: string, saltHex: string) {
  const key = await crypto.subtle.importKey("raw", enc.encode(pin), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", hash: "SHA-256", salt: fromHex(saltHex), iterations: PBKDF2_ITERATIONS },
    key,
    256,
  );
  return toHex(bits);
}

export function safeEqual(a: string, b: string) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export function cookieName(ownerId: string) {
  return `lpb_u_${ownerId.replace(/-/g, "")}`;
}

const baseCookie = {
  httpOnly: true,
  secure: true,
  sameSite: "none" as const,
  partitioned: true,
  path: "/",
};

export function readDeviceCookie(ownerId: string) {
  const value = getCookie(cookieName(ownerId));
  return value && /^[a-f0-9]{64}$/.test(value) ? value : null;
}

export function writeVisitCookie(ownerId: string, token: string) {
  setCookie(cookieName(ownerId), token, baseCookie); // ends when the browser closes
}

export function writeTrustedCookie(ownerId: string, token: string) {
  setCookie(cookieName(ownerId), token, { ...baseCookie, maxAge: TRUSTED_MAX_AGE });
}

export async function visitorFingerprint(ownerId: string) {
  let ip = "";
  try {
    ip = getRequestIP({ xForwardedFor: true }) ?? "";
  } catch {
    /* not available */
  }
  ip = ip || getRequestHeader("cf-connecting-ip") || "unknown";
  return sha256(`${ownerId}:${ip}`);
}

export function describeBrowser() {
  const ua = getRequestHeader("user-agent") ?? "";
  const browser = /Edg\//.test(ua)
    ? "Edge"
    : /OPR\/|Opera/.test(ua)
      ? "Opera"
      : /Firefox\//.test(ua)
        ? "Firefox"
        : /Chrome\//.test(ua)
          ? "Chrome"
          : /Safari\//.test(ua)
            ? "Safari"
            : "Browser";
  const os = /iPhone/.test(ua)
    ? "iPhone"
    : /iPad/.test(ua)
      ? "iPad"
      : /Android/.test(ua)
        ? "Android"
        : /Windows/.test(ua)
          ? "Windows"
          : /Mac OS X|Macintosh/.test(ua)
            ? "Mac"
            : /Linux/.test(ua)
              ? "Linux"
              : "";
  return os ? `${browser} on ${os}` : browser;
}

export async function getAdmin() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin;
}

/** Returns the stored browser record if this request carries a valid unlock for this profile page. */
export async function findUnlockedDevice(ownerId: string, pageId: string) {
  const admin = await getAdmin();
  const check = async (token: string | null, scoped: boolean) => {
    if (!token) return null;
    let q = admin
      .from("device_tokens")
      .select("id, kind, created_at, expires_at")
      .eq("user_id", ownerId)
      .eq("token_hash", await sha256(token));
    q = scoped ? q.eq("page_id", pageId) : q.is("page_id", null);
    const { data } = await q.maybeSingle();
    if (!data) return null;
    const expiresAt = data.expires_at
      ? new Date(data.expires_at).getTime()
      : data.kind === "trusted"
        ? new Date(data.created_at).getTime() + TRUSTED_MAX_AGE * 1000
        : NaN;
    if (!Number.isFinite(expiresAt) || expiresAt <= Date.now()) return null;
    return { ...data, token };
  };
  // Only per-profile unlocks count; old account-wide unlocks are no longer accepted.
  return check(readDeviceCookie(pageId), true);
}

/** Profile PIN if set, otherwise the legacy account PIN. */
export async function getPinRecord(ownerId: string, pageId: string) {
  const admin = await getAdmin();
  const { data: own, error } = await admin.from("page_security").select("pin_hash, pin_salt, updated_at").eq("page_id", pageId).maybeSingle();
  if (error) throw error;
  if (own) return own;
  const { data: legacy, error: e2 } = await admin.from("account_security").select("pin_hash, pin_salt, updated_at").eq("user_id", ownerId).maybeSingle();
  if (e2) throw e2;
  return legacy;
}
