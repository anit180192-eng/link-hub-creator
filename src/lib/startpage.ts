import { parseSocialLinks, socialName } from "./social-links";
import { folderName } from "./folder-names";
import type { Json } from '@/integrations/supabase/types';
import { readPageTheme, themeColours } from "./page-themes";
export type Theme = "grid" | "list";

export type StartPageLink = {
  id: string;
  platform: string;
  label: string;
  url: string;
  group_name: string;
  position: number;
  icon_only?: boolean;
  favourite?: boolean;
  tab_id?: string | null;
  comment_text?: string;
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
  social_links?: import("@/integrations/supabase/types").Json;
  clocks?: StartPageClock[];
  home_widgets?: Json | null;
  notepad_enabled?: boolean;
  notepad_content?: string;
  landing_tab?: string;
  home_tab_color?: string | null;
  notepad_tab_color?: string | null;
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
    const key = folderName(link.group_name);
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
  const appearance = readPageTheme(profile.theme, profile.dark_mode);
  const isList = appearance.layout === "list";
  const declarations = (dark: boolean) => Object.entries(themeColours(appearance.preset, dark)).map(([key, value]) => `--page-${key}:${value}`).join(";");
  const paletteCss = `:root{${declarations(false)}}:root[data-mode="dark"]{${declarations(true)}}@media(prefers-color-scheme:dark){:root[data-mode="system"]{${declarations(true)}}}`;
  const bg = "var(--page-background)", fg = "var(--page-foreground)", card = "var(--page-surface)", border = "var(--page-border)", muted = "var(--page-muted)", accent = "var(--page-accent)";
  const glow = "color-mix(in srgb,var(--page-accent) 18%,transparent)";
  const safe = links.filter((l) => isSafeUrl(l.url));
  const name = profile.display_name || profile.slug;
  const tagline = profile.tagline.trim().toLowerCase() === "everything at once :)"
    ? "Personal links, projects, and creative work."
    : profile.tagline || "Personal links, projects, and creative work.";
  const initials = name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part.charAt(0).toUpperCase()).join("");

  const sections = groupLinks(safe)
    .map(([group, items], groupIndex) => {
      const heading = `<div class="grouphead"><span class="folder">▱</span><h2 class="group">${esc(group || "Personal")}</h2><span class="count">${String(items.length).padStart(2, "0")}</span></div>`;
      const body = items
        .filter((link) => !link.icon_only)
        .map((link) => {
          const href = esc(normalizeUrl(link.url));
          const title = esc(linkTitle(link));
          const sub = esc(hostOf(link.url));
          const icon = faviconFor(link.url);
          const img = icon
            ? `<img src="${esc(icon)}" alt="" width="28" height="28" />`
            : `<span class="mono">${esc(title.charAt(0).toUpperCase())}</span>`;
          return `<a class="link" href="${href}" target="_blank" rel="noopener noreferrer">${img}<span class="copy"><span class="t">${title}</span><span class="s">${sub}</span></span><span class="arrow" aria-hidden="true">↗</span></a>`;
        })
        .join("");
      const quickLinks = items
        .filter((link) => link.icon_only)
        .map((link) => {
          const href = esc(normalizeUrl(link.url));
          const title = esc(linkTitle(link));
          const icon = faviconFor(link.url);
          const img = icon
            ? `<img src="${esc(icon)}" alt="" width="32" height="32" />`
            : `<span class="mono quickmono">${esc(title.charAt(0).toUpperCase())}</span>`;
          return `<a class="quicklink" href="${href}" target="_blank" rel="noopener noreferrer" title="${title}" aria-label="${title}">${img}</a>`;
        })
        .join("");
      return `<section class="${groupIndex === 0 ? "featured" : ""}">${heading}${body ? `<div class="links">${body}</div>` : ""}${quickLinks ? `<div class="quicklinks">${quickLinks}</div>` : ""}</section>`;
    })
    .join("");

  const avatar = profile.avatar_url
    ? `<img class="avatar" src="${esc(profile.avatar_url)}" alt="" />`
    : `<div class="avatar monogram">${esc(initials)}</div>`;

  const clocks = parseClocks(profile.clocks);
  const clockStrip = clocks.length
    ? `<div class="clockcard"><div class="clockhead"><span>World time</span><span><i></i> Live</span></div><div class="clocks">${clocks
        .map((c) => {
          const parts = clockParts(c.tz);
          return `<div class="clock" data-tz="${esc(c.tz)}"><span class="cl">${esc(c.label)}</span><span class="ct">${esc(parts.time)}</span><span class="cd">${esc(parts.day)}</span></div>`;
        })
        .join("")}</div></div>`
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
<link rel="icon" type="image/svg+xml" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect width='32' height='32' rx='7' fill='%23E3C581'/%3E%3Cg fill='none' stroke='%2308151F' stroke-width='2.4' stroke-linecap='round' stroke-linejoin='round'%3E%3Crect x='7' y='7' width='18' height='18' rx='2.5'/%3E%3Cpath d='M7 13h18M13 25V13'/%3E%3C/g%3E%3C/svg%3E">

