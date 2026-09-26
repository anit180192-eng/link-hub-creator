import { ColourModeToggle, useSavedMode } from "@/components/ColourControls";
import { readPageTheme, themeStyle } from "@/lib/page-themes";
import { useState } from "react";
import { StartPageView } from "@/components/StartPageView";
import { HomeDashboard } from "@/components/workspace/HomeDashboard";
import { cn } from "@/lib/utils";
import { isSafeUrl, linkTitle, parseClocks, type StartPageLink, type StartPageProfile } from "@/lib/startpage";

export function PublishedTabs({ profile, links, tabs, archivedProfile = false, initialTabId, embedded = false }: { profile: StartPageProfile; links: StartPageLink[]; tabs: { id: string; name: string; archived: boolean }[]; archivedProfile?: boolean; initialTabId?: string; embedded?: boolean }) {
  const [active, setActive] = useState(() => initialTabId && (initialTabId === "__home" || tabs.some(t => t.id === initialTabId)) ? initialTabId : (links.some((l) => l.favourite) || !tabs[0] ? "__home" : tabs[0].id));
  const appearance = readPageTheme(profile.theme, profile.dark_mode);
  const [mode, setMode] = useSavedMode(embedded ? null : "lpb-page-mode:" + profile.slug, appearance.mode);
  const palette = "theme-scope";
  const first = tabs[0]?.id;
  const tabLinks = links.filter((l) => l.tab_id === active || (!l.tab_id && active === first));
  const activeTabIds = new Set(tabs.filter((t) => !t.archived).map((t) => t.id));
  const dash = links.filter((l) => !archivedProfile && isSafeUrl(l.url) && (activeTabIds.has(l.tab_id ?? "") || (!l.tab_id && first && activeTabIds.has(first)))).map((l) => ({ id: l.id, name: linkTitle(l), url: l.url, favourite: !!l.favourite }));
  const name = profile.display_name || profile.slug;
  const btn = (id: string, label: string) => (
    <button
      key={id}
      type="button"
      onClick={() => setActive(id)}
      className={cn(
        "shrink-0 rounded-md px-3 py-1.5 text-sm font-semibold transition-colors",
        active === id ? "bg-hub-accent text-hub-background" : "text-hub-muted hover:text-hub-foreground",
      )}
    >
      {label}
    </button>
  );
  return (
    <div data-colour-mode={mode} style={themeStyle(appearance.preset)} className={cn(palette, embedded ? "min-h-[520px]" : "min-h-screen", "bg-hub-background text-hub-foreground")}>
      {!embedded ? <div className="mx-auto flex max-w-[1120px] justify-end px-4 pt-3"><ColourModeToggle value={mode} onChange={setMode} label="Published page colour mode" /></div> : null}
      <nav className={cn(!embedded && "sticky top-0", "z-10 border-b border-hub-border bg-hub-background/95 backdrop-blur")} aria-label="Tabs">
        <div className="mx-auto flex max-w-[1120px] gap-1 overflow-x-auto px-4 py-2 sm:px-6">
          {btn("__home", "Home")}
          {tabs.map((t) => btn(t.id, `${t.name}${t.archived ? " · Archived" : ""}`))}
        </div>
      </nav>
      {active === "__home" ? (
        <main className="mx-auto w-full max-w-[1120px] px-4 py-5 sm:px-6 sm:py-8">
          {archivedProfile ? <p className="rounded-md border border-hub-accent/40 p-3 text-sm">This profile is archived on the Free plan. All links remain saved but cannot be opened until Premium is renewed.</p> : null}
          <HomeDashboard
            profileId={profile.slug}
            profileName={name}
            displayName={name}
            tagline={profile.tagline}
            avatarUrl={profile.avatar_url}
            slug={profile.slug}
            published
            links={dash}
            clocks={parseClocks(profile.clocks)}
            editing={false}
            onEditIdentity={() => {}}
            onEditClocks={() => {}}
            onPublish={() => {}}
          />
        </main>
      ) : (
        <StartPageView modeOverride={mode} profile={profile} links={tabLinks} archived={archivedProfile || !!tabs.find((t) => t.id === active)?.archived} />
      )}
    </div>
  );
}
