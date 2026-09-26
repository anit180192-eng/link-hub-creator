import { ColourModeToggle, useSavedMode } from "@/components/ColourControls";
import { readPageTheme, themeStyle } from "@/lib/page-themes";
import { parseWidgets, recordVisit } from "@/lib/home-widgets";
import { useMemo, useState } from "react";
import { Search, X, ArrowUpRight } from "lucide-react";
import { folderName } from "@/lib/folder-names";
import { StartPageView, BrandLink } from "@/components/StartPageView";
import { HomeDashboard } from "@/components/workspace/HomeDashboard";
import { cn } from "@/lib/utils";
import {
  isSafeUrl,
  linkTitle,
  normalizeUrl,
  hostOf,
  parseClocks,
  type StartPageLink,
  type StartPageProfile,
} from "@/lib/startpage";

export function PublishedTabs({
  profile,
  links,
  tabs,
  archivedProfile = false,
  initialTabId,
  embedded = false,
}: {
  profile: StartPageProfile;
  links: StartPageLink[];
  tabs: { id: string; name: string; archived: boolean }[];
  archivedProfile?: boolean;
  initialTabId?: string;
  embedded?: boolean;
}) {
  const [active, setActive] = useState(() =>
    initialTabId &&
    (initialTabId === "__home" || tabs.some((t) => t.id === initialTabId))
      ? initialTabId
      : parseWidgets(profile.home_widgets).length > 0 || !tabs[0]
        ? "__home"
        : tabs[0].id,
  );
  const [query, setQuery] = useState("");
  const searching = query.trim().length > 0;
  const results = useMemo(() => {
    const terms = query.trim().toLocaleLowerCase().split(/\s+/).filter(Boolean);
    if (!terms.length) return [];
    return links.flatMap((link) => {
      const tab = tabs.find((t) => t.id === (link.tab_id || tabs[0]?.id));
      if (!tab || !isSafeUrl(link.url)) return [];
      const folder = folderName(link.group_name);
      const haystack = [linkTitle(link), link.url, folder, tab.name].join(" ").toLocaleLowerCase();
      return terms.every((term) => haystack.includes(term))
        ? [{ link, tab, folder, archived: archivedProfile || tab.archived }]
        : [];
    });
  }, [query, links, tabs, archivedProfile]);
  const appearance = readPageTheme(profile.theme, profile.dark_mode);
  const [mode, setMode] = useSavedMode(
    embedded ? null : "lpb-page-mode:" + profile.slug,
    appearance.mode,
  );
  const palette = "theme-scope";
  const first = tabs[0]?.id;
  const tabLinks = links.filter(
    (l) => l.tab_id === active || (!l.tab_id && active === first),
  );
  const activeTabIds = new Set(
    tabs.filter((t) => !t.archived).map((t) => t.id),
  );
  const dash = links
    .filter(
      (l) =>
        !archivedProfile &&
        isSafeUrl(l.url) &&
        (activeTabIds.has(l.tab_id ?? "") ||
          (!l.tab_id && first && activeTabIds.has(first))),
    )
    .map((l) => ({
      id: l.id,
      name: linkTitle(l),
      url: l.url,
      favourite: !!l.favourite,
    }));
  const name = profile.display_name || profile.slug;
  const btn = (id: string, label: string) => (
    <button
      key={id}
      type="button"
      onClick={() => setActive(id)}
      className={cn(
        "shrink-0 rounded-md px-3 py-1.5 text-sm font-semibold transition-colors",
        active === id
          ? "bg-hub-accent text-hub-background"
          : "text-hub-muted hover:text-hub-foreground",
      )}
    >
      {label}
    </button>
  );
  return (
    <div
      onClickCapture={(event) => {
        if (embedded || archivedProfile) return;
        const anchor = (event.target as Element).closest("a");
        if (!anchor?.href) return;
        const link = dash.find((l) => {
          try {
            return new URL(l.url, window.location.href).href === anchor.href;
          } catch {
            return false;
          }
        });
        if (link) recordVisit(profile.slug, link.id);
      }}
      data-colour-mode={mode}
      style={themeStyle(appearance.preset)}
      className={cn(
        palette,
        embedded ? "min-h-[520px]" : "min-h-screen",
        "bg-hub-background text-hub-foreground",
      )}
    >
      <header className="mx-auto flex max-w-[1120px] flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
        <BrandLink />
        {!embedded ? <ColourModeToggle
          value={mode}
          onChange={setMode}
          label="Published page colour mode"
        /> : null}
      </header>
      <nav
        className={cn(
          !embedded && "sticky top-0",
          "z-10 border-b border-hub-border bg-hub-background/95 backdrop-blur",
        )}
        aria-label="Tabs"
      >
        <div className="mx-auto max-w-[1120px] px-4 pt-3 sm:px-6" role="search" aria-label="Search this profile">
          <div className="flex items-center gap-2 rounded-lg border border-hub-border bg-hub-surface px-3 focus-within:ring-2 focus-within:ring-hub-accent">
            <Search className="h-4 w-4 shrink-0 text-hub-muted" aria-hidden="true" />
            <input
              type="search"
              aria-label="Search links across all tabs"
              placeholder="Search links across all tabs…"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              onKeyDown={(event) => { if (event.key === "Escape") setQuery(""); }}
              className="min-w-0 flex-1 bg-transparent py-3 text-sm text-hub-foreground outline-none placeholder:text-hub-muted [&::-webkit-search-cancel-button]:hidden"
            />
            {query ? <button type="button" aria-label="Clear search" onClick={() => setQuery("")} className="rounded p-2 text-hub-muted hover:text-hub-foreground focus-visible:ring-2 focus-visible:ring-hub-accent"><X className="h-4 w-4" /></button> : null}
          </div>
        </div>
        <div className="mx-auto flex max-w-[1120px] gap-1 overflow-x-auto px-4 py-2 sm:px-6">
          {btn("__home", "Home")}
          {tabs.map((t) =>
            btn(t.id, `${t.name}${t.archived ? " · Archived" : ""}`),
          )}
        </div>
      </nav>
      {searching ? (
        <main className="mx-auto w-full max-w-[1120px] px-4 py-5 sm:px-6 sm:py-8">
          <h1 className="text-xl font-semibold">Search results</h1>
          <p role="status" aria-live="polite" className="mb-5 mt-1 text-sm text-hub-muted">{results.length} {results.length === 1 ? "link" : "links"} found across all tabs</p>
          {results.length ? <ul className="grid gap-3 sm:grid-cols-2">
            {results.map(({ link, tab, folder, archived }) => <li key={link.id} className="min-w-0 rounded-lg border border-hub-border bg-hub-surface p-4">
              <p className="mb-2 break-words text-xs text-hub-muted">{tab.name} / {folder}{archived ? " · Archived" : ""}</p>
              <a href={archived ? undefined : normalizeUrl(link.url)} target={archived ? undefined : "_blank"} rel="noopener noreferrer" aria-disabled={archived || undefined} className="flex items-center justify-between gap-3 rounded text-sm font-semibold text-hub-foreground focus-visible:ring-2 focus-visible:ring-hub-accent">
                <span className="min-w-0 break-words">{linkTitle(link)}</span>
                {!archived ? <ArrowUpRight className="h-4 w-4 shrink-0 text-hub-accent" aria-hidden="true" /> : null}
              </a>
              <p className="mt-1 break-all text-xs text-hub-muted">{hostOf(link.url)}</p>
              {archived ? <p className="mt-2 text-xs text-hub-muted">Archived — renew Premium to open this link.</p> : null}
              <button type="button" onClick={() => { setActive(tab.id); setQuery(""); }} className="mt-3 rounded text-xs font-semibold text-hub-accent underline underline-offset-4 focus-visible:ring-2 focus-visible:ring-hub-accent">View in {tab.name}</button>
            </li>)}
          </ul> : <p className="rounded-lg border border-hub-border p-5 text-sm text-hub-muted">No matching links. Try a website name, address, folder or tab name.</p>}
        </main>
      ) : active === "__home" ? (
        <main className="mx-auto w-full max-w-[1120px] px-4 py-5 sm:px-6 sm:py-8">
          {archivedProfile ? (
            <p className="rounded-md border border-hub-accent/40 p-3 text-sm">
              This profile is archived on the Free plan. All links remain saved
              but cannot be opened until Premium is renewed.
            </p>
          ) : null}
          <HomeDashboard
            profileId={profile.slug}
            profileName={name}
            displayName={name}
            tagline={profile.tagline}
            avatarUrl={profile.avatar_url}
            slug={profile.slug}
            published
            links={dash}
            widgets={profile.home_widgets}
            clocks={parseClocks(profile.clocks)}
            editing={false}
            onEditIdentity={() => {}}
            onEditClocks={() => {}}
            onPublish={() => {}}
          />
        </main>
      ) : (
        <StartPageView
          hideBrand
          modeOverride={mode}
          profile={profile}
          links={tabLinks}
          archived={
            archivedProfile || !!tabs.find((t) => t.id === active)?.archived
          }
        />
      )}
    </div>
  );
}
