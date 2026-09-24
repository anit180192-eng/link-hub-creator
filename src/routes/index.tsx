import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";
import {
  ArrowRight,
  Check,
  ChevronDown,
  ExternalLink,
  FolderTree,
  Globe2,
  KeyRound,
  Mail,
  MousePointer2,
  Sparkles,
} from "lucide-react";
import { Brand } from "@/components/Brand";
import { LandingAdSlot } from "@/components/LandingAdSlot";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import builderImage from "@/assets/homepage/03-builder-demo.webp.asset.json";
import homeImage from "@/assets/homepage/04-published-home-demo.webp.asset.json";
import creativeImage from "@/assets/homepage/05-creative-tab-demo.webp.asset.json";
import signupImage from "@/assets/homepage/landing-page-builder-signup.webp.asset.json";
import setupImage from "@/assets/homepage/landing-page-builder-setup.webp.asset.json";
import overviewImage from "@/assets/homepage/lpb-homepage-demo.webp.asset.json";

const TITLE = "Landing Page Builder — your personal browser start page";
const DESCRIPTION =
  "Keep your everyday websites in one personal start page. Organise them by profile, tab and folder, then open your page from any browser.";

export const Route = createFileRoute("/")({
  staticData: { sitemap: true },
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESCRIPTION },
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
    const { data } = supabase.auth.onAuthStateChange((_event, session) => setSignedIn(Boolean(session)));
    return () => data.subscription.unsubscribe();
  }, []);

  return (
    <div className="min-h-screen overflow-x-hidden bg-background text-foreground">
      <header className="dark sticky top-0 z-40 border-b border-border/70 bg-background/95 text-foreground backdrop-blur-lg">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-5 py-4 lg:px-8">
          <Link to="/" aria-label="Landing Page Builder home" className="min-w-0">
            <Brand className="truncate text-sm sm:text-lg" />
          </Link>
          <nav className="hidden items-center gap-1 lg:flex" aria-label="Main navigation">
            <a href="#how-it-works" className="rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">How it works</a>
            <a href="#security" className="rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">PIN protection</a>
            <Link to="/setup" className="rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">Setup guide</Link>
            <a href="#contact" className="rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">Feedback</a>
          </nav>
          <div className="flex shrink-0 items-center gap-2">
            <ThemeToggle />
            {signedIn ? (
              <Button asChild size="sm"><Link to="/dashboard">Open builder</Link></Button>
            ) : (
              <Button asChild size="sm" variant="outline"><Link to="/auth" search={{ mode: "signin" }}>Sign in</Link></Button>
            )}
          </div>
        </div>
      </header>

      <main>
        <section className="dark relative overflow-hidden border-b border-border bg-background text-foreground">
          <div className="mx-auto grid max-w-7xl gap-10 px-5 pb-16 pt-14 lg:grid-cols-[0.78fr_1.22fr] lg:items-center lg:gap-14 lg:px-8 lg:pb-24 lg:pt-20">
            <div className="relative z-10">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">Your browser, better organised</p>
              <h1 className="mt-5 max-w-2xl font-display text-4xl font-semibold leading-[1.04] sm:text-5xl lg:text-6xl xl:text-7xl">
                A better place to begin your day online.
              </h1>
              <p className="mt-6 max-w-xl text-base leading-7 text-muted-foreground sm:text-lg">
                Keep your everyday websites in one personal start page. Organise them by profile, tab and folder, then open your page from any browser.
              </p>
              <div className="mt-8 flex flex-wrap items-center gap-3">
                <PrimaryCta signedIn={signedIn} />
                <Button asChild size="lg" variant="ghost"><a href="#how-it-works">See how it works<ChevronDown /></a></Button>
              </div>
              <p className="mt-5 flex items-center gap-2 text-xs text-muted-foreground"><Check className="h-4 w-4 text-primary" aria-hidden="true" /> Free account · your page works across browsers and devices</p>
            </div>

            <Figure
              src={homeImage.url}
              alt="Illustrative finished start page showing a greeting, world clocks, favourite links and recent activity"
              label="Illustrative demo · finished Home page"
              priority
              className="lg:-mr-24"
            />
          </div>
        </section>

        <section className="hub-light border-b border-hub-border bg-hub-background text-hub-foreground">
          <div className="mx-auto grid max-w-7xl gap-7 px-5 py-10 sm:grid-cols-[1fr_auto] sm:items-center lg:px-8 lg:py-14">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-hub-accent">One useful page, ready when you are</p>
              <h2 className="mt-2 max-w-3xl font-display text-2xl font-semibold sm:text-3xl">Your links, not a blank search box.</h2>
            </div>
            <div className="flex items-center gap-8 text-sm text-hub-muted">
              <span><strong className="block text-lg text-hub-foreground">2</strong> profiles</span>
              <span><strong className="block text-lg text-hub-foreground">5</strong> tabs per profile</span>
              <span><strong className="block text-lg text-hub-foreground">1</strong> page to open</span>
            </div>
          </div>
        </section>

        <section id="how-it-works" className="hub-light scroll-mt-20 bg-hub-background text-hub-foreground">
          <Chapter
            number="01"
            eyebrow="Start with one link"
            title="Useful before it becomes elaborate."
            body="Paste a website address and the builder gives it a sensible place. A default tab and folder are already waiting, so you can publish a useful page without learning the whole system first."
            benefit="Add one link now; organise more whenever you are ready."
            icon={<MousePointer2 />}
            visual={<Figure src={builderImage.url} alt="Illustrative Landing Page Builder workspace showing the first-link guide, tabs, folders and a saved link" label="Illustrative demo · builder" />}
          />
        </section>

        <section className="dark border-y border-border bg-background text-foreground">
          <Chapter
            dark
            reverse
            number="02"
            eyebrow="Make space for every part of life"
            title="Profiles, tabs and folders — in a hierarchy that stays clear."
            body="Keep personal and work spaces separate. Within each profile, tabs hold topics and folders keep related links together. The result stays compact even as your collection grows."
            benefit="Switch context without mixing everything into one bookmarks list."
            icon={<FolderTree />}
            visual={
              <div className="grid gap-4">
                <Figure src={creativeImage.url} alt="Illustrative published Creative tab with a Creative projects folder and two links" label="Example page · Creative tab" />
                <Figure src={overviewImage.url} alt="Illustrative overview of Landing Page Builder and its compact Home and Links experience" label="Illustrative demo · product overview" compact />
              </div>
            }
          />
        </section>

        <section className="hub-light bg-hub-background text-hub-foreground">
          <Chapter
            number="03"
            eyebrow="Open the page you made"
            title="A calm starting point for the things you use every day."
            body="Your Home view brings together world clocks and favourites from across your tabs. Recently opened and most visited lists are private to that browser and count only links opened from your landing page."
            benefit="The right links and times are visible before the day gets noisy."
            icon={<Globe2 />}
            visual={<Figure src={homeImage.url} alt="Illustrative published Home page with world clocks, favourite links, most visited and recently opened areas" label="Example page · Home" />}
          />
        </section>

        <section className="dark border-y border-border bg-background text-foreground">
          <div className="mx-auto grid max-w-7xl gap-12 px-5 py-20 lg:grid-cols-[0.72fr_1.28fr] lg:items-center lg:px-8 lg:py-28">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">From sign-up to start page</p>
              <h2 className="mt-4 font-display text-3xl font-semibold sm:text-4xl">Create once. Open from any browser.</h2>
              <p className="mt-5 max-w-lg leading-7 text-muted-foreground">A free account gives your page its own address and keeps changes in sync. You choose whether to sign in with Google or email.</p>
              <ol className="mt-8 space-y-5">
                <Step number="1" title="Create your account" body="Use Google or email to open the builder." />
                <Step number="2" title="Add and publish" body="Your saved page gets a reusable web address." />
                <Step number="3" title="Set it in your browser" body="Follow the short guide for Chrome, Edge, Safari or Firefox." />
              </ol>
            </div>
            <div className="grid gap-4 sm:grid-cols-[0.7fr_1.3fr] sm:items-center">
              <Figure src={signupImage.url} alt="Landing Page Builder account creation screen with Google and email options" label="Account creation" compact />
              <Figure src={setupImage.url} alt="Browser setup guide showing steps for opening a landing page when Chrome starts" label="Browser setup guide" />
            </div>
          </div>
        </section>

        <LandingAdSlot />

        <section id="security" className="hub-light scroll-mt-20 bg-hub-background text-hub-foreground">
          <div className="mx-auto max-w-7xl px-5 py-20 lg:px-8 lg:py-24">
            <div className="grid gap-8 border-y border-hub-border py-10 lg:grid-cols-[1fr_1fr] lg:items-center">
              <div>
                <span className="flex h-11 w-11 items-center justify-center rounded-md bg-hub-elevated text-hub-accent"><KeyRound className="h-5 w-5" aria-hidden="true" /></span>
                <h2 className="mt-5 font-display text-3xl font-semibold sm:text-4xl">Add a PIN when a profile needs one.</h2>
              </div>
              <div>
                <p className="leading-7 text-hub-muted">Optional per-profile protection asks for a 6-digit PIN on a new browser. A browser you trust can remember access, and changing the PIN revokes previously trusted browsers.</p>
                <Button asChild variant="outline" className="mt-6 border-hub-border bg-hub-surface text-hub-foreground hover:bg-hub-elevated"><Link to="/setup">See the browser setup guide<ExternalLink /></Link></Button>
              </div>
            </div>
          </div>
        </section>

        <section className="dark overflow-hidden bg-background text-foreground">
          <div className="mx-auto max-w-5xl px-5 py-20 text-center lg:px-8 lg:py-28">
            <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-md bg-primary text-primary-foreground"><Sparkles className="h-5 w-5" aria-hidden="true" /></span>
            <h2 className="mx-auto mt-6 max-w-3xl font-display text-4xl font-semibold sm:text-5xl">Build the page you want to open first.</h2>
            <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-muted-foreground">Start with one link. Add structure when you need it. Your personal start page stays ready on every browser where you open it.</p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <PrimaryCta signedIn={signedIn} />
              {!signedIn ? <Button asChild size="lg" variant="outline"><Link to="/auth" search={{ mode: "signin" }}>Sign in</Link></Button> : null}
            </div>
          </div>
        </section>
      </main>

      <section id="contact" className="hub-light scroll-mt-20 border-t border-hub-border bg-hub-background text-hub-foreground">
        <div className="mx-auto max-w-7xl px-5 py-14 text-center lg:px-8">
          <Mail className="mx-auto h-5 w-5 text-hub-accent" aria-hidden="true" />
          <h2 className="mt-4 font-display text-2xl font-semibold">Have feedback or an idea?</h2>
          <p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-hub-muted">If you have feedback about the website or an idea for an enhancement, write to <a href="mailto:antcodeslabs@gmail.com" className="font-semibold text-hub-accent underline-offset-4 hover:underline">antcodeslabs@gmail.com</a>.</p>
        </div>
      </section>

      <footer className="dark border-t border-border bg-background text-foreground">
        <div className="mx-auto grid max-w-7xl gap-5 px-5 py-8 text-sm text-muted-foreground sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center lg:px-8">
          <div className="flex min-w-0 flex-wrap items-center gap-3"><Brand className="text-sm text-foreground" /><span>by <a href="https://aurunex.com/" target="_blank" rel="noopener noreferrer" className="hover:text-foreground">AuruNex</a></span></div>
          <nav className="flex flex-wrap gap-x-5 gap-y-2" aria-label="Footer navigation">
            <a href="mailto:antcodeslabs@gmail.com" className="hover:text-foreground">Contact</a>
            <a href="/privacy.html" className="hover:text-foreground">Privacy policy</a>
            <Link to="/setup" className="hover:text-foreground">Setup guide</Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}

