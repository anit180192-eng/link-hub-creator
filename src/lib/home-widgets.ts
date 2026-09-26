export const WIDGETS = [
  {
    id: "clock",
    name: "Clock & date",
    description: "The local time and date in your browser.",
  },
  {
    id: "world",
    name: "World clocks",
    description: "Keep several cities and time zones together.",
  },
  {
    id: "favourites",
    name: "Favourite links",
    description: "Links you star across this profile.",
  },
  {
    id: "visited",
    name: "Most visited",
    description:
      "Top 20 links opened through this profile in this browser over the last seven days.",
  },
  {
    id: "recent",
    name: "Recently opened",
    description: "Return to your last opened links in this browser.",
  },
] as const;
export type WidgetId = (typeof WIDGETS)[number]["id"];
export type HomeWidget = { id: WidgetId; size: "compact" | "wide" };
export const LEGACY_WIDGETS: HomeWidget[] = WIDGETS.map(({ id }) => ({
  id,
  size: id === "visited" || id === "recent" ? "compact" : "wide",
}));
export function parseWidgets(raw: unknown): HomeWidget[] {
  if (raw == null) return LEGACY_WIDGETS.map((w) => ({ ...w }));
  if (!Array.isArray(raw)) return [];
  const seen = new Set<string>();
  return raw.flatMap((w) => {
    if (
      !w ||
      typeof w !== "object" ||
      !WIDGETS.some((x) => x.id === w.id) ||
      seen.has(w.id)
    )
      return [];
    seen.add(w.id);
    return [
      {
        id: w.id as WidgetId,
        size: w.size === "compact" ? ("compact" as const) : ("wide" as const),
      },
    ];
  });
}
export const SEVEN_DAYS = 7 * 86400000;
export type Visit = { id: string; at: number };
export function cleanVisits(raw: unknown, now = Date.now()): Visit[] {
  return Array.isArray(raw)
    ? raw.filter(
        (v) =>
          v &&
          typeof v.id === "string" &&
          Number.isFinite(v.at) &&
          v.at >= now - SEVEN_DAYS &&
          v.at <= now,
      )
    : [];
}
export function rankVisits(visits: Visit[], now = Date.now()) {
  const counts = new Map<string, { id: string; count: number; last: number }>();
  cleanVisits(visits, now).forEach((v) => {
    const prev = counts.get(v.id);
    counts.set(v.id, {
      id: v.id,
      count: (prev?.count ?? 0) + 1,
      last: Math.max(v.at, prev?.last ?? 0),
    });
  });
  return [...counts.values()].sort(
    (a, b) => b.count - a.count || b.last - a.last,
  );
}
export function readActivity(profile: string) {
  try {
    const visits = cleanVisits(
      JSON.parse(
        localStorage.getItem(`landing-page-builder:visits:${profile}`) || "[]",
      ),
    );
    const raw = JSON.parse(
      localStorage.getItem(`landing-page-builder:recent:${profile}`) || "[]",
    );
    return {
      visits,
      recent: Array.isArray(raw)
        ? raw.filter((v): v is string => typeof v === "string").slice(0, 20)
        : [],
    };
  } catch {
    return { visits: [], recent: [] };
  }
}
export function recordVisit(profile: string, id: string) {
  try {
    const old = readActivity(profile);
    localStorage.setItem(
      `landing-page-builder:visits:${profile}`,
      JSON.stringify([...old.visits, { id, at: Date.now() }]),
    );
    localStorage.setItem(
      `landing-page-builder:recent:${profile}`,
      JSON.stringify([id, ...old.recent.filter((x) => x !== id)].slice(0, 20)),
    );
    window.dispatchEvent(new Event("lpb-activity"));
  } catch {
    /* Browser storage is optional. */
  }
}
