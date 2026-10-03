# Domain status: landingpage.aurunex.com

## Actual configuration (read from hosting, nothing changed)
- Project is published.
- landingpagebuilder.aurunex.com: active, PRIMARY, connected 12 days.
- landingpage.aurunex.com: active, connected 5 minutes ago, `redirects_to: landingpagebuilder.aurunex.com`.
- DNS/SSL: both report "next step: none". Note: the check reports configured redirect, not a live HTTP test.

## Problem
Because landingpagebuilder is primary, every request on landingpage.aurunex.com (including /<slug>) is redirected to the builder host. The short published-page address cannot stay in the browser.

## Next steps (owner action, Project Settings -> Domains)
1. Open the three-dot menu on landingpagebuilder.aurunex.com and choose "Unset as primary". Nothing redirects afterwards.
2. Confirm the code with the existing app logic is published: root `/` on landingpage.aurunex.com redirects to the builder (handled in `src/server.ts` via `publicHostRedirect`), and `/<slug>` is rewritten to `/p/$slug` (handled in `src/lib/public-page-url.ts`). Both are in the code now; if the live site predates them, click Publish -> Update.
3. Verify: `https://landingpage.aurunex.com/` -> 302 to builder; `https://landingpage.aurunex.com/<real-slug>` renders the page without redirecting; unknown slug shows not-found.

No code, domain, database or publish changes made.
