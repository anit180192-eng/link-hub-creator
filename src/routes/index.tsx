import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";
import {
  ArrowRight,
  Check,
  Clock3,
  Download,
  ExternalLink,
  FolderOpen,
  Globe2,
  Image as ImageIcon,
  KeyRound,
  Laptop,
  Link2,
  Lock,
  MonitorSmartphone,
  RefreshCw,
  ShieldCheck,
  Smartphone,
} from "lucide-react";
import { AuthPanel } from "@/components/AuthPanel";
import { Brand } from "@/components/Brand";
import { StartPageView } from "@/components/StartPageView";
import { Button } from "@/components/ui/button";
import { LandingAdSlot } from "@/components/LandingAdSlot";
import { supabase } from "@/integrations/supabase/client";
import type { StartPageLink, StartPageProfile } from "@/lib/startpage";

const TITLE = "Landing Page Builder — your personal start page for every browser";
const DESCRIPTION =
  "Put your accounts, channels, tools and favourite websites into one organised page with folders and world clocks. Get a personal link that opens on every browser and device.";

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

/* Sample page shown in the "A faster first tab" preview — rendered with the
   exact same component as real published pages, so it always matches. */
const sampleProfile: StartPageProfile = {
  slug: "shreya",
  display_name: "Shreya Anit",
  tagline: "Creator, property and family — everything I open daily.",
  avatar_url: null,
  theme: "grid",
  dark_mode: true,
  clocks: [
    { label: "India", tz: "Asia/Kolkata" },
    { label: "London", tz: "Europe/London" },
    { label: "Sydney", tz: "Australia/Sydney" },
  ],
};

const sampleLinks: StartPageLink[] = [
  { id: "1", platform: "linkedin", label: "LinkedIn", url: "https://www.linkedin.com", group_name: "Personal", position: 1 },
  { id: "2", platform: "website", label: "Gmail", url: "https://mail.google.com", group_name: "Personal", position: 2 },
  { id: "3", platform: "website", label: "Google Calendar", url: "https://calendar.google.com", group_name: "Personal", position: 3 },
  { id: "4", platform: "website", label: "Google Drive", url: "https://drive.google.com", group_name: "Personal", position: 4 },
  { id: "5", platform: "instagram", label: "Instagram", url: "https://www.instagram.com", group_name: "Personal", position: 5, icon_only: true },
  { id: "6", platform: "website", label: "Facebook", url: "https://www.facebook.com", group_name: "Personal", position: 6, icon_only: true },
  { id: "7", platform: "youtube", label: "YouTube channel", url: "https://www.youtube.com", group_name: "Bhakti Raga Media", position: 7 },
  { id: "8", platform: "website", label: "SoundCloud", url: "https://soundcloud.com", group_name: "Bhakti Raga Media", position: 8 },
  { id: "9", platform: "instagram", label: "Instagram", url: "https://www.instagram.com", group_name: "Bhakti Raga Media", position: 9, icon_only: true },
  { id: "10", platform: "website", label: "Rightmove", url: "https://www.rightmove.co.uk", group_name: "Property", position: 10 },
  { id: "11", platform: "website", label: "Zoopla", url: "https://www.zoopla.co.uk", group_name: "Property", position: 11 },
];

const features = [
  { icon: FolderOpen, title: "Folders for every part of your life", body: "One folder per brand, project or person. Five Instagram accounts? Each sits in the folder it belongs to." },
  { icon: ImageIcon, title: "Logo-only tiles", body: "Accounts you know by sight can show as a small logo. One click and you're there — no label taking up space." },
  { icon: Clock3, title: "World clocks", body: "Add up to five countries — India, UK, Australia and more — and see the time everywhere at a glance." },
  { icon: MonitorSmartphone, title: "Works in every browser", body: "Chrome, Safari, Edge and Firefox. Our setup guide shows you exactly where to paste your link on Windows or Mac." },
];