<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600&family=Space+Grotesk:wght@500;600;700&display=swap" rel="stylesheet">
<style>
  ${paletteCss}
  .mode-bar{display:flex;justify-content:flex-end;gap:6px;padding:12px 24px}.mode-bar button{cursor:pointer;border:1px solid ${border};border-radius:7px;padding:9px;background:${card};color:${fg}}.mode-bar button[aria-pressed="true"]{outline:2px solid ${accent}}
  * { box-sizing: border-box; }
  body { margin:0; background:${bg}; color:${fg}; font-family:"DM Sans",sans-serif; }
  main { max-width:1120px; margin:0 auto; padding:32px 24px; }
  .frame { display:grid; grid-template-columns:220px minmax(0,1fr); gap:16px; align-items:start; }
  header,.clockcard,section { background:${card}; border:1px solid ${border}; border-radius:8px; }
  header { padding:20px; }
  .brand { grid-column:1/-1; display:inline-flex; width:max-content; align-items:center; gap:8px; color:${muted}; font:600 11px "Space Grotesk",sans-serif; text-decoration:none; margin-bottom:16px; }
  .brandmark { width:20px; height:20px; display:inline-flex; }
  .identity { margin:0; }
  .avatar { width:56px; height:56px; object-fit:cover; border:1px solid ${border}; border-radius:6px; margin-bottom:20px; filter:grayscale(1); }
  .monogram { display:flex; align-items:center; justify-content:center; background:${bg}; color:${accent}; font:600 18px "Space Grotesk",sans-serif; filter:none; }
  h1 { margin:0; font:600 24px/1.2 "Space Grotesk",sans-serif; }
  p.tag { margin:8px 0 0; color:${muted}; font-size:12px; line-height:1.6; }
  .index { display:flex; align-items:center; gap:8px; margin-top:20px; padding-top:16px; border-top:1px solid ${border}; color:${muted}; font-size:10px; font-weight:600; text-transform:uppercase; }
  .index:before { content:""; width:6px; height:6px; border-radius:50%; background:${accent}; }
  .content { min-width:0; }
  .clockcard { margin-top:16px; padding:16px; }
  .clockhead { display:flex; justify-content:space-between; margin-bottom:10px; color:${muted}; font-size:10px; font-weight:600; text-transform:uppercase; }
  .clockhead i { display:inline-block; width:6px; height:6px; margin-right:5px; border-radius:50%; background:${accent}; }
  .clock { min-height:44px; display:flex; align-items:center; justify-content:space-between; gap:8px; padding:8px 0; border-top:1px solid ${border}; }
  .clock .cl { color:${fg}; font-size:12px; font-weight:500; }
  .clock .ct { margin-left:auto; font:600 16px "Space Grotesk",sans-serif; font-variant-numeric:tabular-nums; }
  .clock .cd { display:none; }
  .sections { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:16px; }
  section { padding:16px; }
  section.featured:nth-last-child(odd) { grid-column:1/-1; }
  section.featured:nth-last-child(odd) .links { grid-template-columns:repeat(2,minmax(0,1fr)); }
  h2.group { min-width:0; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; margin:0; font:600 14px "Space Grotesk",sans-serif; }
  .grouphead { display:grid; grid-template-columns:32px minmax(0,1fr) auto; align-items:center; gap:10px; margin-bottom:12px; }
  .folder { width:32px; height:32px; display:flex; align-items:center; justify-content:center; border-radius:6px; background:${bg}; color:${accent}; font-size:18px; }
  .count { color:${muted}; font-size:10px; }
  .links { display:grid; gap:8px; }
  .link { height:64px; display:grid; grid-template-columns:28px minmax(0,1fr) 18px; align-items:center; gap:12px; padding:0 12px; }
  a.link,.quicklink { color:inherit; text-decoration:none; background:${bg}; border:1px solid ${border}; border-radius:6px; transition:transform .2s,border-color .2s,box-shadow .2s; }
  a.link:hover,.quicklink:hover { border-color:${accent}; transform:translateY(-3px); box-shadow:0 0 16px ${glow}; }
  a.link:focus-visible,.quicklink:focus-visible { outline:2px solid ${accent}; outline-offset:2px; }
  a.link:active { transform:translateY(0); }
  .link img { width:28px; height:28px; }
  .copy,.copy span { min-width:0; display:block; }
  .t { font-weight:600; font-size:14px; }
  .s { font-size:11px; color:${muted}; }
  .arrow { color:${muted}; font-size:16px; transition:transform .2s,color .2s; }
  a.link:hover .arrow { color:${accent}; transform:translate(3px,-3px); }
  .quicklinks { display:flex; flex-wrap:wrap; gap:8px; margin-top:8px; }
  .links + .quicklinks { margin-top:8px; }
  .quicklink { width:56px; height:56px; flex:0 0 56px; display:flex; align-items:center; justify-content:center; }
  .quicklink:active { transform:scale(.95); }
  .quicklink img { width:32px; height:32px; transition:transform .2s; }
  .quicklink:hover img { transform:scale(1.1); }
  .mono { display:inline-flex; width:28px; height:28px; align-items:center; justify-content:center; background:${accent}; color:${bg}; font-weight:700; }
  .quickmono { width:32px; height:32px; }
  footer { grid-column:1/-1; display:flex; justify-content:space-between; gap:12px; border-top:1px solid ${border}; margin-top:16px; padding-top:16px; color:${muted}; font-size:10px; text-transform:uppercase; }
  footer a { color:inherit; text-decoration:none; }
  @media (max-width:760px) { main{padding:20px 16px}.frame{grid-template-columns:1fr}.side{display:grid;grid-template-columns:1fr 1fr;gap:12px}.clockcard{margin-top:0}.sections{grid-template-columns:1fr}section.featured:nth-last-child(odd){grid-column:auto}section.featured:nth-last-child(odd) .links{grid-template-columns:1fr}footer{flex-direction:column}.brand{margin-bottom:0}.avatar{width:48px;height:48px} }
  @media (max-width:520px) { .side{grid-template-columns:1fr}.clockcard{margin-top:0}.clocks{display:grid;grid-template-columns:1fr 1fr;gap:0 16px}.clock:nth-child(-n+2){border-top:0} }
  @media (prefers-reduced-motion:reduce) { *{transition:none!important} }
  /* Single-column (link-in-bio) layout */
  main.is-list { max-width:560px; padding:40px 16px; }
  .is-list .frame { grid-template-columns:1fr; gap:0; }
  .is-list .brand { margin-bottom:24px; }
  .is-list .side { display:block; }
  .is-list header { background:none; border:0; padding:0; text-align:center; }
  .is-list .avatar { width:80px; height:80px; border-radius:50%; margin:0 auto 16px; }
  .is-list .monogram { font-size:24px; }
  .is-list p.tag { font-size:14px; }
  .is-list .index { display:none; }
  .is-list .clockcard { margin-top:24px; }
  .is-list .clocks { display:grid; grid-template-columns:1fr 1fr; gap:0 16px; }
  .is-list .clock:nth-child(-n+2) { border-top:0; }
  .is-list .content { margin-top:24px; }
  .is-list .sections { grid-template-columns:1fr; gap:24px; }
  .is-list section { background:none; border:0; padding:0; }
  .is-list section.featured:nth-last-child(odd) { grid-column:auto; }
  .is-list section.featured:nth-last-child(odd) .links { grid-template-columns:1fr; }
  .is-list .grouphead { grid-template-columns:auto minmax(0,1fr) auto; gap:6px; margin-bottom:8px; padding:0 4px; }
  .is-list .folder { width:auto; height:auto; background:none; font-size:14px; }
  .is-list h2.group { font-size:12px; text-transform:uppercase; color:${muted}; }
  .is-list .link { height:56px; }
  .is-list .quicklinks { justify-content:center; }
  .is-list footer { margin-top:32px; }
