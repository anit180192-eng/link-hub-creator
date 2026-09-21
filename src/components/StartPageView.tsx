import { WorldClocks } from "@/components/WorldClocks";
import { ArrowUpRight } from "lucide-react";
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
}: {
  profile: StartPageProfile;
  links: StartPageLink[];
  compact?: boolean;
  adSlot?: React.ReactNode;
}) {
  const safe = links.filter((l) => isSafeUrl(l.url));
  const groups = groupLinks(safe);
  const name = profile.display_name || profile.slug;
  const tagline =
    profile.tagline.trim().toLowerCase() === "everything at once :)"
      ? "Personal links, projects, and creative work."
      : profile.tagline || "Personal links, projects, and creative work.";
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");

  return (
    <div className={`bg-hub-background text-hub-foreground ${compact ? "rounded-lg" : "min-h-screen"}`}>
      <main className={`mx-auto w-full ${compact ? "p-3" : "max-w-[1180px] px-4 py-5 sm:px-8 sm:py-10 lg:px-12 lg:py-14"}`}>
        <div className="overflow-hidden border border-hub-border bg-hub-background shadow-[20px_20px_0_color-mix(in_oklab,var(--hub-surface)_42%,transparent)]">
          <div className="grid lg:grid-cols-[minmax(270px,0.36fr)_minmax(0,0.64fr)]">
            <header className="flex min-h-[340px] flex-col justify-between border-b border-hub-border p-6 sm:p-9 lg:min-h-[640px] lg:border-b-0 lg:border-r lg:p-11">
              <div>
                <a
                  href="https://aurunex.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="AuruNex home"
                  className="inline-flex h-6 items-center gap-1.5 font-display text-[11px] font-semibold uppercase text-hub-muted transition-colors hover:text-hub-accent"
                >
                  <span className="flex h-5 w-5 items-center justify-center border border-hub-accent text-[9px] text-hub-accent">A</span>
                  AuruNex
                </a>
                <div className="mt-14 sm:mt-16 lg:mt-20">
                  {profile.avatar_url ? (
                    <img src={profile.avatar_url} alt="" className="mb-8 h-24 w-24 border border-hub-border object-cover grayscale sm:h-28 sm:w-28" />
                  ) : (
                    <div className="mb-8 flex h-24 w-24 items-center justify-center border border-hub-border bg-hub-surface font-display text-3xl font-semibold text-hub-accent sm:h-28 sm:w-28">
                      {initials}
                    </div>
                  )}
                  <h1 className="font-display text-5xl font-semibold leading-[0.95] sm:text-6xl lg:text-7xl">{name}</h1>
                  <p className="mt-6 max-w-[280px] text-sm leading-6 text-hub-muted">{tagline}</p>
                </div>
              </div>
              <span className="mt-10 flex items-center gap-3 text-[10px] font-semibold uppercase text-hub-muted">
                <span className="h-2 w-2 bg-hub-accent" aria-hidden="true" /> Personal index
              </span>
            </header>

            <div className="flex min-w-0 flex-col">
              <WorldClocks clocks={parseClocks(profile.clocks)} dark compact={compact} />
              <div className="flex-1 px-5 py-8 sm:px-8 sm:py-10 lg:px-10 lg:py-12">
                {safe.length === 0 ? (
                  <p className="text-sm text-hub-muted">No links yet.</p>
                ) : groups.map(([group, items], groupIndex) => (
                  <section key={group || "__default"} className={groupIndex > 0 ? "mt-14" : ""}>
                    <div className="mb-5 flex items-end justify-between border-b border-hub-border pb-3">
                      <h2 className="text-[11px] font-semibold uppercase text-hub-muted">{group || "Personal"}</h2>
                      <span className="text-[10px] tabular-nums text-hub-muted">0{groupIndex + 1}</span>
                    </div>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
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
                        className="group flex h-[92px] cursor-pointer items-center justify-center border border-hub-border bg-hub-surface transition-[transform,border-color,box-shadow] duration-200 hover:-translate-y-0.5 hover:border-hub-accent hover:shadow-[0_0_18px_color-mix(in_oklab,var(--hub-accent)_16%,transparent)]"
                      >
                        {icon ? (
                          <img src={icon} alt={title} width={40} height={40} className="h-10 w-10" />
                        ) : (
                          <span className="flex h-10 w-10 items-center justify-center bg-hub-accent text-lg font-bold text-hub-background">
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
                      className="group grid h-[92px] cursor-pointer grid-cols-[32px_minmax(0,1fr)_20px] items-center gap-3 border border-hub-border bg-hub-surface px-4 transition-[transform,border-color,box-shadow] duration-200 hover:-translate-y-0.5 hover:border-hub-accent hover:shadow-[0_0_18px_color-mix(in_oklab,var(--hub-accent)_16%,transparent)]"
                    >
                      {icon ? (
                        <img src={icon} alt="" width={28} height={28} className="h-7 w-7" />
                      ) : (
                        <span className="flex h-7 w-7 items-center justify-center bg-hub-accent font-bold text-hub-background">
                          {title.charAt(0).toUpperCase()}
                        </span>
                      )}
                      <span className="min-w-0">
                        <span className="block truncate text-[15px] font-semibold text-hub-foreground">{title}</span>
                        <span className="mt-1 block truncate text-xs text-hub-muted">{hostOf(link.url)}</span>
                      </span>
                      <ArrowUpRight className="h-4 w-4 text-hub-muted transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-hub-accent" aria-hidden="true" />
                    </a>
                  );
                })}
                    </div>
                  </section>
                ))}
              </div>
              <footer className="flex flex-col gap-2 border-t border-hub-border px-6 py-5 text-[10px] uppercase text-hub-muted sm:flex-row sm:items-center sm:justify-between">
                <span>{name} · Personal hub</span>
                <a href="https://aurunex.com/" target="_blank" rel="noopener noreferrer" className="transition-colors hover:text-hub-accent">Built with Landing Page Builder by AuruNex</a>
              </footer>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
