import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowRight, Download, Globe, LayoutGrid, List, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "AntLabs — build your own browser start page" },
      {
        name: "description",
        content:
          "Add every Instagram, YouTube, LinkedIn and website you use, pick a theme, and get a personal start page you can set as your browser homepage.",
      },
      { property: "og:title", content: "AntLabs — build your own browser start page" },
      {
        property: "og:description",
        content:
          "Add every account and site you use, pick a theme, and get a personal start page for your browser.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Landing,
});

function Landing() {
  const [signedIn, setSignedIn] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSignedIn(Boolean(data.session)));
    const { data } = supabase.auth.onAuthStateChange((_e, session) =>
      setSignedIn(Boolean(session)),
    );
    return () => data.subscription.unsubscribe();
  }, []);

  return (
    <div className="min-h-screen">
      <header className="mx-auto flex max-w-5xl items-center justify-between px-5 py-6">
        <span className="font-display text-lg font-bold tracking-tight">
          Ant<span className="text-primary">Labs</span>
        </span>
        <nav className="flex items-center gap-3 text-sm">
          <Link to="/setup" className="text-muted-foreground hover:text-foreground">
            Setup guide
          </Link>
          {signedIn ? (
            <Button asChild size="sm">
              <Link to="/dashboard">Dashboard</Link>
            </Button>
          ) : (
            <Button asChild size="sm">
              <Link to="/auth">Sign in</Link>
            </Button>
          )}
        </nav>
      </header>

      <main className="mx-auto max-w-5xl px-5">
        <section className="py-20">
          <p className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs text-muted-foreground">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            One page for everything you open all day
          </p>
          <h1 className="mt-6 max-w-3xl font-display text-5xl leading-[1.05] tracking-tight sm:text-6xl">
            Every account you own,
            <br />
            <span className="text-primary">one start page.</span>
          </h1>
          <p className="mt-5 max-w-xl text-base text-muted-foreground">
            Add all your Instagram profiles, YouTube channels, LinkedIn, X, and any site you keep
            typing out. AntLabs turns them into a clean page you can open as your browser homepage
            — or download as a single file.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild size="lg">
              <Link to={signedIn ? "/dashboard" : "/auth"}>
                {signedIn ? "Open dashboard" : "Start building"}
                <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link to="/setup">How to set it as homepage</Link>
            </Button>
          </div>
        </section>

        <section className="grid gap-4 pb-20 sm:grid-cols-3">
          {[
            {
              icon: LayoutGrid,
              title: "Icon grid",
              body: "A dense dashboard of tiles with each site's own icon. Made for speed.",
            },
            {
              icon: List,
              title: "Link list",
              body: "A tall stack of buttons under your name and photo. Made for sharing.",
            },
            {
              icon: Download,
              title: "Hosted or offline",
              body: "Get a public link at antlabs /p/your-name, plus a downloadable HTML file.",
            },
          ].map((item) => (
            <div key={item.title} className="rounded-xl border border-border bg-card p-6">
              <item.icon className="h-5 w-5 text-primary" />
              <h2 className="mt-4 font-display text-lg">{item.title}</h2>
              <p className="mt-1.5 text-sm text-muted-foreground">{item.body}</p>
            </div>
          ))}
        </section>

        <section className="rounded-2xl border border-border bg-card p-8 sm:p-12">
          <h2 className="font-display text-2xl tracking-tight">How it works</h2>
          <ol className="mt-6 grid gap-6 sm:grid-cols-3">
            {[
              ["Sign up", "Email and password, or one tap with Google."],
              ["Add your links", "Pick a platform, paste the link, label it. Group them if you like."],
              ["Publish", "Pick a theme, hit publish, then set the link as your homepage."],
            ].map(([title, body], i) => (
              <li key={title}>
                <span className="font-display text-sm text-primary">0{i + 1}</span>
                <h3 className="mt-1 font-display text-lg">{title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{body}</p>
              </li>
            ))}
          </ol>
        </section>

        <footer className="flex items-center gap-2 py-12 text-sm text-muted-foreground">
          <Globe className="h-4 w-4" />
          AntLabs — your links, your page.
        </footer>
      </main>
    </div>
  );
}
