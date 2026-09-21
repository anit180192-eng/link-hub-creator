import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  ArrowRight,
  ExternalLink,
  Facebook,
  Github,
  Globe2,
  Instagram,
  Linkedin,
  Play,
  Youtube,
} from "lucide-react";
import { AuthPanel } from "@/components/AuthPanel";
import { Brand } from "@/components/Brand";
import { LandingPageSetupGuide } from "@/components/LandingPageSetupGuide";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Landing Page Builder — all your important links in one place" },
      { name: "description", content: "Create one personal browser landing page for your social profiles, channels, work tools, and favorite websites." },
      { property: "og:title", content: "Landing Page Builder — all your important links in one place" },
      { property: "og:description", content: "Build a personal start page and make it the first thing you see in your browser." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Landing,
});

const services = [
  { label: "Instagram", icon: Instagram },
  { label: "YouTube", icon: Youtube },
  { label: "LinkedIn", icon: Linkedin },
  { label: "Facebook", icon: Facebook },
  { label: "GitHub", icon: Github },
  { label: "Any website", icon: Globe2 },
];

function Landing() {
  const [signedIn, setSignedIn] = useState(false);
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSignedIn(Boolean(data.session)));
    const { data } = supabase.auth.onAuthStateChange((_event, session) => setSignedIn(Boolean(session)));
    return () => data.subscription.unsubscribe();
  }, []);

  return (
    <div className="min-h-screen overflow-hidden">
      <header className="mx-auto flex max-w-7xl items-center justify-between px-5 py-5 lg:px-8">
        <Brand className="text-base sm:text-lg" />
        <div className="flex items-center gap-2">
          <Button asChild variant="ghost" size="sm"><Link to="/setup">Setup guide</Link></Button>
          {signedIn ? <Button asChild size="sm"><Link to="/dashboard">Open my page</Link></Button> : null}
        </div>
      </header>

      <main>
        <section className="border-y border-border">
          <div className="mx-auto grid max-w-7xl md:min-h-[650px] md:grid-cols-[1.1fr_0.9fr] lg:grid-cols-[1.25fr_0.75fr]">
            <div className="flex flex-col justify-center px-5 py-14 lg:px-8 lg:py-20">
              <p className="flex items-center gap-2 text-xs font-semibold uppercase text-primary">
                <span className="h-2 w-2 rounded-full bg-primary" /> Your browser, organized
              </p>
              <h1 className="mt-5 max-w-3xl font-display text-5xl leading-[1.02] sm:text-6xl lg:text-7xl">
                Every important link.<br /><span className="text-primary">One browser landing page.</span>
              </h1>
              <p className="mt-6 max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg">
                Bring your social profiles, channels, work tools, news, and favorite websites together. Open one clean page whenever your browser starts.
              </p>
              <div className="mt-7 flex flex-wrap gap-2">
                {services.map((service) => (
                  <span key={service.label} className="inline-flex items-center gap-2 border border-border bg-card px-3 py-2 text-xs text-card-foreground">
                    <service.icon className="h-4 w-4 text-primary" /> {service.label}
                  </span>
                ))}
              </div>
              <div className="mt-8 flex flex-wrap gap-3">
                {signedIn ? (
                  <Button asChild size="lg"><Link to="/dashboard">Open my landing page <ArrowRight /></Link></Button>
                ) : (
                  <a href="#sign-in"><Button size="lg">Create my landing page <ArrowRight /></Button></a>
                )}
                <LandingPageSetupGuide />
              </div>
            </div>

            <aside id="sign-in" className="border-t border-border bg-muted/30 p-5 md:border-l md:border-t-0 md:p-6 lg:p-8">
              {signedIn ? (
                <div className="flex h-full min-h-96 flex-col justify-between border border-border bg-card p-8">
                  <div><p className="text-xs font-semibold uppercase text-primary">Welcome back</p><h2 className="mt-3 font-display text-3xl">Your landing page is ready when you are.</h2></div>
                  <Button asChild size="lg"><Link to="/dashboard">Open my page <ArrowRight /></Link></Button>
                </div>
              ) : <AuthPanel className="h-full" />}
            </aside>
          </div>
        </section>

        <section className="mx-auto grid max-w-7xl gap-10 px-5 py-16 lg:grid-cols-[0.8fr_1.2fr] lg:px-8 lg:py-24">
          <div>
            <p className="text-xs font-semibold uppercase text-primary">What you create</p>
            <h2 className="mt-3 font-display text-3xl sm:text-4xl">A faster first tab.</h2>
            <p className="mt-4 max-w-md text-muted-foreground">No searching bookmarks or typing the same addresses. Your most-used destinations are visible and ready.</p>
          </div>
          <div className="border border-border bg-card p-4 shadow-2xl sm:p-6">
            <div className="mb-5 flex items-center justify-between border-b border-border pb-4">
              <div><p className="font-display text-lg">Good morning, Shreya</p><p className="text-xs text-muted-foreground">Where would you like to go?</p></div>
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary font-bold text-primary-foreground">S</span>
            </div>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {services.slice(0, 5).map((service) => <div key={service.label} className="flex min-h-24 flex-col justify-between border border-border bg-background p-3"><service.icon className="h-5 w-5 text-primary" /><span className="text-sm font-medium">{service.label}</span></div>)}
              <div className="flex min-h-24 flex-col justify-between border border-primary bg-primary/10 p-3"><Play className="h-5 w-5 text-primary" /><span className="text-sm font-medium">Add any link</span></div>
            </div>
          </div>
        </section>

        <section className="border-t border-border bg-card">
          <div className="mx-auto grid max-w-7xl gap-8 px-5 py-16 sm:grid-cols-3 lg:px-8">
            {[ ["01", "Add what matters", "Paste Instagram accounts, YouTube channels, LinkedIn, work tools, and any website."], ["02", "Sort them into folders", "Make a folder per brand, project or person, then drop each Instagram, YouTube or website link inside it."], ["03", "Open it every time", "Publish one link, then follow the guide for Chrome, Safari, Edge, or Firefox."] ].map(([number, title, body]) => (
              <div key={number} className="border-l border-border pl-5"><span className="text-xs font-bold text-primary">{number}</span><h3 className="mt-4 font-display text-xl">{title}</h3><p className="mt-2 text-sm leading-6 text-muted-foreground">{body}</p></div>
            ))}
          </div>
        </section>
      </main>

      <footer className="mx-auto flex max-w-7xl flex-col gap-4 px-5 py-8 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between lg:px-8">
        <Brand className="text-sm text-foreground" />
        <Link to="/setup" className="inline-flex items-center gap-1 hover:text-foreground">Browser setup instructions <ExternalLink className="h-3 w-3" /></Link>
      </footer>
    </div>
  );
}