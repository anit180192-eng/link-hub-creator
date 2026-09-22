import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { StartPageView } from "@/components/StartPageView";
import { PinGate } from "@/components/PinGate";
import { getPublicPage } from "@/lib/public-page.functions";

export const Route = createFileRoute("/p/$slug")({
  staticData: { sitemap: false },
  loader: async ({ params }) => {
    const page = await getPublicPage({ data: params.slug });
    if (!page) throw notFound();
    return page;
  },
  head: ({ loaderData, params }) => {
    if (!loaderData) {
      return {
        meta: [
          { title: "Page not found — Landing Page Builder" },
          { name: "robots", content: "noindex" },
        ],
      };
    }
    if (loaderData.protected) {
      return {
        meta: [
          { title: "Private page — Landing Page Builder" },
          { name: "description", content: "Enter the PIN to view this private page." },
          { name: "robots", content: "noindex" },
          { property: "og:title", content: "Private page — Landing Page Builder" },
          { property: "og:description", content: "A private start page protected with a PIN." },
          { property: "og:type", content: "website" },
          { name: "twitter:card", content: "summary" },
        ],
      };
    }
    const name = loaderData.profile.display_name || params.slug;
    const description =
      loaderData.profile.tagline || `All of ${name}'s links and accounts in one start page.`;
    return {
      meta: [
        { title: `${name} — Start page` },
        { name: "description", content: description },
        { property: "og:title", content: `${name} — Start page` },
        { property: "og:description", content: description },
        { property: "og:type", content: "profile" },
        { name: "twitter:card", content: "summary" },
      ],
    };
  },
  notFoundComponent: () => (
    <div className="flex min-h-screen flex-col items-center justify-center gap-3 px-4 text-center">
      <h1 className="font-display text-2xl">This start page doesn't exist</h1>
      <p className="text-sm text-muted-foreground">
        It may have been unpublished or the address changed.
      </p>
      <Link to="/" className="text-sm text-primary underline">
        Make your own
      </Link>
    </div>
  ),
  errorComponent: () => (
    <div className="flex min-h-screen items-center justify-center px-4 text-center">
      <p className="text-sm text-muted-foreground">This page couldn't be loaded right now.</p>
    </div>
  ),
  component: PublicStartPage,
});

function PublicStartPage() {
  const page = Route.useLoaderData();
  const { slug } = Route.useParams();
  if (page.locked) return <PinGate slug={slug} />;
  return <StartPageView profile={page.profile} links={page.links} />;
}