</style>
</head>
<body>
<div class="mode-bar" role="group" aria-label="Colour mode">${(["light", "dark", "system"] as const).map(mode => `<button type="button" data-mode-choice="${mode}" aria-pressed="${mode === appearance.mode}">${mode.charAt(0).toUpperCase() + mode.slice(1)}</button>`).join("")}</div>
<script>(function(){var root=document.documentElement;root.dataset.mode=${JSON.stringify(appearance.mode)};document.querySelectorAll('[data-mode-choice]').forEach(function(b){b.addEventListener('click',function(){root.dataset.mode=b.dataset.modeChoice;document.querySelectorAll('[data-mode-choice]').forEach(function(x){x.setAttribute('aria-pressed',String(x===b))})})})})();</script>
<main${isList ? ' class="is-list"' : ""}><div class="frame">
  <a class="brand" href="https://landingpagebuilder.aurunex.com/" aria-label="Landing Page Builder home"><svg class="brandmark" viewBox="0 0 32 32" aria-hidden="true"><rect width="32" height="32" rx="7" fill="#E3C581"/><g fill="none" stroke="#08151F" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><rect x="7" y="7" width="18" height="18" rx="2.5"/><path d="M7 13h18M13 25V13"/></g></svg>Landing Page Builder</a>
  <div class="side"><header><div class="identity">${avatar}<h1>${esc(name)}</h1><p class="tag">${esc(tagline)}</p></div><div class="index">${parseSocialLinks(profile.social_links).map(link => `<a href="${esc(link.url)}" target="_blank" rel="noopener noreferrer" aria-label="${esc(link.label || socialName(link.platform))}" style="display:inline-block;margin:4px">${esc(socialName(link.platform))}</a>`).join("") || "Personal hub"}</div></header>${clockStrip}</div>
  <div class="content"><div class="sections">${sections}</div></div>
  <footer><span>${esc(name)} · Personal hub</span><a href="https://aurunex.com/">Built with Landing Page Builder by AuruNex</a></footer>
</div>
</main>
${clockScript}
</body>
</html>`;
}


/** Unique, safe, normalised URLs in their original order. */
export function eligibleUrls(urls: string[]) {
  return [...new Set(urls.filter(isSafeUrl).map(normalizeUrl))];
}

/**
 * Opens each URL synchronously (call directly from a click handler).
 * "noopener" is not passed as a window feature because it makes window.open
 * return null even on success. Instead a blank window is opened, its opener is
 * cut while still blank, then it is sent to the URL.
 */
export function openUrls(urls: string[]): { opened: string[]; failed: string[] } {
  const opened: string[] = [];
  const failed: string[] = [];
  for (const url of eligibleUrls(urls)) {
    let w: Window | null = null;
    try {
      // Open blank first and cut the opener before the destination can load.
      w = window.open("about:blank", "_blank");
      if (!w) throw new Error("blocked");
      w.opener = null;
      w.location.href = url;
      opened.push(url);
    } catch {
      try {
        w?.close();
      } catch {
        /* ignore */
      }
      failed.push(url);
    }
  }
  return { opened, failed };
}

export const linkCountLabel = (n: number) => `${n} ${n === 1 ? "link" : "links"}`;
