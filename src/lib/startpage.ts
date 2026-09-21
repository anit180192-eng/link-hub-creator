export type Theme = "grid" | "list";

export type StartPageLink = {
  id: string;
  platform: string;
  label: string;
  url: string;
  group_name: string;
  position: number;
  icon_only?: boolean;
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
  const bg = "#121313";
  const fg = "#F1EFEB";
  const card = "#24201E";
  const border = "#514943";
  const muted = "#AAA6A0";
  const accent = "#C98762";
  const safe = links.filter((l) => isSafeUrl(l.url));
  const name = profile.display_name || profile.slug;
  const tagline = profile.tagline.trim().toLowerCase() === "everything at once :)"
    ? "Personal links, projects, and creative work."
    : profile.tagline || "Personal links, projects, and creative work.";
  const initials = name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part.charAt(0).toUpperCase()).join("");

  const sections = groupLinks(safe)
    .map(([group, items], groupIndex) => {
      const heading = `<div class="grouphead"><h2 class="group">${esc(group || "Personal")}</h2><span>0${groupIndex + 1}</span></div>`;
      const body = items
        .map((link) => {
          const href = esc(normalizeUrl(link.url));
          const title = esc(linkTitle(link));
          const sub = esc(hostOf(link.url));
          const icon = faviconFor(link.url);
          const img = icon
            ? `<img src="${esc(icon)}" alt="" width="28" height="28" />`
            : `<span class="mono">${esc(title.charAt(0).toUpperCase())}</span>`;
          if (link.icon_only) {
            const bigImg = icon
              ? `<img src="${esc(icon)}" alt="${title}" width="40" height="40" />`
              : `<span class="mono big">${esc(title.charAt(0).toUpperCase())}</span>`;
            return `<a class="icononly" href="${href}" target="_blank" rel="noopener noreferrer" title="${title}" aria-label="${title}">${bigImg}</a>`;
          }
          return `<a class="link" href="${href}" target="_blank" rel="noopener noreferrer">${img}<span class="copy"><span class="t">${title}</span><span class="s">${sub}</span></span><span class="arrow" aria-hidden="true">↗</span></a>`;
        })
        .join("");
      return `<section>${heading}<div class="links">${body}</div></section>`;
    })
    .join("");

  const avatar = profile.avatar_url
    ? `<img class="avatar" src="${esc(profile.avatar_url)}" alt="" />`
    : `<div class="avatar monogram">${esc(initials)}</div>`;

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
<title>${esc(name)} — Personal hub</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600&family=Space+Grotesk:wght@500;600;700&display=swap" rel="stylesheet">
<style>
  * { box-sizing: border-box; }
  body { margin:0; background:${bg}; color:${fg}; font-family:"DM Sans",sans-serif; }
  main { max-width:1180px; margin:0 auto; padding:56px 48px; }
  .frame { display:grid; grid-template-columns:minmax(270px,.36fr) minmax(0,.64fr); border:1px solid ${border}; }
  header { min-height:640px; border-right:1px solid ${border}; padding:44px; display:flex; flex-direction:column; justify-content:space-between; }
  .brand { display:inline-flex; align-items:center; gap:6px; color:${muted}; font:600 11px "Space Grotesk",sans-serif; text-transform:uppercase; text-decoration:none; }
  .brandmark { width:20px; height:20px; display:inline-flex; align-items:center; justify-content:center; border:1px solid ${accent}; color:${accent}; font-size:9px; }
  .identity { margin-top:72px; }
  .avatar { width:112px; height:112px; object-fit:cover; border:1px solid ${border}; margin-bottom:32px; filter:grayscale(1); }
  .monogram { display:flex; align-items:center; justify-content:center; background:${card}; color:${accent}; font:600 30px "Space Grotesk",sans-serif; filter:none; }
  h1 { margin:0; font:600 68px/.95 "Space Grotesk",sans-serif; }
  p.tag { max-width:280px; margin:24px 0 0; color:${muted}; font-size:14px; line-height:1.65; }
  .index { display:flex; align-items:center; gap:12px; color:${muted}; font-size:10px; font-weight:600; text-transform:uppercase; }
  .index:before { content:""; width:8px; height:8px; background:${accent}; }
  .content { min-width:0; display:flex; flex-direction:column; }
  .clocks { display:grid; grid-template-columns:repeat(auto-fit,minmax(120px,1fr)); border-bottom:1px solid ${border}; }
  .clock { padding:16px 24px; border-right:1px solid ${border}; }
  .clock:last-child { border-right:0; }
  .clock .cl { display:block; color:${muted}; font-size:10px; font-weight:600; text-transform:uppercase; }
  .clock .ct { display:block; margin-top:4px; font:500 20px "Space Grotesk",sans-serif; font-variant-numeric:tabular-nums; }
  .clock .cd { display:block; color:${muted}; font-size:10px; }
  .sections { flex:1; padding:48px 40px; }
  section + section { margin-top:56px; }
  h2.group { margin:0; color:${muted}; font-size:11px; text-transform:uppercase; }
  .grouphead { display:flex; justify-content:space-between; align-items:end; margin-bottom:20px; padding-bottom:12px; border-bottom:1px solid ${border}; color:${muted}; font-size:10px; }
  .links { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:12px; }
  .link { height:92px; display:grid; grid-template-columns:32px minmax(0,1fr) 20px; align-items:center; gap:12px; padding:0 16px; }
  a.link,.icononly { color:inherit; text-decoration:none; background:${card}; border:1px solid ${border}; transition:transform .2s,border-color .2s,box-shadow .2s; }
  a.link:hover,.icononly:hover { border-color:${accent}; transform:translateY(-2px); box-shadow:0 0 18px rgba(201,135,98,.16); }
  .link img { width:28px; height:28px; }
  .copy,.copy span { min-width:0; display:block; }
  .t { font-weight:600; font-size:15px; }
  .s { font-size:12px; color:${muted}; }
  .arrow { color:${muted}; font-size:18px; }
  .icononly { display:flex; align-items:center; justify-content:center; height:92px; }
  .icononly img { width:40px; height:40px; }
  .mono { display:inline-flex; width:28px; height:28px; align-items:center; justify-content:center; background:${accent}; color:${bg}; font-weight:700; }
  .mono.big { width:40px; height:40px; font-size:18px; }
  footer { display:flex; justify-content:space-between; gap:12px; border-top:1px solid ${border}; padding:20px 24px; color:${muted}; font-size:10px; text-transform:uppercase; }
  footer a { color:inherit; text-decoration:none; }
  @media (max-width:760px) { main{padding:20px 16px}.frame{display:block}header{min-height:340px;border-right:0;border-bottom:1px solid ${border};padding:28px}.identity{margin-top:56px}h1{font-size:50px}.content{}.sections{padding:32px 20px}.links{grid-template-columns:1fr}.clocks{grid-template-columns:repeat(2,1fr)}footer{flex-direction:column}.avatar{width:96px;height:96px} }
  @media (prefers-reduced-motion:reduce) { *{transition:none!important} }
</style>
</head>
<body>
<main><div class="frame">
  <header><div><a class="brand" href="https://aurunex.com/" aria-label="AuruNex home"><span class="brandmark">A</span>AuruNex</a><div class="identity">${avatar}<h1>${esc(name)}</h1><p class="tag">${esc(tagline)}</p></div></div><span class="index">Personal index</span></header>
  <div class="content">${clockStrip}<div class="sections">${sections}</div><footer><span>${esc(name)} · Personal hub</span><a href="https://aurunex.com/">Built with Landing Page Builder by AuruNex</a></footer></div>
</div>
</main>
${clockScript}
</body>
</html>`;
}

