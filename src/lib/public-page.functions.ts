import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import type { StartPageLink, StartPageProfile } from "@/lib/startpage";

export type PublicPage = {
  profile: StartPageProfile;
  links: StartPageLink[];
} | null;

export const getPublicPage = createServerFn({ method: "GET" })
  .inputValidator((slug: string) => String(slug).slice(0, 60))
  .handler(async ({ data: slug }): Promise<PublicPage> => {
    const key = process.env["SUPABASE_PUBLISHABLE_KEY"]!;
    const supabase = createClient<Database>(process.env["SUPABASE_URL"]!, key, {
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

    const { data: profile } = await supabase
      .from("profiles")
      .select("id, slug, display_name, tagline, avatar_url, theme, dark_mode")
      .eq("slug", slug)
      .eq("published", true)
      .maybeSingle();

    if (!profile) return null;

    const { data: links } = await supabase
      .from("links")
      .select("id, platform, label, url, group_name, position")
      .eq("user_id", profile.id)
      .order("position", { ascending: true });

    return {
      profile: {
        slug: profile.slug,
        display_name: profile.display_name,
        tagline: profile.tagline,
        avatar_url: profile.avatar_url,
        theme: profile.theme,
        dark_mode: profile.dark_mode,
      },
      links: (links ?? []) as StartPageLink[],
    };
  });
