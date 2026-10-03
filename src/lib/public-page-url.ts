export const BUILDER_ORIGIN = "https://landingpagebuilder.aurunex.com";
export const PUBLIC_PAGE_ORIGIN = "https://landingpage.aurunex.com";
const PUBLIC_PAGE_HOST = new URL(PUBLIC_PAGE_ORIGIN).hostname;

export function publicPageUrl(slug: string): string {
  return `${PUBLIC_PAGE_ORIGIN}/${encodeURIComponent(slug)}`;
}

// Reuse the existing loader and PIN flow on both server and client, while
// keeping the short URL in the browser. Other hosts retain their own routes.
export const publicPageRewrite = {
  input: ({ url }: { url: URL }): URL => {
    const result = new URL(url);
    if (result.hostname === PUBLIC_PAGE_HOST && /^\/[a-z0-9_-]+\/?$/i.test(result.pathname)) {
      result.pathname = `/p${result.pathname.replace(/\/$/, "")}`;
    }
    return result;
  },
  output: ({ url }: { url: URL }): URL => {
    const result = new URL(url);
    if (result.hostname === PUBLIC_PAGE_HOST && /^\/p\/[a-z0-9_-]+\/?$/i.test(result.pathname)) {
      result.pathname = result.pathname.slice(2);
    }
    return result;
  },
};

export function publicHostRedirect(url: URL): string | null {
  if (url.hostname !== PUBLIC_PAGE_HOST) return null;
  if (url.pathname === "/") return `${BUILDER_ORIGIN}/${url.search}`;
  return null;
}
