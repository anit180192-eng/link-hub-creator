export type Theme = "grid" | "list";

export type StartPageLink = {
  id: string;
  platform: string;
  label: string;
  url: string;
  group_name: string;
  position: number;
};

export type StartPageClock = {
  label: string;
  tz: string;
};

export type StartPageProfile = {
  slug: string;
  display_name: string;
  tagline: string;
  avatar_url: string | null;
  theme: string;
  dark_mode: boolean;
  clocks?: StartPageClock[];
};

export const MAX_CLOCKS = 5;

/** Curated, widely useful IANA time zones for the clock picker. */
export const TIMEZONES = [
  { tz: "Asia/Kolkata", label: "India" },
  { tz: "Europe/London", label: "United Kingdom" },
  { tz: "Australia/Sydney", label: "Australia (Sydney)" },
  { tz: "Australia/Perth", label: "Australia (Perth)" },
  { tz: "America/New_York", label: "USA (New York)" },
  { tz: "America/Chicago", label: "USA (Chicago)" },
  { tz: "America/Denver", label: "USA (Denver)" },
  { tz: "America/Los_Angeles", label: "USA (Los Angeles)" },
  { tz: "America/Toronto", label: "Canada (Toronto)" },
  { tz: "America/Sao_Paulo", label: "Brazil (São Paulo)" },
  { tz: "Europe/Dublin", label: "Ireland" },
  { tz: "Europe/Paris", label: "France" },
  { tz: "Europe/Berlin", label: "Germany" },
  { tz: "Europe/Madrid", label: "Spain" },
  { tz: "Europe/Amsterdam", label: "Netherlands" },
  { tz: "Europe/Zurich", label: "Switzerland" },
  { tz: "Europe/Lisbon", label: "Portugal" },
  { tz: "Europe/Moscow", label: "Russia (Moscow)" },
  { tz: "Africa/Johannesburg", label: "South Africa" },
  { tz: "Africa/Lagos", label: "Nigeria" },
  { tz: "Africa/Nairobi", label: "Kenya" },
  { tz: "Africa/Cairo", label: "Egypt" },
  { tz: "Asia/Dubai", label: "UAE (Dubai)" },
  { tz: "Asia/Riyadh", label: "Saudi Arabia" },
  { tz: "Asia/Karachi", label: "Pakistan" },
  { tz: "Asia/Dhaka", label: "Bangladesh" },
  { tz: "Asia/Colombo", label: "Sri Lanka" },
  { tz: "Asia/Kathmandu", label: "Nepal" },
  { tz: "Asia/Bangkok", label: "Thailand" },
  { tz: "Asia/Jakarta", label: "Indonesia" },
  { tz: "Asia/Singapore", label: "Singapore" },
  { tz: "Asia/Hong_Kong", label: "Hong Kong" },
  { tz: "Asia/Shanghai", label: "China" },
  { tz: "Asia/Tokyo", label: "Japan" },
  { tz: "Asia/Seoul", label: "South Korea" },
  { tz: "Pacific/Auckland", label: "New Zealand" },
  { tz: "UTC", label: "UTC" },
] as const;

export function timezoneLabel(tz: string) {
  return TIMEZONES.find((t) => t.tz === tz)?.label ?? tz.split("/").pop()?.replace(/_/g, " ") ?? tz;
}

/** Safely reads the clocks value stored on a profile row. */
export function parseClocks(raw: unknown): StartPageClock[] {
  if (!Array.isArray(raw)) return [];
  const out: StartPageClock[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const tz = String((item as { tz?: unknown }).tz ?? "");
    if (!tz) continue;
    const label = String((item as { label?: unknown }).label ?? "").slice(0, 24);
    out.push({ tz, label: label || timezoneLabel(tz) });
    if (out.length >= MAX_CLOCKS) break;
  }
  return out;
}

