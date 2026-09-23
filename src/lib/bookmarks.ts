// Parses the standard bookmarks HTML file every browser can export.
export type ParsedBookmarks = { folders: Map<string, { label: string; url: string }[]> };

export function parseBookmarksHtml(html: string): ParsedBookmarks {
  const doc = new DOMParser().parseFromString(html, "text/html");
  const folders = new Map<string, { label: string; url: string }[]>();
  const add = (folder: string, label: string, url: string) => {
    if (!/^https?:\/\//i.test(url)) return;
    const key = folder || "Ungrouped";
    if (!folders.has(key)) folders.set(key, []);
    folders.get(key)!.push({ label: (label || url).slice(0, 60), url: url.slice(0, 500) });
  };
  const walk = (dl: Element, path: string[]) => {
    for (const dt of Array.from(dl.children)) {
      if (dt.tagName !== "DT") continue;
      const h3 = dt.querySelector(":scope > h3");
      const a = dt.querySelector(":scope > a");
      if (h3) {
        const name = h3.textContent?.trim() || "Folder";
        const bar = /toolbar|bookmarks bar|favorites bar/i.test(name) || h3.hasAttribute("personal_toolbar_folder");
        const next = bar && path.length === 0 ? path : [...path, name];
        const child = dt.querySelector(":scope > dl") ?? (dt.nextElementSibling?.tagName === "DL" ? dt.nextElementSibling : null);
        if (child) walk(child, next);
      } else if (a) {
        add(path.join(" / ").slice(0, 40), a.textContent?.trim() ?? "", a.getAttribute("href") ?? "");
      }
    }
  };
  const root = doc.querySelector("dl");
  if (root) walk(root, []);
  return { folders };
}
