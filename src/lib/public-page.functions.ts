import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import type { Database } from "@/integrations/supabase/types";
import { parseClocks, type StartPageLink, type StartPageProfile } from "@/lib/startpage";

export type PublicPage = {
  profile: StartPageProfile;
  links: StartPageLink[];
  /** True when the page needs a PIN and this browser hasn't unlocked it. */
  locked: boolean;
  /** True when the page is PIN protected. */
  protected: boolean;
  /** True when this browser is saved as trusted for this page's owner. */
  trusted: boolean;
} | null;

function publicClient() {
  const key = process.env["SUPABASE_PUBLISHABLE_KEY"]!;
  return createClient<Database>(process.env["SUPABASE_URL"]!, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: {
      fetch: (input, init) => {
        const h = new Headers(init?.headers);
        if (key.startsWith("sb_") && h.get("Authorization") === `Bearer ${key}`) {
          h.delete("Authorization");
        }
        h.set("apikey", key);
        return fetch(input, { ...init, headers: h });
      },
    },
  });
}

const LINK_COLUMNS = "id, platform, label, url, group_name, position, icon_only";

export const getPublicPage = createServerFn({ method: "GET" })
  .inputValidator((slug: string) => String(slug).slice(0, 60))
  .handler(async ({ data: slug }): Promise<PublicPage> => {
    const supabase = publicClient();

    const { data: page } = await supabase
      .from("pages")
      .select("id, user_id, slug, display_name, tagline, avatar_url, theme, dark_mode, clocks, pin_protected")
      .eq("slug", slug)
      .eq("published", true)
      .maybeSingle();

    if (!page) return null;

    const profile: StartPageProfile = {
      slug: page.slug,
      display_name: page.display_name,
      tagline: page.tagline,
      avatar_url: page.avatar_url,
      theme: page.theme,
      dark_mode: page.dark_mode,
      clocks: parseClocks(page.clocks),
    };

    if (!page.pin_protected) {
      const { data: links } = await supabase
        .from("links")
        .select(LINK_COLUMNS)
        .eq("page_id", page.id)
        .order("position", { ascending: true });
      return { profile, links: (links ?? []) as StartPageLink[], locked: false, protected: false, trusted: false };
    }

    const { findUnlockedDevice, getAdmin } = await import("./pin.server");
    const device = await findUnlockedDevice(page.user_id);
    if (!device) {
      return { profile, links: [], locked: true, protected: true, trusted: false };
    }

    const admin = await getAdmin();
    const [{ data: links }] = await Promise.all([
      admin.from("links").select(LINK_COLUMNS).eq("page_id", page.id).order("position", { ascending: true }),
      admin.from("device_tokens").update({ last_used_at: new Date().toISOString() }).eq("id", device.id),
    ]);
    return {
      profile,
      links: (links ?? []) as StartPageLink[],
      locked: false,
      protected: true,
      trusted: device.kind === "trusted",
    };
  });

export type UnlockResult =
  | { ok: true }
  | { ok: false; reason: "wrong_pin"; remaining: number }
  | { ok: false; reason: "locked_out"; minutes: number }
  | { ok: false; reason: "no_pin" | "not_found" };

export const unlockPage = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    z.object({ slug: z.string().min(1).max(60), pin: z.string().regex(/^\d{6}$/) }).parse(input),
  )
  .handler(async ({ data }): Promise<UnlockResult> => {
    const pin = await import("./pin.server");
    const admin = await pin.getAdmin();

    const { data: page } = await admin
      .from("pages")
      .select("user_id")
      .eq("slug", data.slug)
      .eq("published", true)
      .eq("pin_protected", true)
      .maybeSingle();
    if (!page) return { ok: false, reason: "not_found" };
    const ownerId = page.user_id;

    const ipHash = await pin.visitorFingerprint(ownerId);
    const { data: reservations, error: reservationError } = await admin.rpc("reserve_pin_attempt", {
      p_owner_id: ownerId,
      p_ip_hash: ipHash,
    });
    const reservation = reservations?.[0];
    // Fail closed: a database/rate-limit error must never become unlimited guesses.
    if (reservationError || !reservation) throw new Error("PIN check unavailable. Please try again later.");
    if (!reservation.allowed) {
      return { ok: false, reason: "locked_out", minutes: pin.LOCKOUT_MINUTES };
    }
    if (!reservation.attempt_id) throw new Error("PIN check unavailable. Please try again later.");

    const { data: security, error: securityError } = await admin
      .from("account_security")
      .select("pin_hash, pin_salt")
      .eq("user_id", ownerId)
      .maybeSingle();
    if (securityError) throw new Error("PIN check unavailable. Please try again later.");
    if (!security) return { ok: false, reason: "no_pin" };

    const attempt = await pin.hashPin(data.pin, security.pin_salt);
    if (!pin.safeEqual(attempt, security.pin_hash)) {
      const remaining = reservation.remaining;
      if (remaining === 0) return { ok: false, reason: "locked_out", minutes: pin.LOCKOUT_MINUTES };
      return { ok: false, reason: "wrong_pin", remaining };
    }

    const token = pin.randomHex(32);
    const { error: tokenError } = await admin.from("device_tokens").insert({
        user_id: ownerId,
        token_hash: await pin.sha256(token),
        kind: "session",
        label: pin.describeBrowser(),
        expires_at: new Date(Date.now() + pin.VISIT_HOURS * 3_600_000).toISOString(),
      });
    if (tokenError) throw new Error("Couldn't unlock this browser. Please try again later.");
    // Remove only this successful reservation; preserve concurrent failed guesses.
    await admin.from("pin_attempts").delete().eq("id", reservation.attempt_id).eq("owner_id", ownerId);
    pin.writeVisitCookie(ownerId, token);
    return { ok: true };
  });

export const trustThisBrowser = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => z.object({ slug: z.string().min(1).max(60) }).parse(input))
  .handler(async ({ data }): Promise<{ ok: boolean }> => {
    const pin = await import("./pin.server");
    const admin = await pin.getAdmin();
    const { data: page } = await admin
      .from("pages")
      .select("user_id")
      .eq("slug", data.slug)
      .eq("published", true)
      .maybeSingle();
    if (!page) return { ok: false };

    const device = await pin.findUnlockedDevice(page.user_id);
    if (!device) return { ok: false };

    const { error } = await admin
      .from("device_tokens")
      .update({ kind: "trusted", expires_at: new Date(Date.now() + pin.TRUSTED_MAX_AGE * 1000).toISOString(), label: pin.describeBrowser() })
      .eq("id", device.id);
    if (error) return { ok: false };
    pin.writeTrustedCookie(page.user_id, device.token);
    return { ok: true };
  });
