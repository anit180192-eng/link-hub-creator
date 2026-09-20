export type Theme = "grid" | "list";

export type StartPageLink = {
  id: string;
  platform: string;
  label: string;
  url: string;
  group_name: string;
  position: number;
};

export type StartPageProfile = {
  slug: string;
  display_name: string;
  tagline: string;
  avatar_url: string | null;
  theme: string;
  dark_mode: boolean;
};

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

/** Builds a standalone HTML document for download / local homepage use. */
export function renderStartPageHtml(profile: StartPageProfile, links: StartPageLink[]) {
  const dark = profile.dark_mode;
  const bg = dark ? "#16181d" : "#f6f6f2";
  const fg = dark ? "#f3f4f1" : "#16181d";
  const card = dark ? "#212429" : "#ffffff";
  const border = dark ? "#2f333a" : "#e4e4dd";
  const muted = dark ? "#9aa0a6" : "#61656b";
  const accent = "#9ae600";
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
  .grid { display:grid; grid-template-columns: repeat(auto-fill, minmax(140px,1fr)); gap:12px; }
  .list { display:flex; flex-direction:column; gap:10px; max-width:520px; margin:0 auto; }
  a { text-decoration:none; color:inherit; background:${card}; border:1px solid ${border}; border-radius:14px; transition:.15s; }
  a:hover { border-color:${accent}; transform: translateY(-2px); }
  .tile { display:flex; flex-direction:column; gap:6px; padding:18px; }
  .row { display:flex; align-items:center; gap:14px; padding:14px 18px; }
  .row span span { display:block; }
  .t { font-weight:600; font-size:15px; }
  .s { font-size:12px; color:${muted}; }
  .mono { display:inline-flex; width:28px; height:28px; align-items:center; justify-content:center; border-radius:8px; background:${accent}; color:#16181d; font-weight:700; }
  footer { margin-top:56px; text-align:center; font-size:12px; color:${muted}; }
</style>
</head>
<body>
<main>
  <header>${avatar}<h1>${esc(profile.display_name || profile.slug)}</h1>${profile.tagline ? `<p class="tag">${esc(profile.tagline)}</p>` : ""}</header>
  ${sections}
  <footer>Built with Homepage Builder</footer>
</main>
</body>
</html>`;
}