function Landing() {
  const [signedIn, setSignedIn] = useState(false);
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSignedIn(Boolean(data.session)));
    const { data } = supabase.auth.onAuthStateChange((_event, session) => setSignedIn(Boolean(session)));
    return () => data.subscription.unsubscribe();
  }, []);

  const primaryCta = signedIn ? (
    <Button asChild size="lg"><Link to="/dashboard">Open my builder <ArrowRight /></Link></Button>
  ) : (
    <Button asChild size="lg"><a href="#sign-in">Get my personal link <ArrowRight /></a></Button>
  );

  return (
    <div className="min-h-screen overflow-hidden">
      <header className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-5 lg:px-8">
        <Link to="/" aria-label="Landing Page Builder home"><Brand className="text-base sm:text-lg" /></Link>
        <nav className="hidden items-center gap-1 text-sm md:flex" aria-label="Main">
          <a href="#preview" className="rounded-md px-3 py-2 text-muted-foreground hover:bg-muted hover:text-foreground">What you build</a>
          <a href="#plans" className="rounded-md px-3 py-2 text-muted-foreground hover:bg-muted hover:text-foreground">Free vs account</a>
          <a href="#privacy" className="rounded-md px-3 py-2 text-muted-foreground hover:bg-muted hover:text-foreground">Privacy</a>
          <Link to="/setup" className="rounded-md px-3 py-2 text-muted-foreground hover:bg-muted hover:text-foreground">Setup guide</Link>
        </nav>
        {signedIn ? (
          <Button asChild size="sm"><Link to="/dashboard">Open my builder</Link></Button>
        ) : (
          <Button asChild size="sm" variant="outline"><a href="#sign-in">Sign in</a></Button>
        )}
      </header>

      <main>
        {/* Hero */}
        <section className="border-y border-border">
          <div className="mx-auto grid max-w-7xl md:grid-cols-[1.1fr_0.9fr] lg:grid-cols-[1.3fr_0.7fr]">
            <div className="flex flex-col justify-center px-5 py-14 lg:px-8 lg:py-20">
              <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-primary">
                <span className="h-2 w-2 rounded-full bg-primary" aria-hidden="true" /> Your browser's first page — made by you
              </p>
              <h1 className="mt-5 max-w-3xl font-display text-4xl leading-[1.05] sm:text-5xl lg:text-6xl">
                One page for every link <span className="text-primary">you open every day.</span>
              </h1>
              <p className="mt-6 max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg">
                Landing Page Builder turns your Instagram accounts, YouTube channels, LinkedIn, work tools and favourite
                websites into one tidy page. Set it as the page your browser opens, and everything you need is one click away.
              </p>
              <ul className="mt-7 grid max-w-2xl gap-3 text-sm sm:grid-cols-2">
                {[
                  "Organise links into folders by brand, project or person",
                  "Show busy accounts as compact logo tiles",
                  "Keep up to five world clocks on the page",
                  "Get a personal link that works on every device",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2.5">
                    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-accent/15 text-accent"><Check className="h-3.5 w-3.5" aria-hidden="true" /></span>
                    <span className="text-foreground/90">{item}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-8 flex flex-wrap gap-3">
                {primaryCta}
                <Button asChild size="lg" variant="outline"><a href="#preview">See what you'll build</a></Button>
              </div>
            </div>

            <aside id="sign-in" className="scroll-mt-6 border-t border-border bg-muted/30 p-5 md:border-l md:border-t-0 md:p-6 lg:p-8">
              {signedIn ? (
                <div className="flex h-full min-h-96 flex-col justify-between rounded-lg border border-border bg-card p-8">
                  <div>
                    <p className="text-xs font-semibold uppercase text-primary">Welcome back</p>
                    <h2 className="mt-3 font-display text-3xl">Your landing page is ready when you are.</h2>
                  </div>
                  <Button asChild size="lg"><Link to="/dashboard">Open my builder <ArrowRight /></Link></Button>
                </div>
              ) : (
                <div className="flex h-full flex-col gap-4">
                  <div className="rounded-lg border border-primary/40 bg-primary/10 p-4">
                    <p className="flex items-center gap-2 text-sm font-semibold text-foreground">
                      <Link2 className="h-4 w-4 text-primary" aria-hidden="true" /> Sign in to get your personal link
                    </p>
                    <p className="mt-1.5 text-xs leading-5 text-muted-foreground">
                      Your page gets its own address, like <span className="font-medium text-foreground">landingpagebuilder.aurunex.com/p/yourname</span>, so it opens the same way on every browser, laptop and phone. Free.
                    </p>
                  </div>
                  <AuthPanel className="flex-1" />
                </div>
              )}
            </aside>
          </div>
        </section>

        {/* Real preview */}
        <section id="preview" className="mx-auto max-w-7xl scroll-mt-6 px-5 py-16 lg:px-8 lg:py-24">
          <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr] lg:items-end">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-primary">What you create</p>
              <h2 className="mt-3 font-display text-3xl sm:text-4xl">A faster first tab.</h2>
            </div>
            <p className="max-w-xl text-muted-foreground">
              This is a real page made with Landing Page Builder — the same layout you'll get. Your name and photo, your
              folders, your clocks, and every link ready to open. Try clicking around.
            </p>
          </div>

          <div className="mx-auto mt-10 max-w-[1120px] overflow-hidden rounded-xl border border-border bg-card shadow-2xl">
            <div className="flex items-center gap-3 border-b border-border px-4 py-3">
              <div className="flex gap-1.5" aria-hidden="true">
                <span className="h-2.5 w-2.5 rounded-full bg-muted-foreground/40" />
                <span className="h-2.5 w-2.5 rounded-full bg-muted-foreground/40" />
                <span className="h-2.5 w-2.5 rounded-full bg-muted-foreground/40" />
              </div>
              <div className="flex min-w-0 flex-1 items-center gap-2 rounded-md border border-border bg-background px-3 py-1.5 text-xs text-muted-foreground">
                <Lock className="h-3 w-3 shrink-0" aria-hidden="true" />
                <span className="truncate">landingpagebuilder.aurunex.com/p/<span className="text-foreground">shreya</span></span>
              </div>
            </div>
            <div className="page-preview-stage !h-[26rem] sm:!h-[34rem] lg:!h-[45rem]">
              <div className="page-preview-canvas page-preview-canvas--desktop">
                <StartPageView profile={sampleProfile} links={sampleLinks} />
              </div>
            </div>
          </div>
        </section>

        {/* What it is */}
        <section className="border-t border-border bg-card">
          <div className="mx-auto max-w-7xl px-5 py-16 lg:px-8 lg:py-20">
            <p className="text-xs font-semibold uppercase tracking-wider text-primary">What is Landing Page Builder?</p>
            <h2 className="mt-3 max-w-3xl font-display text-3xl sm:text-4xl">Your own start page, instead of a search box and a messy bookmarks bar.</h2>
            <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {features.map((f) => (
                <div key={f.title} className="rounded-lg border border-border bg-background p-5">
                  <span className="flex h-10 w-10 items-center justify-center rounded-md bg-primary/10 text-primary"><f.icon className="h-5 w-5" aria-hidden="true" /></span>
                  <h3 className="mt-4 font-display text-lg">{f.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">{f.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Free vs account */}
        <section id="plans" className="mx-auto max-w-7xl scroll-mt-6 px-5 py-16 lg:px-8 lg:py-24">
          <p className="text-xs font-semibold uppercase tracking-wider text-primary">Two ways to use it</p>
          <h2 className="mt-3 max-w-3xl font-display text-3xl sm:text-4xl">Download a file, or get a link that follows you everywhere.</h2>
          <div className="mt-10 grid gap-5 lg:grid-cols-2">
            <PlanCard
              icon={Download}
              eyebrow="Without an account"
              title="Build and download"
              badge={<StatusBadge>Coming soon</StatusBadge>}
              points={[
                "Build your page right here, no sign-up",
                "Download it as a single HTML file",
                "Opens only on the computer where you save the file",
                "Change a link? Download and replace the file again",
              ]}
            />
            <PlanCard
              highlight
              icon={Link2}
              eyebrow="With a free account"
              title="Your personal link"
              badge={<span className="inline-flex items-center gap-1 rounded-full bg-primary px-2.5 py-1 text-[11px] font-semibold text-primary-foreground"><Check className="h-3 w-3" aria-hidden="true" /> Recommended</span>}
              points={[
                "Your own address: landingpagebuilder.aurunex.com/p/yourname",
                "Set it as your start page in every browser, on any laptop or phone",
                "Edit once — every device shows the change instantly",
                "Still download the HTML file whenever you like",
                "Protect it with a 6-digit PIN and trusted devices (coming soon)",
              ]}
              cta={signedIn
                ? <Button asChild><Link to="/dashboard">Open my builder <ArrowRight /></Link></Button>
                : <Button asChild><a href="#sign-in">Create my free account <ArrowRight /></a></Button>}
            />
          </div>
        </section>

        {/* Privacy */}
        <section id="privacy" className="scroll-mt-6 border-y border-border bg-card">
          <div className="mx-auto grid max-w-7xl gap-10 px-5 py-16 lg:grid-cols-[1.1fr_0.9fr] lg:items-center lg:px-8 lg:py-20">
            <div>
              <div className="flex flex-wrap items-center gap-3">
                <p className="text-xs font-semibold uppercase tracking-wider text-primary">Privacy for your personal link</p>
                <StatusBadge>Coming soon</StatusBadge>
              </div>
              <h2 className="mt-3 font-display text-3xl sm:text-4xl">Your link is a real web address. So we'll lock it for you.</h2>
              <p className="mt-4 max-w-xl text-muted-foreground">
                Anyone who gets hold of a web address could open it. That's why personal links will come with a PIN and
                trusted devices — secure for you, without typing a code every time you open a new tab.
              </p>
              <ol className="mt-8 space-y-5">
                {[
                  { icon: KeyRound, title: "Choose a 6-digit PIN", body: "Set it once in your builder. Only people with the PIN can see your page." },
                  { icon: Globe2, title: "New browser? Enter the PIN", body: "The first time your link opens on an unfamiliar browser or someone else's computer, it asks for the PIN." },
                  { icon: ShieldCheck, title: "Trust your own devices", body: "Mark your laptop and phone as trusted. They open your page straight away — no PIN again and again." },
                ].map((step, i) => (
                  <li key={step.title} className="flex gap-4">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-border bg-background text-primary"><step.icon className="h-5 w-5" aria-hidden="true" /></span>
                    <div>
                      <h3 className="font-display text-base"><span className="mr-2 text-xs text-primary">0{i + 1}</span>{step.title}</h3>
                      <p className="mt-1 text-sm leading-6 text-muted-foreground">{step.body}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>

            <div className="mx-auto w-full max-w-sm rounded-xl border border-border bg-background p-6 shadow-2xl" aria-label="Example of the PIN screen">
              <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary"><Lock className="h-5 w-5" aria-hidden="true" /></span>
              <p className="mt-4 text-center font-display text-lg">Shreya's page is protected</p>
              <p className="mt-1 text-center text-xs text-muted-foreground">Enter the 6-digit PIN to continue</p>
              <div className="mt-5 flex justify-center gap-2" aria-hidden="true">
                {["•", "•", "•", "", "", ""].map((d, i) => (
                  <span key={i} className={`flex h-11 w-9 items-center justify-center rounded-md border text-lg ${i === 3 ? "border-accent" : "border-border"} bg-card`}>{d}</span>
                ))}
              </div>
              <div className="mt-5 flex items-center gap-2.5 rounded-md border border-border bg-card px-3 py-2.5 text-xs">
                <span className="flex h-4 w-4 items-center justify-center rounded-sm bg-accent text-accent-foreground"><Check className="h-3 w-3" aria-hidden="true" /></span>
                Trust this device — don't ask again
              </div>
              <div className="mt-4 grid grid-cols-2 gap-2 text-[11px] text-muted-foreground">
                <span className="flex items-center gap-1.5"><Laptop className="h-3.5 w-3.5 text-accent" aria-hidden="true" /> My laptop · trusted</span>
                <span className="flex items-center gap-1.5"><Smartphone className="h-3.5 w-3.5 text-accent" aria-hidden="true" /> My phone · trusted</span>
              </div>
            </div>
          </div>
        </section>

        {/* How it works */}
        <section className="mx-auto max-w-7xl px-5 py-16 lg:px-8 lg:py-20">
          <p className="text-xs font-semibold uppercase tracking-wider text-primary">How it works</p>
          <h2 className="mt-3 font-display text-3xl sm:text-4xl">Ready in about five minutes.</h2>
          <div className="mt-10 grid gap-8 sm:grid-cols-3">
            {[
              ["01", "Sign up free", "Create an account with email or Google and pick your username — it becomes your link."],
              ["02", "Add links and folders", "Paste your Instagram, YouTube, LinkedIn or any website, sort them into folders, and add clocks."],
              ["03", "Publish and set as start page", "Publish, copy your link, and follow our guide for Chrome, Safari, Edge or Firefox."],
            ].map(([number, title, body]) => (
              <div key={number} className="border-l border-border pl-5">
                <span className="text-xs font-bold text-primary">{number}</span>
                <h3 className="mt-4 font-display text-xl">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{body}</p>
              </div>
            ))}
          </div>
          <div className="mt-10 flex flex-wrap gap-3">
            {primaryCta}
            <Button asChild size="lg" variant="outline"><Link to="/setup"><RefreshCw /> Browser setup guide</Link></Button>
          </div>
        </section>

        <LandingAdSlot />
      </main>

      <footer className="mx-auto mt-10 flex max-w-7xl flex-col gap-4 border-t border-border px-5 py-8 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between lg:px-8">
        <div className="flex flex-wrap items-center gap-3">
          <Brand className="text-sm text-foreground" />
          <span>by <a href="https://aurunex.com/" target="_blank" rel="noopener noreferrer" className="hover:text-foreground">AuruNex</a></span>
        </div>
        <Link to="/setup" className="inline-flex items-center gap-1 hover:text-foreground">Browser setup instructions <ExternalLink className="h-3 w-3" /></Link>
      </footer>
    </div>
  );
}

function StatusBadge({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-accent/50 bg-accent/10 px-2.5 py-1 text-[11px] font-semibold text-accent">
      <Clock3 className="h-3 w-3" aria-hidden="true" /> {children}
    </span>
  );
}

function PlanCard({
  icon: Icon,
  eyebrow,
  title,
  badge,
  points,
  cta,
  highlight,
}: {
  icon: typeof Download;
  eyebrow: string;
  title: string;
  badge?: ReactNode;
  points: string[];
  cta?: ReactNode;
  highlight?: boolean;
}) {
  return (
    <div className={`flex flex-col rounded-xl border p-6 sm:p-8 ${highlight ? "border-primary bg-card shadow-2xl" : "border-border bg-card/50"}`}>
      <div className="flex items-start justify-between gap-3">
        <span className={`flex h-11 w-11 items-center justify-center rounded-md ${highlight ? "bg-primary text-primary-foreground" : "bg-muted text-foreground"}`}><Icon className="h-5 w-5" aria-hidden="true" /></span>
        {badge}
      </div>
      <p className="mt-5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">{eyebrow}</p>
      <h3 className="mt-1 font-display text-2xl">{title}</h3>
      <ul className="mt-5 flex-1 space-y-3 text-sm">
        {points.map((p) => (
          <li key={p} className="flex items-start gap-2.5">
            <Check className={`mt-0.5 h-4 w-4 shrink-0 ${highlight ? "text-primary" : "text-muted-foreground"}`} aria-hidden="true" />
            <span className={highlight ? "text-foreground" : "text-muted-foreground"}>{p}</span>
          </li>
        ))}
      </ul>
      {cta ? <div className="mt-6">{cta}</div> : null}
    </div>
  );
}