export function clockParts(tz: string, at: Date = new Date()) {
  try {
    const time = new Intl.DateTimeFormat("en-GB", {
      timeZone: tz,
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).format(at);
    const day = new Intl.DateTimeFormat("en-GB", {
      timeZone: tz,
      weekday: "short",
      day: "numeric",
      month: "short",
    }).format(at);
    return { time, day };
  } catch {
    return { time: "--:--", day: "" };
  }
}


export const PLATFORMS = [
  { id: "instagram", label: "Instagram", color: "#e1306c", base: "https://instagram.com/" },
  { id: "youtube", label: "YouTube", color: "#ff0000", base: "https://youtube.com/@" },
  { id: "x", label: "X / Twitter", color: "#ffffff", base: "https://x.com/" },
  { id: "facebook", label: "Facebook", color: "#1877f2", base: "https://facebook.com/" },
  { id: "linkedin", label: "LinkedIn", color: "#0a66c2", base: "https://linkedin.com/in/" },
  { id: "github", label: "GitHub", color: "#ffffff", base: "https://github.com/" },
  { id: "tiktok", label: "TikTok", color: "#25f4ee", base: "https://tiktok.com/@" },
  { id: "website", label: "Website", color: "#9ae600", base: "https://" },
] as const;

export function platformLabel(id: string) {
  return PLATFORMS.find((p) => p.id === id)?.label ?? "Website";
}

export function platformColor(id: string) {
  return PLATFORMS.find((p) => p.id === id)?.color ?? "#9ae600";
}

export function normalizeUrl(raw: string) {
  const trimmed = raw.trim();
  if (!trimmed) return "";
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

export function hostOf(url: string) {
  try {
    return new URL(normalizeUrl(url)).hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
}

export function faviconFor(url: string) {
  const host = hostOf(url);
  if (!host) return "";
  return `https://www.google.com/s2/favicons?domain=${encodeURIComponent(host)}&sz=64`;
}

export function isSafeUrl(url: string) {
  try {
    const parsed = new URL(normalizeUrl(url));
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

export function slugify(raw: string) {
  return raw
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
}

export function linkTitle(link: StartPageLink) {
  return link.label.trim() || hostOf(link.url) || platformLabel(link.platform);
}

export function groupLinks(links: StartPageLink[]) {
  const groups = new Map<string, StartPageLink[]>();
  for (const link of [...links].sort((a, b) => a.position - b.position)) {
    const key = link.group_name.trim();
    const bucket = groups.get(key);
    if (bucket) bucket.push(link);
    else groups.set(key, [link]);
  }
  return [...groups.entries()];
}

function esc(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** Builds a standalone HTML document for download / local landing page use. */
export function renderStartPageHtml(profile: StartPageProfile, links: StartPageLink[]) {
  const dark = profile.dark_mode;
  const bg = dark ? "#08151F" : "#f6f6f2";
  const fg = dark ? "#F4F5F2" : "#16181d";
  const card = dark ? "#122633" : "#ffffff";
  const border = dark ? "#355361" : "#e4e4dd";
  const muted = dark ? "#B3C1CA" : "#61656b";
  const accent = dark ? "#E3C581" : "#69C9C0";
  const isGrid = profile.theme === "grid";
  const safe = links.filter((l) => isSafeUrl(l.url));

  const sections = groupLinks(safe)
    .map(([group, items]) => {
      const heading = group
        ? `<h2 class="group">${esc(group)}</h2>`
        : safe.length && groupLinks(safe).length > 1
          ? `<h2 class="group">Links</h2>`
          : "";
      const body = items
        .map((link) => {
          const href = esc(normalizeUrl(link.url));
          const title = esc(linkTitle(link));
          const sub = esc(hostOf(link.url));
          const icon = faviconFor(link.url);
          const img = icon
            ? `<img src="${esc(icon)}" alt="" width="28" height="28" />`
            : `<span class="mono">${esc(title.charAt(0).toUpperCase())}</span>`;
          return isGrid
            ? `<a class="tile" href="${href}" target="_blank" rel="noopener noreferrer">${img}<span class="t">${title}</span><span class="s">${sub}</span></a>`
            : `<a class="row" href="${href}" target="_blank" rel="noopener noreferrer">${img}<span><span class="t">${title}</span><span class="s">${sub}</span></span></a>`;
        })
        .join("");
      return `<section>${heading}<div class="${isGrid ? "grid" : "list"}">${body}</div></section>`;
    })
    .join("");

  const avatar = profile.avatar_url
    ? `<img class="avatar" src="${esc(profile.avatar_url)}" alt="" />`
    : "";

  const clocks = parseClocks(profile.clocks);
  const clockStrip = clocks.length
    ? `<div class="clocks">${clocks
        .map((c) => {
          const parts = clockParts(c.tz);
          return `<div class="clock" data-tz="${esc(c.tz)}"><span class="cl">${esc(c.label)}</span><span class="ct">${esc(parts.time)}</span><span class="cd">${esc(parts.day)}</span></div>`;
        })
        .join("")}</div>`
    : "";

  const clockScript = clocks.length
    ? `<script>
(function(){
  function tick(){
    document.querySelectorAll('.clock').forEach(function(el){
      var tz = el.getAttribute('data-tz');
      try {
        el.querySelector('.ct').textContent = new Intl.DateTimeFormat('en-GB',{timeZone:tz,hour:'2-digit',minute:'2-digit',hour12:false}).format(new Date());
        el.querySelector('.cd').textContent = new Intl.DateTimeFormat('en-GB',{timeZone:tz,weekday:'short',day:'numeric',month:'short'}).format(new Date());
      } catch (e) {}
    });
  }
  tick();
  setInterval(tick, 15000);
})();
</script>`
    : "";

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${esc(profile.display_name || profile.slug)} — Start page</title>
<style>
  * { box-sizing: border-box; }
  body { margin:0; background:${bg}; color:${fg}; font-family: "DM Sans", ui-sans-serif, system-ui, -apple-system, sans-serif; }
  main { max-width: 880px; margin: 0 auto; padding: 64px 20px 80px; }
  header { text-align:${isGrid ? "left" : "center"}; margin-bottom: 40px; }
  .avatar { width:76px; height:76px; border-radius:999px; object-fit:cover; border:2px solid ${accent}; margin-bottom:14px; }
  h1 { font-size: 30px; margin:0 0 6px; letter-spacing:-0.02em; }
  p.tag { margin:0; color:${muted}; font-size:15px; }
  h2.group { font-size:12px; letter-spacing:.14em; text-transform:uppercase; color:${muted}; margin:32px 0 12px; }
  .clocks { display:flex; flex-wrap:wrap; gap:10px; justify-content:center; margin-bottom:32px; }
  .clock { background:${card}; border:1px solid ${border}; border-radius:14px; padding:10px 16px; min-width:120px; text-align:center; }
  .clock .cl { display:block; font-size:11px; letter-spacing:.12em; text-transform:uppercase; color:${muted}; }
  .clock .ct { display:block; font-size:22px; font-weight:600; font-variant-numeric:tabular-nums; margin-top:2px; }
  .clock .cd { display:block; font-size:11px; color:${muted}; }
  .grid { display:grid; grid-template-columns: repeat(auto-fill, minmax(140px,1fr)); gap:12px; }
  .list { display:flex; flex-direction:column; gap:10px; max-width:520px; margin:0 auto; }
  a { text-decoration:none; color:inherit; background:${card}; border:1px solid ${border}; border-radius:14px; transition:.15s; }
  a:hover { border-color:${accent}; transform: translateY(-2px); }
  .tile { display:flex; flex-direction:column; gap:6px; padding:18px; }
  .row { display:flex; align-items:center; gap:14px; padding:14px 18px; }
  .row span span { display:block; }
  .t { font-weight:600; font-size:15px; }
  .s { font-size:12px; color:${muted}; }
  .mono { display:inline-flex; width:28px; height:28px; align-items:center; justify-content:center; border-radius:8px; background:${accent}; color:#08151F; font-weight:700; }
  footer { margin-top:56px; text-align:center; font-size:12px; color:${muted}; }
</style>
</head>
<body>
<main>
  ${clockStrip}
  <header>${avatar}<h1>${esc(profile.display_name || profile.slug)}</h1>${profile.tagline ? `<p class="tag">${esc(profile.tagline)}</p>` : ""}</header>
  ${sections}
  <footer>Built with Landing Page Builder by AuruNex</footer>
</main>
${clockScript}
</body>
</html>`;
}

