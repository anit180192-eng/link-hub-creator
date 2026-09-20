import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { StartPageView } from "@/components/StartPageView";
import { getPublicPage } from "@/lib/public-page.functions";

export const Route = createFileRoute("/p/$slug")({
  loader: async ({ params }) => {
    const page = await getPublicPage({ data: params.slug });
    if (!page) throw notFound();
    return page;
  },
  head: ({ loaderData, params }) => {
    if (!loaderData) {
      return {
        meta: [
          { title: "Page not found — AntLabs" },
          { name: "robots", content: "noindex" },
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
  const { profile, links } = Route.useLoaderData();
  return <StartPageView profile={profile} links={links} />;
}
