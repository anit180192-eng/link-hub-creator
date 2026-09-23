import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { isStrongPin } from "./pin-validation";

export type TrustedBrowser = {
  id: string;
  label: string;
  created_at: string;
  last_used_at: string;
};

const pageInput = z.object({ pageId: z.string().uuid() });

async function assertOwner(supabase: any, pageId: string) {
  const { data } = await supabase.from("pages").select("id").eq("id", pageId).maybeSingle();
  if (!data) throw new Error("Profile not found");
}

export const getSecurityStatus = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => pageInput.parse(input))
  .handler(async ({ data, context }) => {
    await assertOwner(context.supabase, data.pageId);
    const pin = await import("./pin.server");
    const admin = await pin.getAdmin();
    const [{ data: own }, record, { data: devices }] = await Promise.all([
      admin.from("page_security").select("page_id").eq("page_id", data.pageId).maybeSingle(),
      pin.getPinRecord(context.userId, data.pageId),
      context.supabase
        .from("device_tokens")
        .select("id, label, created_at, last_used_at")
        .eq("kind", "trusted")
        .or(`page_id.eq.${data.pageId},page_id.is.null`)
        .order("last_used_at", { ascending: false }),
    ]);
    return {
      hasPin: !!record,
      ownPin: !!own,
      pinUpdatedAt: record?.updated_at ?? null,
      devices: (devices ?? []) as TrustedBrowser[],
    };
  });

export const setPin = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ pageId: z.string().uuid(), pin: z.string().regex(/^\d{6}$/, "Your PIN must be exactly 6 digits")
      .refine(isStrongPin, "Pick something harder to guess than repeated or sequential digits") }).parse(input),
  )
  .handler(async ({ data, context }) => {
    await assertOwner(context.supabase, data.pageId);
    const pin = await import("./pin.server");
    const admin = await pin.getAdmin();
    const salt = pin.randomHex(16);
    const hash = await pin.hashPin(data.pin, salt);
    const { error } = await admin
      .from("page_security")
      .upsert({ page_id: data.pageId, user_id: context.userId, pin_hash: hash, pin_salt: salt }, { onConflict: "page_id" });
    if (error) throw new Error("Couldn't save your PIN");
    // A new PIN ends short visits to this profile; trusted browsers stay trusted.
    await admin.from("device_tokens").delete().eq("page_id", data.pageId).eq("kind", "session");
    return { ok: true };
  });

export const removePin = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => pageInput.parse(input))
  .handler(async ({ data, context }) => {
    await assertOwner(context.supabase, data.pageId);
    const { getAdmin } = await import("./pin.server");
    const admin = await getAdmin();
    await context.supabase.from("pages").update({ pin_protected: false }).eq("id", data.pageId);
    await admin.from("page_security").delete().eq("page_id", data.pageId);
    await admin.from("device_tokens").delete().eq("page_id", data.pageId);
    return { ok: true };
  });

export const removeTrustedBrowser = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("device_tokens").delete().eq("id", data.id);
    if (error) throw new Error("Couldn't remove that browser");
    return { ok: true };
  });

export const removeAllBrowsers = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { error } = await context.supabase
      .from("device_tokens")
      .delete()
      .eq("user_id", context.userId);
    if (error) throw new Error("Couldn't remove your browsers");
    return { ok: true };
  });
