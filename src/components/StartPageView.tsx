import { WorldClocks } from "@/components/WorldClocks";
import {
  faviconFor,
  groupLinks,
  hostOf,
  isSafeUrl,
  linkTitle,
  normalizeUrl,
  parseClocks,
  type StartPageLink,
  type StartPageProfile,
} from "@/lib/startpage";


export function StartPageView({
  profile,
  links,
  compact = false,
  adSlot = null,
}: {
  profile: StartPageProfile;
  links: StartPageLink[];
  compact?: boolean;
  adSlot?: React.ReactNode;
}) {
  const dark = profile.dark_mode;
  const isGrid = profile.theme === "grid";
  const safe = links.filter((l) => isSafeUrl(l.url));
  const groups = groupLinks(safe);

  const shell = dark ? "bg-background text-foreground" : "bg-[#f6f6f2] text-[#16181d]";
  const cardCls = dark
    ? "bg-card border-border hover:border-accent"
    : "bg-white border-[#e4e4dd] hover:border-primary";
  const mutedCls = dark ? "text-muted-foreground" : "text-[#61656b]";

  return (
    <div className={`${shell} ${compact ? "rounded-xl" : "min-h-screen"}`}>
      <main className={`mx-auto max-w-[880px] ${compact ? "px-5 py-8" : "px-5 pb-20 pt-16"}`}>
        <WorldClocks clocks={parseClocks(profile.clocks)} dark={dark} compact={compact} />
        <header className={isGrid ? "mb-10" : "mb-10 text-center"}>

          {profile.avatar_url ? (
            <img
              src={profile.avatar_url}
              alt=""
              className={`mb-4 h-[76px] w-[76px] rounded-full border-2 border-primary object-cover ${isGrid ? "" : "mx-auto"}`}
            />
          ) : null}
          <h1 className="font-display text-3xl tracking-tight">
            {profile.display_name || profile.slug}
          </h1>
          {profile.tagline ? <p className={`mt-1 text-sm ${mutedCls}`}>{profile.tagline}</p> : null}
        </header>

        {safe.length === 0 ? (
          <p className={`text-sm ${mutedCls}`}>No links yet.</p>
        ) : (
          groups.map(([group, items]) => (
            <section key={group || "__default"}>
              {group || groups.length > 1 ? (
                <div className="mb-3 mt-8 flex items-center justify-between gap-3">
                  <h2 className={`text-xs uppercase tracking-[0.14em] ${mutedCls}`}>
                    {group || "Links"}
                  </h2>
                  {items.length > 1 ? (
                    <button
                      type="button"
                      onClick={() => {
                        items.forEach((l) =>
                          window.open(normalizeUrl(l.url), "_blank", "noopener,noreferrer"),
                        );
                      }}
                      className={`rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.1em] transition ${cardCls}`}
                    >
                      Open all ({items.length})
                    </button>
                  ) : null}
                </div>
              ) : null}
              <div
                className={
                  isGrid
                    ? "grid grid-cols-[repeat(auto-fill,minmax(140px,1fr))] gap-3"
                    : "mx-auto flex max-w-[520px] flex-col gap-2.5"
                }
              >
                {items.map((link) => {
                  const icon = faviconFor(link.url);
                  const title = linkTitle(link);
                  if (link.icon_only) {
                    return (
                      <a
                        key={link.id}
                        href={normalizeUrl(link.url)}
                        target="_blank"
                        rel="noopener noreferrer"
                        title={title}
                        aria-label={title}
                        className={`flex min-h-[84px] items-center justify-center rounded-[14px] border p-[18px] transition ${cardCls}`}
                      >
                        {icon ? (
                          <img src={icon} alt={title} width={40} height={40} className="h-10 w-10" />
                        ) : (
                          <span className="flex h-10 w-10 items-center justify-center rounded-[10px] bg-primary text-lg font-bold text-primary-foreground">
                            {title.charAt(0).toUpperCase()}
                          </span>
                        )}
                      </a>
                    );
                  }
                  return (
                    <a
                      key={link.id}
                      href={normalizeUrl(link.url)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`rounded-[14px] border transition ${cardCls} ${
                        isGrid
                          ? "flex flex-col gap-1.5 p-[18px]"
                          : "flex items-center gap-3.5 px-[18px] py-3.5"
                      }`}
                    >
                      {icon ? (
                        <img src={icon} alt="" width={28} height={28} className="h-7 w-7" />
                      ) : (
                        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary font-bold text-primary-foreground">
                          {title.charAt(0).toUpperCase()}
                        </span>
                      )}
                      <span>
                        <span className="block text-[15px] font-semibold">{title}</span>
                        <span className={`block text-xs ${mutedCls}`}>{hostOf(link.url)}</span>
                      </span>
                    </a>
                  );
                })}
              </div>
            </section>
          ))
        )}

        {!compact ? adSlot : null}
        <footer className={`mt-14 text-center text-xs ${mutedCls}`}>Built with Landing Page Builder by AuruNex</footer>
      </main>
    </div>
  );
}
