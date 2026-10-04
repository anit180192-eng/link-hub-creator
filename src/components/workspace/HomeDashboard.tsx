import { FeaturedLinksWidget } from "./FeaturedLinksWidget";
import { SocialLinks } from "@/components/SocialLinks";
import { useEffect, useState } from "react";
import {
  Plus,
  Pencil,
  ArrowUp,
  ArrowDown,
  X,
  GripVertical,
  ArrowUpRight,
  Layers3,
  Sun,
  Clock3,
  Globe2,
  StickyNote,
  CalendarDays,
  Star,
  Timer,
  ListChecks,
  History,
  BarChart3,
} from "lucide-react";
import { useDragOrder } from "./useDragOrder";
import { Button } from "@/components/ui/button";
import { ProductivityWidget } from "./ProductivityWidgets";
import { faviconFor, hostOf, normalizeUrl, clockParts } from "@/lib/startpage";
import {
  WIDGETS,
  parseWidgets,
  readActivity,
  rankVisits,
  recordVisit,
  type HomeWidget,
} from "@/lib/home-widgets";
export type DashboardLink = {
  id: string;
  name: string;
  url: string;
  favourite?: boolean;
};
const widgetIcons = { clock: Clock3, world: Globe2, notes: StickyNote, calendar: CalendarDays, featured: Layers3, favourites: Star, focus: Timer, tasks: ListChecks, recent: History, visited: BarChart3 };
function WidgetIcon({ id }: { id: HomeWidget["id"] }) {
  const Icon = widgetIcons[id];
  return <Icon size={17} aria-hidden="true" />;
}
export type DashboardSpace = { id: string; name: string; count: number };
export type DashboardClock = { tz: string; label: string };
type Props = {
  profileId: string;
  profileName: string;
  displayName: string;
  tagline: string;
  socialLinks?: unknown;
  socialDisabled?: boolean;
  avatarUrl: string | null;
  slug: string;
  published: boolean;
  links: DashboardLink[];
  clocks: DashboardClock[];
  editing: boolean;
  widgets?: unknown;
  saving?: boolean;
  onWidgetsChange?: (widgets: HomeWidget[]) => void;
  onAddWidget?: () => void;
  onEditIdentity: () => void;
  onEditClocks: () => void;
  onPublish: () => void;
  spaces?: DashboardSpace[];
  onOpenSpace?: (id: string) => void;
  onFindLinks?: () => void;
};
export function HomeDashboard({
  profileName,
  displayName,
  tagline,
  socialLinks,
  socialDisabled,
  avatarUrl,
  slug,
  published,
  links,
  clocks,
  editing,
  widgets,
  saving,
  onWidgetsChange,
  onAddWidget,
  onEditIdentity,
  onEditClocks,
  onPublish,
  spaces = [],
  onOpenSpace,
  onFindLinks,
}: Props) {
  const IdentityHeading = editing ? "h2" : "h1";
  const layout = parseWidgets(widgets);
  const homeClock = !editing && layout.some((w) => w.id === "clock");
  const visibleLayout = homeClock ? layout.filter((w) => w.id !== "clock") : layout;
  const drag = useDragOrder(
    layout.map((w) => w.id),
    slug,
    !editing || !!saving,
    (ids) =>
      onWidgetsChange?.(ids.map((id) => layout.find((w) => w.id === id)!)),
  );
  const [now, setNow] = useState<Date | null>(null);
  const greeting = !now ? "Your daily space" : now.getHours() < 12 ? "Good morning" : now.getHours() < 18 ? "Good afternoon" : "Good evening";
  const [activity, setActivity] = useState<ReturnType<typeof readActivity>>({
    visits: [],
    recent: [],
  });
  useEffect(() => {
    const refresh = () => {
      setNow(new Date());
      setActivity(readActivity(slug));
    };
    refresh();
    const timer = window.setInterval(refresh, 30_000);
    window.addEventListener("lpb-activity", refresh);
    window.addEventListener("storage", refresh);
    return () => {
      clearInterval(timer);
      window.removeEventListener("lpb-activity", refresh);
      window.removeEventListener("storage", refresh);
    };
  }, [slug]);
  const favourites = links.filter((l) => l.favourite);
  const most = rankVisits(activity.visits, now?.getTime())
    .flatMap((v) => {
      const link = links.find((l) => l.id === v.id);
      return link ? [{ link, count: v.count }] : [];
    })
    .slice(0, 20);
  const recent = activity.recent.flatMap((id) => {
    const link = links.find((l) => l.id === id);
    return link ? [link] : [];
  });
  const move = (index: number, delta: number) => {
    const next = [...layout];
    const from = next[index],
      to = next[index + delta];
    if (!from || !to) return;
    [next[index], next[index + delta]] = [to, from];
    onWidgetsChange?.(next);
  };
  const linkItem = (link: DashboardLink) => (
    <a
      key={link.id}
      href={normalizeUrl(link.url)}
      target="_blank"
      rel="noopener noreferrer"
      onClick={() => {
        if (editing) recordVisit(slug, link.id);
      }}
      className="flex min-h-12 min-w-0 items-center gap-3 rounded-md px-2 py-2 hover:bg-hub-elevated focus-visible:ring-2 focus-visible:ring-hub-accent"
    >
      <img
        src={faviconFor(link.url) || "/favicon.svg"}
        alt=""
        className="size-6"
      />
      <span className="min-w-0">
        <span className="block truncate text-sm font-medium">{link.name}</span>
        <span className="block truncate text-xs text-hub-muted">
          {hostOf(link.url)}
        </span>
      </span>
    </a>
  );
  return (
    <div className="studio-home mt-5 space-y-4">
      <section data-home-hero={!editing || undefined} className="studio-home-identity flex flex-wrap items-center gap-4 rounded-lg border border-hub-border bg-hub-surface p-5">
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt=""
            className="size-14 rounded-md object-cover"
          />
        ) : null}
        <div className="studio-home-copy min-w-0 flex-1">
          {!editing ? <p className="studio-home-greeting"><Sun size={14} aria-hidden="true" /> {greeting}<span aria-hidden="true"> / </span><span>Your home on the web</span></p> : null}
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1"><IdentityHeading className="text-2xl font-semibold">
            {displayName || profileName}
          </IdentityHeading><SocialLinks value={socialLinks} disabled={!!socialDisabled} /></div>
          <p className="text-sm text-hub-muted">{tagline}</p>
          {!editing && onFindLinks && links.length > 0 ? <button type="button" className="studio-home-find" onClick={onFindLinks}>Find a link <ArrowUpRight size={15} aria-hidden="true" /></button> : null}
        </div>
        {homeClock ? <div className="studio-hero-clock" aria-label="Local time and date">
          <span className="studio-clock-label">LOCAL TIME</span>
          <p className="studio-hero-time">{now ? now.toLocaleTimeString([], {hour: "2-digit", minute: "2-digit"}) : "—"}</p>
          <p className="studio-hero-date">{now ? now.toLocaleDateString([], {weekday: "long", month: "long", day: "numeric"}) : "Today"}</p>
        </div> : null}
        {editing ? (
          <>
            <Button variant="ghost" onClick={onEditIdentity}>
              <Pencil />
              Edit profile
            </Button>
            <Button onClick={onAddWidget}>
              <Plus />
              Add widget
            </Button>
          </>
        ) : null}
      </section>
      {!editing && spaces.length > 0 && onOpenSpace ? <section className="studio-spaces" aria-label="Explore your spaces">
        <div className="studio-home-section-heading"><h2>Your spaces</h2><span>{spaces.length} collections, one place</span></div>
        <div className="studio-space-grid">
          {spaces.map((space, index) => <button key={space.id} type="button" className="studio-space-card" onClick={() => onOpenSpace(space.id)}>
            <span className="studio-space-icon" aria-hidden="true"><Layers3 size={20} /></span>
            <span className="studio-space-copy"><span>{space.name}</span><small>{space.count} {space.count === 1 ? "link" : "links"}</small></span>
            <ArrowUpRight className="studio-space-arrow" size={17} aria-hidden="true" />
            <span className="studio-space-number" aria-hidden="true">{String(index + 1).padStart(2, "0")}</span>
          </button>)}
        </div>
      </section> : null}
      {!editing && visibleLayout.length > 0 ? <div className="studio-home-section-heading"><h2>At a glance</h2><span>A little space for your day</span></div> : null}
      {!layout.length && (editing || !spaces.length) ? (
        <section className="rounded-lg border border-dashed border-hub-border p-10 text-center">
          <h3 className="text-lg font-semibold">
            {editing ? "Make Home your own" : "Welcome to my page"}
          </h3>
          <p className="mt-2 text-sm text-hub-muted">
            {editing
              ? "Add clocks, favourite links or browsing activity. Choose only what you need."
              : "Choose a tab above to explore the links."}
          </p>
          {editing ? (
            <Button className="mt-5" onClick={onAddWidget}>
              <Plus />
              Add your first widget
            </Button>
          ) : null}
        </section>
      ) : null}
      <div className="studio-widgets grid grid-cols-1 gap-4 md:grid-cols-2">
        {visibleLayout.map((widget, index) => (
          <section
            key={widget.id}
            data-widget={widget.id}
            {...drag.targetProps(widget.id)}
            style={
              drag.over === widget.id
                ? { outline: "2px solid var(--hub-accent)", outlineOffset: 2 }
                : undefined
            }
            className={`studio-widget min-w-0 rounded-lg border border-hub-border bg-hub-surface p-4 ${widget.size === "wide" ? "md:col-span-2" : ""}`}
          >
            <div className="studio-widget-heading mb-3 flex flex-wrap items-center justify-between gap-2">
              <h3 className="font-semibold">
                {!editing ? <span className="studio-widget-icon"><WidgetIcon id={widget.id} /></span> : null}
                {WIDGETS.find((w) => w.id === widget.id)?.name}
              </h3>
              {editing ? (
                <div className="flex flex-wrap items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-8 cursor-grab active:cursor-grabbing"
                    disabled={saving || layout.length < 2}
                    aria-label={`Drag ${WIDGETS.find((w) => w.id === widget.id)?.name} to reorder`}
                    title="Drag to reorder, or use the move buttons"
                    {...drag.handleProps(widget.id)}
                  >
                    <GripVertical />
                  </Button>
                  {widget.id === "world" ? (
                    <Button variant="ghost" size="sm" onClick={onEditClocks}>
                      Settings
                    </Button>
                  ) : null}
                  <select
                    aria-label={`Width of ${widget.id}`}
                    value={widget.size}
                    disabled={saving}
                    className="rounded border border-hub-border bg-hub-background px-2 py-1 text-xs"
                    onChange={(e) =>
                      onWidgetsChange?.(
                        layout.map((w) =>
                          w.id === widget.id
                            ? {
                                ...w,
                                size: e.target.value as HomeWidget["size"],
                              }
                            : w,
                        ),
                      )
                    }
                  >
                    <option value="compact">Compact</option>
                    <option value="wide">Wide</option>
                  </select>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-8"
                    aria-label={`Move ${widget.id} up`}
                    disabled={saving || index === 0}
                    onClick={() => move(index, -1)}
                  >
                    <ArrowUp />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-8"
                    aria-label={`Move ${widget.id} down`}
                    disabled={saving || index === layout.length - 1}
                    onClick={() => move(index, 1)}
                  >
                    <ArrowDown />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-8"
                    aria-label={`Remove ${widget.id}`}
                    disabled={saving}
                    onClick={() =>
                      onWidgetsChange?.(
                        layout.filter((w) => w.id !== widget.id),
                      )
                    }
                  >
                    <X />
                  </Button>
                </div>
              ) : null}
            </div>
            {widget.id === "featured" ? (
              <FeaturedLinksWidget
                key={`${slug}:featured`}
                links={widget.links ?? []}
                editing={editing}
                saving={!!saving}
                disabled={!!socialDisabled}
                onChange={(links) => onWidgetsChange?.(layout.map((w) => w.id === "featured" ? { ...w, links } : w))}
              />
            ) : null}
            <ProductivityWidget
              key={`${slug}:${widget.id}`}
              id={widget.id}
              profile={slug}
            />
            {widget.id === "clock" ? (
              <>
                <p className="text-4xl tabular-nums text-hub-accent">
                  {now
                    ? now.toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })
                    : "—"}
                </p>
                <p className="mt-2 text-sm text-hub-muted">
                  {now
                    ? now.toLocaleDateString([], {
                        weekday: "long",
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })
                    : "Local time"}
                </p>
              </>
            ) : null}
            {widget.id === "world" ? (
              <div className="grid gap-2 sm:grid-cols-2">
                {clocks.map((clock, i) => (
                  <div key={i} className="rounded border border-hub-border p-3">
                    <p className="text-sm text-hub-muted">{clock.label}</p>
                    <p className="mt-2 text-2xl tabular-nums">
                      {now ? clockParts(clock.tz, now).time : "—"}
                    </p>
                  </div>
                ))}
                {!clocks.length ? (
                  <p className="text-sm text-hub-muted">
                    {editing
                      ? "Open Settings to add your cities."
                      : "No cities selected yet."}
                  </p>
                ) : null}
              </div>
            ) : null}
            {widget.id === "favourites" ? (
              favourites.length ? (
                <div className="grid gap-1 sm:grid-cols-2">
                  {favourites.map(linkItem)}
                </div>
              ) : (
                <p className="text-sm text-hub-muted">
                  {editing
                    ? "Star a link in any tab to show it here."
                    : "No favourite links yet."}
                </p>
              )
            ) : null}
            {widget.id === "visited" ? (
              <>
                <p className="mb-3 text-xs text-hub-muted">
                  Top 20 · last 7 days · only links opened through this profile
                  in this browser.
                </p>
                {most.length ? (
                  most.map(({ link, count }) => (
                    <div
                      key={link.id}
                      className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2"
                    >
                      {linkItem(link)}
                      <span className="text-xs text-hub-muted">
                        {count} {count === 1 ? "open" : "opens"}
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-hub-muted">
                    Your most-used links will appear here.
                  </p>
                )}
              </>
            ) : null}
            {widget.id === "recent" ? (
              <>
                <p className="mb-3 text-xs text-hub-muted">
                  Only links opened through this profile in this browser.
                </p>
                {recent.length ? (
                  recent.map(linkItem)
                ) : (
                  <p className="text-sm text-hub-muted">
                    Your recent links will appear here.
                  </p>
                )}
              </>
            ) : null}
          </section>
        ))}
      </div>
      {editing ? (
        <section className="flex flex-wrap items-center justify-between gap-4 rounded-lg border border-hub-border bg-hub-surface p-5">
          <p className="text-sm text-hub-muted">
            {published
              ? "Your page is live. Changes save automatically."
              : "Publish your profile when you are ready."}
          </p>
          <Button onClick={onPublish}>
            {published ? "Publish settings" : "Publish this page"}
          </Button>
        </section>
      ) : null}
    </div>
  );
}
