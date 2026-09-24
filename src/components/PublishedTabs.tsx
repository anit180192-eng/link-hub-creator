import { useState } from "react";
import { StartPageView } from "@/components/StartPageView";
import { HomeDashboard } from "@/components/workspace/HomeDashboard";
import { cn } from "@/lib/utils";
import { isSafeUrl, linkTitle, parseClocks, type StartPageLink, type StartPageProfile } from "@/lib/startpage";

export function PublishedTabs({ profile, links, tabs }: { profile: StartPageProfile; links: StartPageLink[]; tabs: { id: string; name: string }[] }) {
  const [active, setActive] = useState(() => (links.some((l) => l.favourite) || !tabs[0] ? "__home" : tabs[0].id));
  const palette = profile.dark_mode ? "dark" : "hub-light";
  const first = tabs[0]?.id;
  const tabLinks = links.filter((l) => l.tab_id === active || (!l.tab_id && active === first));
  const dash = links.filter((l) => isSafeUrl(l.url)).map((l) => ({ id: l.id, name: linkTitle(l), url: l.url, favourite: !!l.favourite }));
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
    <div className={cn(palette, "min-h-screen bg-hub-background text-hub-foreground")}>
      <nav className="sticky top-0 z-10 border-b border-hub-border bg-hub-background/95 backdrop-blur" aria-label="Tabs">
        <div className="mx-auto flex max-w-[1120px] gap-1 overflow-x-auto px-4 py-2 sm:px-6">
          {btn("__home", "Home")}
          {tabs.map((t) => btn(t.id, t.name))}
        </div>
      </nav>
      {active === "__home" ? (
        <main className="mx-auto w-full max-w-[1120px] px-4 py-5 sm:px-6 sm:py-8">
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
        <StartPageView profile={profile} links={tabLinks} />
      )}
    </div>
  );
}
