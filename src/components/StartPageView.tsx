import { WorldClocks } from "@/components/WorldClocks";
import { ArrowUpRight, Folder } from "lucide-react";
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
      <main className={`mx-auto w-full ${compact ? "p-3" : "max-w-[1120px] px-4 py-5 sm:px-6 sm:py-8"}`}>
        <a href="https://aurunex.com/" target="_blank" rel="noopener noreferrer" aria-label="AuruNex home" className="mb-4 inline-flex items-center gap-2 text-[10px] font-semibold uppercase text-hub-muted transition-colors hover:text-hub-accent">
          <span className="flex h-5 w-5 items-center justify-center rounded border border-hub-accent text-[9px] text-hub-accent">A</span>
          AuruNex
        </a>
        <div className={`grid items-start ${compact ? "gap-3 xl:grid-cols-[190px_minmax(0,1fr)]" : "gap-4 md:grid-cols-[220px_minmax(0,1fr)]"}`}>
          <aside className={`grid gap-4 ${compact ? "sm:grid-cols-2 xl:grid-cols-1" : "sm:grid-cols-2 md:grid-cols-1"}`}>
            <header className="rounded-lg border border-hub-border bg-hub-surface p-5">
              {profile.avatar_url ? (
                <img src={profile.avatar_url} alt="" className="h-14 w-14 rounded-md border border-hub-border object-cover grayscale" />
              ) : (
                <div className="flex h-14 w-14 items-center justify-center rounded-md border border-hub-border bg-hub-background font-display text-lg font-semibold text-hub-accent">{initials}</div>
              )}
              <h1 className="mt-5 font-display text-2xl font-semibold leading-tight">{name}</h1>
              <p className="mt-2 text-xs leading-5 text-hub-muted">{tagline}</p>
              <div className="mt-5 flex items-center gap-2 border-t border-hub-border pt-4 text-[10px] font-semibold uppercase text-hub-muted">
                <span className="h-1.5 w-1.5 rounded-full bg-hub-accent" aria-hidden="true" /> Personal hub
              </div>
            </header>
            <WorldClocks clocks={parseClocks(profile.clocks)} dark compact={compact} />
          </aside>

          <div className="min-w-0">
            <div className="grid gap-4 lg:grid-cols-2">
                {safe.length === 0 ? (
                  <p className="rounded-lg border border-hub-border bg-hub-surface p-5 text-sm text-hub-muted">No links yet.</p>
                ) : groups.map(([group, items], groupIndex) => (
                  <section key={group || "__default"} className={`rounded-lg border border-hub-border bg-hub-surface p-4 ${groups.length % 2 === 1 && groupIndex === 0 ? "lg:col-span-2" : ""}`}>
                    <div className="mb-3 flex items-center justify-between">
                      <div className="flex min-w-0 items-center gap-2.5">
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-hub-background text-hub-accent"><Folder className="h-4 w-4" aria-hidden="true" /></span>
                        <h2 className="truncate font-display text-sm font-semibold text-hub-foreground">{group || "Personal"}</h2>
                      </div>
                      <span className="text-[10px] tabular-nums text-hub-muted">{String(items.length).padStart(2, "0")}</span>
                    </div>
                    <div className={`grid grid-cols-1 gap-2 ${groups.length % 2 === 1 && groupIndex === 0 ? "sm:grid-cols-2" : ""}`}>
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
                        className="group flex h-16 cursor-pointer items-center justify-center rounded-md border border-hub-border bg-hub-background transition-[transform,border-color,box-shadow] duration-200 hover:-translate-y-0.5 hover:border-hub-accent hover:shadow-[0_0_14px_color-mix(in_oklab,var(--hub-accent)_14%,transparent)]"
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
                        className="group grid h-16 cursor-pointer grid-cols-[28px_minmax(0,1fr)_18px] items-center gap-3 rounded-md border border-hub-border bg-hub-background px-3 transition-[transform,border-color,box-shadow] duration-200 hover:-translate-y-0.5 hover:border-hub-accent hover:shadow-[0_0_14px_color-mix(in_oklab,var(--hub-accent)_14%,transparent)]"
                    >
                      {icon ? (
                        <img src={icon} alt="" width={28} height={28} className="h-7 w-7" />
                      ) : (
                        <span className="flex h-7 w-7 items-center justify-center bg-hub-accent font-bold text-hub-background">
                          {title.charAt(0).toUpperCase()}
                        </span>
                      )}
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-semibold text-hub-foreground">{title}</span>
                        <span className="block truncate text-[11px] text-hub-muted">{hostOf(link.url)}</span>
                      </span>
                      <ArrowUpRight className="h-4 w-4 text-hub-muted transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-hub-accent" aria-hidden="true" />
                    </a>
                  );
                })}
                    </div>
                  </section>
                ))}
            </div>
          </div>
          <footer className="mt-4 flex flex-col gap-2 border-t border-hub-border pt-4 text-[10px] uppercase text-hub-muted sm:flex-row sm:items-center sm:justify-between">
            <span>{name} · Personal hub</span>
            <a href="https://aurunex.com/" target="_blank" rel="noopener noreferrer" className="transition-colors hover:text-hub-accent">Built with Landing Page Builder by AuruNex</a>
          </footer>
        </div>
      </main>
    </div>
  );
}