function PrimaryCta({ signedIn }: { signedIn: boolean }) {
  return signedIn ? (
    <Button asChild size="lg"><Link to="/dashboard">Open my builder<ArrowRight /></Link></Button>
  ) : (
    <Button asChild size="lg"><Link to="/auth" search={{ mode: "signup" }}>Create my free start page<ArrowRight /></Link></Button>
  );
}

function Figure({ src, alt, label, priority = false, compact = false, className = "" }: { src: string; alt: string; label: string; priority?: boolean; compact?: boolean; className?: string }) {
  return (
    <figure className={`group relative ${className}`}>
      <div className={`overflow-hidden rounded-lg border border-hub-border bg-hub-surface shadow-2xl transition-transform duration-500 motion-reduce:transition-none md:group-hover:-translate-y-1 ${compact ? "aspect-[16/8]" : "aspect-[16/9]"}`}>
        <img src={src} alt={alt} width={1600} height={900} loading={priority ? "eager" : "lazy"} fetchPriority={priority ? "high" : "auto"} decoding="async" className="h-full w-full object-cover" />
      </div>
      <figcaption className="mt-3 flex items-center gap-2 text-xs font-medium text-current opacity-65"><span className="h-px w-5 bg-current" aria-hidden="true" />{label}</figcaption>
    </figure>
  );
}

