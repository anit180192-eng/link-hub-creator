// Parses the standard bookmarks HTML file every browser can export (also produced by our extension).
// Top-level bookmark folders become tabs; nested folders become slash-named folders inside that tab;
// links directly inside a top folder go to "Ungrouped"; loose top-level links go to "Ungrouped" in the first tab.
export type BookmarkLink = { label: string; url: string };
export type BookmarkTab = { name: string; folders: Map<string, BookmarkLink[]> };
export type ParsedBookmarks = { tabs: BookmarkTab[] };

export const UNGROUPED = "Ungrouped";

export function parseBookmarksHtml(html: string): ParsedBookmarks {
  const doc = new DOMParser().parseFromString(html, "text/html");
  const tabs: BookmarkTab[] = [];
  const loose: BookmarkLink[] = [];
  const toLink = (a: Element): BookmarkLink | null => {
    const url = a.getAttribute("href") ?? "";
    if (!/^https?:\/\//i.test(url)) return null;
    return { label: (a.textContent?.trim() || url).slice(0, 60), url: url.slice(0, 500) };
  };
  const childDl = (dt: Element) =>
    dt.querySelector(":scope > dl") ?? (dt.nextElementSibling?.tagName === "DL" ? dt.nextElementSibling : null);

  // Walk inside one tab; path is relative to the top folder.
  const walkTab = (dl: Element, tab: BookmarkTab, path: string[]) => {
    for (const dt of Array.from(dl.children)) {
      if (dt.tagName !== "DT") continue;
      const h3 = dt.querySelector(":scope > h3");
      const a = dt.querySelector(":scope > a");
      if (h3) {
        const child = childDl(dt);
        if (child) walkTab(child, tab, [...path, h3.textContent?.trim() || "Folder"]);
      } else if (a) {
        const link = toLink(a);
        if (!link) continue;
        const key = (path.join(" / ") || UNGROUPED).slice(0, 40);
        if (!tab.folders.has(key)) tab.folders.set(key, []);
        tab.folders.get(key)!.push(link);
      }
    }
  };

  const walkRoot = (dl: Element) => {
    for (const dt of Array.from(dl.children)) {
      if (dt.tagName !== "DT") continue;
      const h3 = dt.querySelector(":scope > h3");
      const a = dt.querySelector(":scope > a");
      if (h3) {
        const name = h3.textContent?.trim() || "Folder";
        const child = childDl(dt);
        if (!child) continue;
        const bar = /toolbar|bookmarks bar|favorites bar/i.test(name) || h3.hasAttribute("personal_toolbar_folder");
        if (bar) { walkRoot(child); continue; }
        const tab: BookmarkTab = { name: name.slice(0, 30), folders: new Map() };
        walkTab(child, tab, []);
        if (tab.folders.size) tabs.push(tab);
      } else if (a) {
        const link = toLink(a);
        if (link) loose.push(link);
      }
    }
  };

  const root = doc.querySelector("dl");
  if (root) walkRoot(root);
  if (loose.length) {
    if (!tabs.length) tabs.push({ name: "Bookmarks", folders: new Map() });
    const first = tabs[0]!.folders;
    first.set(UNGROUPED, [...(first.get(UNGROUPED) ?? []), ...loose]);
  }
  return { tabs };
}
