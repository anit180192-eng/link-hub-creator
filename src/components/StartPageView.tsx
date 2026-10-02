import { SocialLinks } from "@/components/SocialLinks";
import { parseSocialLinks } from "@/lib/social-links";
import { readPageTheme, themeStyle, type ColourMode } from "@/lib/page-themes";
import { WorldClocks } from "@/components/WorldClocks";
import { ArrowUpRight, Folder } from "lucide-react";
import { cn } from "@/lib/utils";
import { OpenAllButton } from "@/components/OpenAllButton";
import {
  faviconFor,
  groupLinks,
  hostOf,
  isSafeUrl,
  linkCountLabel,
  linkTitle,
  normalizeUrl,
  parseClocks,
  type StartPageLink,
  type StartPageProfile,
} from "@/lib/startpage";

const DEFAULT_TAGLINE = "Personal links, projects, and creative work.";

function LinkCard({ link, tall = true, archived = false }: { link: StartPageLink; tall?: boolean; archived?: boolean }) {
  const icon = faviconFor(link.url);
  const title = linkTitle(link);
  return (
    <a
      href={archived ? undefined : normalizeUrl(link.url)}
      target={archived ? undefined : "_blank"}
      rel="noopener noreferrer"
      aria-disabled={archived || undefined}
      title={archived ? "Archived — renew Premium to open this link" : undefined}
      className={cn(
        "group grid cursor-pointer grid-cols-[28px_minmax(0,1fr)_18px] items-center gap-3 rounded-md border border-hub-border bg-hub-background px-3 transition-[transform,border-color,box-shadow] duration-200 hover:-translate-y-0.5 hover:border-hub-accent hover:shadow-[0_0_14px_color-mix(in_oklab,var(--hub-accent)_14%,transparent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-hub-accent active:translate-y-0",
        tall ? "h-16" : "h-14",
      )}
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
      <ArrowUpRight
        className="h-4 w-4 text-hub-muted transition-transform duration-200 group-hover:-translate-y-1 group-hover:translate-x-1 group-hover:text-hub-accent"
        aria-hidden="true"
      />
    </a>
  );
}

function QuickTiles({ links, label, className, archived = false }: { links: StartPageLink[]; label: string; className?: string; archived?: boolean }) {
  if (!links.length) return null;
  return (
    <div className={cn("flex flex-wrap gap-2", className)} aria-label={`${label} quick links`}>
      {links.map((link) => {
        const icon = faviconFor(link.url);
        const title = linkTitle(link);
        return (
          <a
            key={link.id}
            href={archived ? undefined : normalizeUrl(link.url)}
            target={archived ? undefined : "_blank"}
            rel="noopener noreferrer"
            title={archived ? "Archived — renew Premium to open this link" : title}
            aria-label={title}
            aria-disabled={archived || undefined}
            className="group flex size-14 shrink-0 cursor-pointer items-center justify-center rounded-md border border-hub-border bg-hub-background transition-[transform,border-color,box-shadow] duration-200 hover:-translate-y-1 hover:border-hub-accent hover:shadow-[0_0_16px_color-mix(in_oklab,var(--hub-accent)_18%,transparent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-hub-accent active:scale-95"
          >
            {icon ? (
              <img src={icon} alt="" width={32} height={32} className="size-8 transition-transform duration-200 group-hover:scale-110" />
            ) : (
              <span className="flex size-8 items-center justify-center bg-hub-accent font-bold text-hub-background">
                {title.charAt(0).toUpperCase()}
              </span>
            )}
          </a>
        );
      })}
    </div>
  );
}

export function BrandLink({ className }: { className?: string }) {
  return (
    <a
      href="https://landingpagebuilder.aurunex.com/"
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Landing Page Builder home"
      className={cn(
        "inline-flex items-center gap-2 text-[11px] font-semibold text-hub-muted transition-colors hover:text-hub-accent",
        className,
      )}
    >
      <img src="/favicon.svg" alt="" width={20} height={20} className="h-5 w-5 rounded" />
      Landing Page Builder
    </a>
  );
}

function Avatar({ url, initials, size }: { url: string | null; initials: string; size: "md" | "lg" }) {
  const dims = size === "lg" ? "h-20 w-20 rounded-full text-2xl" : "h-14 w-14 rounded-md text-lg";
  return url ? (
    <img src={url} alt="" className={cn(dims, "border border-hub-border object-cover grayscale")} />
  ) : (
    <div
      className={cn(
        dims,
        "flex items-center justify-center border border-hub-border bg-hub-background font-display font-semibold text-hub-accent",
      )}
    >
      {initials}
    </div>
  );
}