function Chapter({ number, eyebrow, title, body, benefit, icon, visual, reverse = false, dark = false }: { number: string; eyebrow: string; title: string; body: string; benefit: string; icon: ReactNode; visual: ReactNode; reverse?: boolean; dark?: boolean }) {
  return (
    <div className="mx-auto max-w-7xl px-5 py-20 lg:px-8 lg:py-28">
      <div className={`grid gap-12 lg:grid-cols-[0.78fr_1.22fr] lg:items-center lg:gap-16 ${reverse ? "lg:grid-cols-[1.22fr_0.78fr]" : ""}`}>
        <div className={reverse ? "lg:order-2" : ""}>
          <div className="flex items-center gap-3">
            <span className={`text-xs font-semibold ${dark ? "text-primary" : "text-hub-accent"}`}>{number}</span>
            <span className={`h-px w-10 ${dark ? "bg-border" : "bg-hub-border"}`} aria-hidden="true" />
            <p className={`text-xs font-semibold uppercase tracking-[0.16em] ${dark ? "text-primary" : "text-hub-accent"}`}>{eyebrow}</p>
          </div>
          <h2 className="mt-5 font-display text-3xl font-semibold leading-tight sm:text-4xl lg:text-5xl">{title}</h2>
          <p className={`mt-5 max-w-xl text-base leading-7 ${dark ? "text-muted-foreground" : "text-hub-muted"}`}>{body}</p>
          <div className={`mt-8 flex max-w-xl gap-3 border-t pt-5 text-sm font-medium ${dark ? "border-border" : "border-hub-border"}`}>
            <span className={`mt-0.5 [&_svg]:h-5 [&_svg]:w-5 ${dark ? "text-primary" : "text-hub-accent"}`}>{icon}</span>
            <p>{benefit}</p>
          </div>
        </div>
        <div className={reverse ? "lg:order-1" : ""}>{visual}</div>
      </div>
    </div>
  );
}

function Step({ number, title, body }: { number: string; title: string; body: string }) {
  return (
    <li className="grid grid-cols-[auto_minmax(0,1fr)] gap-3">
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-primary text-xs font-semibold text-primary">{number}</span>
      <div><h3 className="font-display font-semibold">{title}</h3><p className="mt-1 text-sm text-muted-foreground">{body}</p></div>
    </li>
  );
}
