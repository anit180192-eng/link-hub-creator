import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { StartPageView } from "../src/components/StartPageView";

const profile = { slug: "demo", display_name: "Demo", tagline: "", avatar_url: null, theme: "grid", dark_mode: true, clocks: [] };
const links = [{ id: "1", platform: "website", label: "Example", url: "https://example.com", group_name: "Links", position: 0 }];

describe("archived links", () => {
  it("keeps the link visible without an opening URL", () => {
    const html = renderToStaticMarkup(<StartPageView profile={profile} links={links} archived />);
    expect(html).toContain("Example");
    expect(html).toContain("Archived on the Free plan");
    expect(html).not.toContain('href="https://example.com"');
  });
  it("keeps active links clickable", () => {
    const html = renderToStaticMarkup(<StartPageView profile={profile} links={links} />);
    expect(html).toContain('href="https://example.com"');
  });
});