export function StartPageView({
  profile,
  links,
  archived = false,
  modeOverride,
  hideBrand = false,
  openAll = false,
  tabName,
}: {
  profile: StartPageProfile;
  links: StartPageLink[];
  archived?: boolean;
  modeOverride?: ColourMode;
  hideBrand?: boolean;
  /** Show Open all controls (published page). */
  openAll?: boolean;
  tabName?: string | undefined;
  adSlot?: React.ReactNode;
}) {
  const safe = links.filter((l) => isSafeUrl(l.url));
  const groups = groupLinks(safe);
  const name = profile.display_name || profile.slug;
  const tagline =
    profile.tagline.trim().toLowerCase() === "everything at once :)"
      ? DEFAULT_TAGLINE
      : profile.tagline || DEFAULT_TAGLINE;
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
  const clocks = parseClocks(profile.clocks);
  const canOpen = openAll && !archived;
  const count = (n: number) => (
    <span className="text-[10px] tabular-nums text-hub-muted" title={linkCountLabel(n)} aria-label={linkCountLabel(n)}>{String(n).padStart(2, "0")}</span>
  );
  const tabBar = canOpen && safe.length ? (
    <div className="mb-3 flex justify-end"><OpenAllButton urls={safe.map((l) => l.url)} scope={`the ${tabName ?? "current"} tab`} className="border border-hub-border" /></div>
  ) : null;
  const appearance = readPageTheme(profile.theme, profile.dark_mode);
  const isList = appearance.layout === "list";
  // "dark" re-applies the dark palette inside the page; "hub-light" swaps the page's own colours to light.
  const paletteClass = "theme-scope";

  const footer = (
    <footer className="mt-4 flex flex-col gap-2 border-t border-hub-border pt-4 text-[10px] uppercase text-hub-muted sm:flex-row sm:items-center sm:justify-between md:col-span-2">
      <span>{name} · Personal hub</span>
      <a href="https://aurunex.com/" target="_blank" rel="noopener noreferrer" className="transition-colors hover:text-hub-accent">
        Built with Landing Page Builder by AuruNex
      </a>
    </footer>
  );

  if (isList) {
    return (
      <div data-colour-mode={modeOverride ?? appearance.mode} style={themeStyle(appearance.preset)} className={cn(paletteClass, "min-h-screen bg-hub-background text-hub-foreground")}>
        <main className="mx-auto w-full max-w-[560px] px-4 py-6 sm:py-10">
          {!hideBrand ? <BrandLink className="mb-6" /> : null}
          {archived ? <p className="mb-4 rounded-md border border-hub-accent/40 p-3 text-sm">Archived on the Free plan. Your links are saved, but opening them requires Premium.</p> : null}
          <header className="flex flex-col items-center text-center">
            <Avatar url={profile.avatar_url} initials={initials} size="lg" />
            <h1 className="mt-4 font-display text-2xl font-semibold leading-tight">{name}</h1>
            <p className="mt-2 max-w-sm text-sm leading-6 text-hub-muted">{tagline}</p>
            <div className="mt-3 flex justify-center"><SocialLinks value={profile.social_links} disabled={archived} /></div>
          </header>

          {clocks.length ? (
            <div className="mt-6">
              <WorldClocks clocks={clocks} dark={profile.dark_mode} compact />
            </div>
          ) : null}

          <div className="mt-6 space-y-6">
            {tabBar}
            {safe.length === 0 ? (
              <p className="rounded-lg border border-hub-border bg-hub-surface p-5 text-center text-sm text-hub-muted">No links yet.</p>
            ) : (
              groups.map(([group, items]) => {
                const label = group || "Personal";
                const fullLinks = items.filter((link) => !link.icon_only);
                const logoLinks = items.filter((link) => link.icon_only);
                return (
                  <section key={group || "__default"} aria-label={`${label}, ${linkCountLabel(items.length)}`} title={`${label}: ${linkCountLabel(items.length)}`}>
                    <div className="mb-2 flex items-center justify-between px-1">
                      <h2 className="flex items-center gap-2 font-display text-xs font-semibold uppercase text-hub-muted">
                        <Folder className="h-3.5 w-3.5 text-hub-accent" aria-hidden="true" />
                        {label}
                      </h2>
                      <span className="flex items-center gap-1">{canOpen ? <OpenAllButton urls={items.map((l) => l.url)} scope={`folder ${label}`} /> : null}{count(items.length)}</span>
                    </div>
                    {fullLinks.length ? (
                      <div className="grid gap-2">
                        {fullLinks.map((link) => (
                          <LinkCard key={link.id} link={link} tall={false} archived={archived} />
                        ))}
                      </div>
                    ) : null}
                    <QuickTiles
                      archived={archived}
                      links={logoLinks}
                      label={label}
                      className={cn("justify-center", fullLinks.length ? "mt-2" : "")}
                    />
                  </section>
                );
              })
            )}
          </div>
          <div className="mt-8">{footer}</div>
        </main>
      </div>
    );
  }

  return (
    <div data-colour-mode={modeOverride ?? appearance.mode} style={themeStyle(appearance.preset)} className={cn(paletteClass, "min-h-screen bg-hub-background text-hub-foreground")}>
      <main className="mx-auto w-full max-w-[1120px] px-4 py-5 sm:px-6 sm:py-8">
        {!hideBrand ? <BrandLink className="mb-4" /> : null}
        {archived ? <p className="mb-4 rounded-md border border-hub-accent/40 p-3 text-sm">Archived on the Free plan. Your links are saved, but opening them requires Premium.</p> : null}
        <div className="grid items-start gap-4 md:grid-cols-[220px_minmax(0,1fr)]">
          <aside className="grid gap-4 sm:grid-cols-2 md:grid-cols-1">
            <header className="rounded-lg border border-hub-border bg-hub-surface p-5">
              <Avatar url={profile.avatar_url} initials={initials} size="md" />
              <h1 className="mt-5 font-display text-2xl font-semibold leading-tight">{name}</h1>
              <p className="mt-2 text-xs leading-5 text-hub-muted">{tagline}</p>
              <div className="mt-5 flex items-center gap-2 border-t border-hub-border pt-4 text-[10px] font-semibold uppercase text-hub-muted">
                {parseSocialLinks(profile.social_links).length ? <SocialLinks value={profile.social_links} disabled={archived} /> : <><span className="h-1.5 w-1.5 rounded-full bg-hub-accent" aria-hidden="true" /> Personal hub</>}
              </div>
            </header>
            <WorldClocks clocks={clocks} dark={profile.dark_mode} />
          </aside>

          <div className="min-w-0">
            {tabBar}
            <div className="grid gap-4 lg:grid-cols-2">
              {safe.length === 0 ? (
                <p className="rounded-lg border border-hub-border bg-hub-surface p-5 text-sm text-hub-muted">No links yet.</p>
              ) : (
                groups.map(([group, items], groupIndex) => {
                  const label = group || "Personal";
                  const featured = groups.length % 2 === 1 && groupIndex === 0;
                  const fullLinks = items.filter((link) => !link.icon_only);
                  const logoLinks = items.filter((link) => link.icon_only);
                  return (
                    <section
                      key={group || "__default"}
                      className={cn("rounded-lg border border-hub-border bg-hub-surface p-4", featured && "lg:col-span-2")}
                    >
                      <div className="mb-3 flex items-center justify-between">
                        <div className="flex min-w-0 items-center gap-2.5">
                          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-hub-background text-hub-accent">
                            <Folder className="h-4 w-4" aria-hidden="true" />
                          </span>
                          <h2 className="truncate font-display text-sm font-semibold text-hub-foreground" title={`${label}: ${linkCountLabel(items.length)}`}>{label}</h2>
                        </div>
                        <span className="flex items-center gap-1">{canOpen ? <OpenAllButton urls={items.map((l) => l.url)} scope={`folder ${label}`} /> : null}{count(items.length)}</span>
                      </div>
                      {fullLinks.length ? (
                        <div className={cn("grid grid-cols-1 gap-2", featured && "sm:grid-cols-2")}>
                          {fullLinks.map((link) => (
                            <LinkCard key={link.id} link={link} archived={archived} />
                          ))}
                        </div>
                      ) : null}
                      <QuickTiles links={logoLinks} label={label} className={fullLinks.length ? "mt-2" : ""} archived={archived} />
                    </section>
                  );
                })
              )}
            </div>
          </div>
          {footer}
        </div>
      </main>
    </div>
  );
}
