import { useEffect, useMemo, useState } from "react";
import { BarChart3, Check, ChevronRight, Clock3, ExternalLink, Globe2, Pencil, Rocket, RotateCcw, Star, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { faviconFor, hostOf, normalizeUrl } from "@/lib/startpage";

export type DashboardLink = { id: string; name: string; url: string; favourite?: boolean };
export type DashboardClock = { tz: string; label: string };

type Props = {
  profileId: string;
  profileName: string;
  displayName: string;
  tagline: string;
  avatarUrl: string | null;
  slug: string;
  published: boolean;
  links: DashboardLink[];
  clocks: DashboardClock[];
  editing: boolean;
  onEditIdentity: () => void;
  onEditClocks: () => void;
  onPublish: () => void;
};

const recentKey = (profileId: string) => `landing-page-builder:recent:${profileId}`;
const visitsKey = (profileId: string) => `landing-page-builder:visits:${profileId}`;
const SEVEN_DAYS = 7 * 24 * 60 * 60 * 1000;
type Visit = { id: string; at: number };

function clockValue(tz: string) {
  return new Intl.DateTimeFormat("en-GB", { timeZone: tz, hour: "2-digit", minute: "2-digit", hour12: false }).format(new Date());
}

function dateValue(tz: string) {
  return new Intl.DateTimeFormat("en-GB", { timeZone: tz, weekday: "short", day: "numeric", month: "short" }).format(new Date());
}

function greetingValue(tz: string) {
  const hourPart = new Intl.DateTimeFormat("en-GB", { timeZone: tz, hour: "numeric", hourCycle: "h23" })
    .formatToParts(new Date())
    .find((part) => part.type === "hour");
  const hour = Number(hourPart?.value ?? 12);
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

function LinkItem({ link, onOpen }: { link: DashboardLink; onOpen: () => void }) {
  const icon = faviconFor(link.url);
  return (
    <a href={normalizeUrl(link.url)} target="_blank" rel="noopener noreferrer" onClick={onOpen} className="group flex min-h-11 items-center gap-3 rounded-md border border-transparent px-2.5 transition-colors hover:border-hub-border hover:bg-hub-elevated/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-hub-accent">
      {icon ? <img src={icon} alt="" className="size-6 rounded-sm" /> : <span className="grid size-6 place-items-center rounded-sm bg-hub-accent font-semibold text-hub-background">{link.name.slice(0, 1)}</span>}
      <span className="min-w-0 flex-1"><span className="block truncate text-[13px] font-medium">{link.name}</span><span className="block truncate text-[10px] text-hub-muted">{hostOf(link.url)}</span></span>
      <ChevronRight className="size-4 text-hub-muted transition-transform group-hover:translate-x-0.5 group-hover:text-hub-accent" />
    </a>
  );
}

export function HomeDashboard({ profileId, profileName, displayName, tagline, avatarUrl, slug, published, links, clocks, editing, onEditIdentity, onEditClocks, onPublish }: Props) {
  const [tick, setTick] = useState(0);
  const [recentIds, setRecentIds] = useState<string[]>([]);
  const [visits, setVisits] = useState<Visit[]>([]);
  const favourites = useMemo(() => links.filter((link) => link.favourite).slice(0, 6), [links]);
  const recent = recentIds.map((id) => links.find((link) => link.id === id)).filter((link): link is DashboardLink => Boolean(link)).slice(0, 8);
  const mostVisited = useMemo(() => {
    const cutoff = Date.now() - SEVEN_DAYS;
    const totals = new Map<string, { count: number; last: number }>();
    visits.filter((visit) => visit.at >= cutoff).forEach((visit) => {
      const current = totals.get(visit.id) ?? { count: 0, last: 0 };
      totals.set(visit.id, { count: current.count + 1, last: Math.max(current.last, visit.at) });
    });
    return Array.from(totals.entries())
      .map(([id, activity]) => ({ link: links.find((link) => link.id === id), ...activity }))
      .filter((item): item is { link: DashboardLink; count: number; last: number } => Boolean(item.link))
      .sort((a, b) => b.count - a.count || b.last - a.last)
      .slice(0, 4);
  }, [links, visits]);
  const leadClock = clocks[0] ?? { tz: "Europe/London", label: "London" };

  useEffect(() => {
    const timer = window.setInterval(() => setTick((value) => value + 1), 30_000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(recentKey(profileId));
      setRecentIds(stored ? JSON.parse(stored) : []);
      const storedVisits = window.localStorage.getItem(visitsKey(profileId));
      const cutoff = Date.now() - SEVEN_DAYS;
      const nextVisits = storedVisits ? (JSON.parse(storedVisits) as Visit[]).filter((visit) => visit.at >= cutoff) : [];
      setVisits(nextVisits);
      window.localStorage.setItem(visitsKey(profileId), JSON.stringify(nextVisits));
    } catch {
      setRecentIds([]);
      setVisits([]);
    }
  }, [profileId]);

  function remember(link: DashboardLink) {
    setRecentIds((current) => {
      const next = [link.id, ...current.filter((id) => id !== link.id)].slice(0, 10);
      try { window.localStorage.setItem(recentKey(profileId), JSON.stringify(next)); } catch { /* Browser storage is optional. */ }
      return next;
    });
    setVisits((current) => {
      const cutoff = Date.now() - SEVEN_DAYS;
      const next = [...current.filter((visit) => visit.at >= cutoff), { id: link.id, at: Date.now() }].slice(-500);
      try { window.localStorage.setItem(visitsKey(profileId), JSON.stringify(next)); } catch { /* Browser storage is optional. */ }
      return next;
    });
  }

  function clearRecent() {
    setRecentIds([]);
    try { window.localStorage.removeItem(recentKey(profileId)); } catch { /* Browser storage is optional. */ }
  }

  return (
    <div className="mt-5 space-y-4" data-tick={tick}>
      <section className="relative overflow-hidden rounded-lg border border-hub-border bg-hub-surface p-5 sm:p-6">
        <div className="absolute inset-x-0 top-0 h-px bg-hub-accent/70" />
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
          <div className="flex min-w-0 items-center gap-4">
            <div className="shrink-0">{avatarUrl ? <img src={avatarUrl} alt={`${displayName} profile`} className="size-16 rounded-md border border-hub-border object-cover sm:size-20" /> : <span className="grid size-16 place-items-center rounded-md border border-hub-border bg-hub-elevated font-display text-xl font-semibold text-hub-accent sm:size-20 sm:text-2xl">{displayName.split(/\s+/).map((part) => part[0]).join("").slice(0, 2).toUpperCase() || "?"}</span>}</div>
            <div className="min-w-0">
              <p className="text-[10px] font-semibold uppercase text-hub-accent">Your daily starting point</p>
              <h2 className="mt-1 font-display text-2xl font-medium leading-tight text-hub-foreground sm:text-3xl" suppressHydrationWarning>{greetingValue(leadClock.tz)}, {displayName}.</h2>
              <p className="mt-1 line-clamp-2 text-xs text-hub-muted">{tagline}</p>
              <p className="mt-1 text-[10px] text-hub-muted" suppressHydrationWarning>{dateValue(leadClock.tz)} · {profileName}</p>
              {editing ? <Button variant="ghost" size="sm" className="mt-2 h-8 px-0 text-hub-accent hover:bg-transparent hover:text-hub-foreground" onClick={onEditIdentity}><Pencil className="size-3.5" /> Edit name & picture</Button> : null}
            </div>
          </div>
          <div className="flex items-end justify-between gap-5 border-t border-hub-border pt-4 lg:border-l lg:border-t-0 lg:pl-7 lg:pt-0">
            <div><p className="font-display text-4xl font-light tabular-nums text-hub-accent sm:text-5xl" suppressHydrationWarning>{clockValue(leadClock.tz)}</p><p className="mt-1 text-[10px] uppercase text-hub-muted">{leadClock.label} · Local time</p></div>
            <span className="mb-2 size-2 rounded-full bg-hub-accent shadow-[0_0_12px_var(--hub-accent)] motion-safe:animate-pulse" aria-label="Clock is live" />
          </div>
        </div>
      </section>

      <div className="grid gap-4 xl:grid-cols-12">
        <section className="rounded-lg border border-hub-border bg-hub-surface p-4 xl:col-span-12">
          <div className="flex items-center justify-between gap-3"><div><p className="text-[10px] font-semibold uppercase text-hub-muted">World time</p><h3 className="mt-1 font-display text-base font-semibold">Your places, at a glance</h3></div>{editing ? <Button variant="ghost" size="sm" className="text-hub-muted hover:text-hub-accent" onClick={onEditClocks}><Pencil /> Edit clocks</Button> : null}</div>
          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            {clocks.map((clock, index) => <div key={`${clock.tz}-${clock.label}`} className={`rounded-md border p-3 transition-colors hover:border-hub-accent/60 ${index === 0 ? "border-hub-accent/35 bg-hub-elevated/55" : "border-hub-border bg-hub-background/45"}`}><div className="flex items-center justify-between"><span className="flex items-center gap-1.5 text-xs text-hub-muted"><Globe2 className="size-3.5" />{clock.label}</span><span className="text-[10px] text-hub-muted" suppressHydrationWarning>{dateValue(clock.tz)}</span></div><p className="mt-3 font-display text-2xl tabular-nums text-hub-foreground" suppressHydrationWarning>{clockValue(clock.tz)}</p></div>)}
          </div>
        </section>

        <section className="rounded-lg border border-hub-border bg-hub-surface p-4 xl:col-span-12">
          <div className="flex items-center justify-between"><div><p className="text-[10px] font-semibold uppercase text-hub-muted">Pinned across your tabs</p><h3 className="mt-1 flex items-center gap-2 font-display text-base font-semibold"><Star className="size-4 fill-hub-accent text-hub-accent" /> Favourite links</h3></div><span className="text-xs tabular-nums text-hub-muted">{favourites.length}</span></div>
          {favourites.length ? <div className="mt-3 grid gap-1 sm:grid-cols-2">{favourites.map((link) => <LinkItem key={link.id} link={link} onOpen={() => remember(link)} />)}</div> : <p className="mt-5 text-xs text-hub-muted">{editing ? "Mark a link as favourite in any tab and it will appear here." : "No favourites yet — open a tab above to see all links."}</p>}
        </section>

        <section className="rounded-lg border border-hub-border bg-hub-surface p-4 xl:col-span-6">
          <div className="flex items-center justify-between"><div><p className="text-[10px] font-semibold uppercase text-hub-muted">This browser · last 7 days</p><h3 className="mt-1 flex items-center gap-2 font-display text-base font-semibold"><BarChart3 className="size-4 text-hub-accent" /> Most visited</h3></div></div>
          <p className="mt-2 text-[11px] text-hub-muted">(Counts only links you open from this landing page)</p>
          {mostVisited.length ? <div className="mt-2 space-y-1">{mostVisited.map(({ link, count }) => <div key={link.id} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2"><LinkItem link={link} onOpen={() => remember(link)} /><span className="pr-2 text-[10px] tabular-nums text-hub-muted">{count} {count === 1 ? "open" : "opens"}</span></div>)}</div> : <div className="mt-5 flex items-center gap-3 rounded-md border border-dashed border-hub-border p-3 text-xs text-hub-muted"><BarChart3 className="size-4" />Your most-used links will appear here.</div>}
        </section>

        <section className="rounded-lg border border-hub-border bg-hub-surface p-4 xl:col-span-6">
          <div className="flex items-center justify-between"><div><p className="text-[10px] font-semibold uppercase text-hub-muted">This browser only</p><h3 className="mt-1 flex items-center gap-2 font-display text-base font-semibold"><Clock3 className="size-4 text-hub-accent" /> Recently opened here</h3></div>{recent.length ? <Button variant="ghost" size="icon" className="size-8 text-hub-muted" onClick={clearRecent} aria-label="Clear recently opened links"><X /></Button> : null}</div>
          <p className="mt-2 text-[11px] text-hub-muted">(Only links you open from this landing page)</p>
          {recent.length ? <div className="mt-2 space-y-1">{recent.slice(0, 4).map((link) => <LinkItem key={link.id} link={link} onOpen={() => remember(link)} />)}</div> : <div className="mt-5 flex items-center gap-3 rounded-md border border-dashed border-hub-border p-3 text-xs text-hub-muted"><RotateCcw className="size-4" />Your recent links will collect here.</div>}
        </section>
      </div>

      {editing ? <section className="overflow-hidden rounded-lg border border-hub-accent/45 bg-hub-elevated/55">
        <div className="grid gap-4 p-5 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
          <div className="flex gap-3"><span className="grid size-10 shrink-0 place-items-center rounded-md bg-hub-accent text-hub-background"><Rocket className="size-5" /></span><div><p className="font-display text-base font-semibold">{published ? "Your page is published" : "Ready to build your landing page?"}</p><p className="mt-1 text-xs leading-5 text-hub-muted">{published ? "Update the live page after your changes. Its address stays the same." : "Publish once to create an address you can open on any browser or device."}</p><p className="mt-2 flex items-center gap-1.5 font-mono text-xs text-hub-accent">{published ? <Check className="size-3.5" /> : <ExternalLink className="size-3.5" />} landingpagebuilder.aurunex.com/p/{slug}</p></div></div>
          <Button onClick={onPublish} className="w-full sm:w-auto">{published ? "Publish changes to live page" : "Publish this page"}</Button>
        </div>
      </section> : null}
    </div>
  );
}