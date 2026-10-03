import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createRootRoute, createRoute, createRouter, createMemoryHistory } from '@tanstack/react-router';
import { BUILDER_ORIGIN, PUBLIC_PAGE_ORIGIN, publicPageUrl, publicPageRewrite, publicHostRedirect } from '../src/lib/public-page-url.ts';

test('share URLs use the public host and safely encode the page identifier', () => {
  assert.equal(publicPageUrl('N18'), 'https://landingpage.aurunex.com/N18');
  assert.equal(publicPageUrl('a/b?x'), 'https://landingpage.aurunex.com/a%2Fb%3Fx');
});

test('short URLs round trip without losing query strings or fragments', () => {
  for (const slug of ['N18', 'anit18', 'my-page', 'dashboard', 'auth']) {
    const external = new URL(`${PUBLIC_PAGE_ORIGIN}/${slug}?tab=notes#links`);
    const internal = publicPageRewrite.input({ url: external });
    assert.equal(internal.pathname, `/p/${slug}`);
    assert.equal(publicPageRewrite.output({ url: internal }).href, external.href);
    assert.equal(external.pathname, `/${slug}`);
  }
});

test('builder, preview, assets, and server functions keep their routes', () => {
  for (const origin of [BUILDER_ORIGIN, 'http://localhost:3000', 'https://preview.lovable.app']) {
    for (const path of ['/dashboard', '/auth', '/p/N18']) {
      const url = new URL(path, origin);
      assert.equal(publicPageRewrite.input({ url }).href, url.href);
      assert.equal(publicPageRewrite.output({ url }).href, url.href);
    }
  }
  for (const path of ['/favicon.svg', '/assets/app.js', '/_serverFn/unlock', '/p/N18']) {
    const url = new URL(path, PUBLIC_PAGE_ORIGIN);
    assert.equal(publicPageRewrite.input({ url }).href, url.href);
  }
  assert.equal(publicHostRedirect(new URL(`${PUBLIC_PAGE_ORIGIN}/?ref=home`)), `${BUILDER_ORIGIN}/?ref=home`);
  assert.equal(publicHostRedirect(new URL(`${BUILDER_ORIGIN}/dashboard`)), null);
  assert.equal(publicHostRedirect(new URL(`${PUBLIC_PAGE_ORIGIN}/N18`)), null);
});

test('the real router loads short public URLs through the existing published-page route', async () => {
  for (const [origin, pathname, expected] of [
    [PUBLIC_PAGE_ORIGIN, '/N18?tab=notes', '/p/$slug'],
    [PUBLIC_PAGE_ORIGIN, '/dashboard', '/p/$slug'],
    [BUILDER_ORIGIN, '/dashboard', '/dashboard'],
    [BUILDER_ORIGIN, '/p/N18', '/p/$slug'],
  ]) {
    const root = createRootRoute();
    const page = createRoute({ getParentRoute: () => root, path: '/p/$slug', loader: ({ params }) => params.slug });
    const dashboard = createRoute({ getParentRoute: () => root, path: '/dashboard' });
    const router = createRouter({ routeTree: root.addChildren([page, dashboard]), origin, history: createMemoryHistory({ initialEntries: [pathname] }), rewrite: publicPageRewrite });
    await router.load();
    assert.equal(router.state.matches.at(-1).routeId, expected);
    if (expected === '/p/$slug') {
      assert.equal(router.state.matches.at(-1).loaderData, pathname === '/dashboard' ? 'dashboard' : 'N18');
    }
    if (origin === PUBLIC_PAGE_ORIGIN) {
      const built = router.buildLocation({ to: '/p/$slug', params: { slug: 'N18' } });
      assert.equal(new URL(built.publicHref, origin).pathname, '/N18');
    }
  }
});
