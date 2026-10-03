# Published page address

Published links now use `https://landingpage.aurunex.com/<existing-page-slug>`.
The builder, dashboard, authentication and billing remain on
`https://landingpagebuilder.aurunex.com`.

The router rewrites the short path internally to the existing `/p/$slug`
route only on the published-page host. This keeps server rendering, client
navigation, published-only database lookup, PIN validation, and comments on
the existing implementation. Slugs are unchanged (the editor normally makes
them lowercase). Downloaded HTML and published headers use
`Landing Page / <slug>`. The public host's root links back to the builder.

## Hosting setup required before release

1. In the existing Lovable project's Settings → Domains, connect
   `landingpage.aurunex.com` as an additional domain. Keep
   `landingpagebuilder.aurunex.com` connected.
2. Add the exact DNS records provided by Lovable for the new subdomain at
   the domain's DNS provider. Wait for verification and HTTPS to become Live.
   Do not replace the existing builder subdomain's DNS records.
3. Unset the project's primary domain so both connected domains serve the
   application independently. Otherwise Lovable redirects all requests to
   one primary host, preventing the new address from staying in the browser.
   This does not rename the builder or dashboard.
4. Publish the tested code only once the new domain is ready. The updated
   dashboard's copy/share/open actions generate the new domain immediately.
5. Check a real published slug at the new address, refresh it, switch tabs,
   and verify PIN unlock/trusted-device and comment flows. Verify unknown
   and unpublished slugs do not reveal content. Check the old builder's
   login, dashboard, billing links and published preview.

PIN/trusted-device cookies are host-scoped; visitors may need to unlock
again on the new subdomain. No database migration or slug changes are needed.
Existing `/p/<slug>` routes remain usable. No DNS changes or deployment were
performed as part of the local implementation.

Lovable domain and primary-host reference:
https://docs.lovable.dev/features/custom-domain#primary-domain

## Local validation

- TypeScript: `node ../node_modules/typescript/bin/tsc --noEmit`
- Routing: `node --experimental-strip-types --test tests/public-page-url.test.mjs`
- Production build: `node ../node_modules/vite/bin/vite.js build`

The relative dependency paths above use this checkout's existing parent
workspace dependencies. With dependencies installed in this checkout, use
`node_modules/` instead of `../node_modules/`.
