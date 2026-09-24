import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";
import {
  ArrowRight,
  Check,
  Clock3,
  Download,
  ExternalLink,
  FolderOpen,
  Mail,
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
import { Brand } from "@/components/Brand";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import builderImage from "@/assets/homepage/03-builder-demo.webp.asset.json";
import homeImage from "@/assets/homepage/04-published-home-demo.webp.asset.json";
import creativeImage from "@/assets/homepage/05-creative-tab-demo.webp.asset.json";

const TITLE = "Landing Page Builder — your personal browser start page";
const DESCRIPTION =
  "Keep the websites you use every day in one organised page. Add your links, group them by topic, and open your page from any browser.";

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
    <Button asChild size="lg"><Link to="/auth" search={{ mode: "signup" }}>Create my free start page <ArrowRight /></Link></Button>
  );

  return (
    <div className="min-h-screen overflow-hidden">
      <header className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-5 lg:px-8">
        <Link to="/" aria-label="Landing Page Builder home"><Brand className="text-base sm:text-lg" /></Link>
        <nav className="hidden items-center gap-1 text-sm md:flex" aria-label="Main">
          <a href="#example" className="rounded-md px-3 py-2 text-muted-foreground hover:bg-muted hover:text-foreground">What you build</a>
          <a href="#plans" className="rounded-md px-3 py-2 text-muted-foreground hover:bg-muted hover:text-foreground">Free vs account</a>
          <a href="#privacy" className="rounded-md px-3 py-2 text-muted-foreground hover:bg-muted hover:text-foreground">Privacy</a>
          <Link to="/setup" className="rounded-md px-3 py-2 text-muted-foreground hover:bg-muted hover:text-foreground">Setup guide</Link>
          <a href="#contact" className="rounded-md px-3 py-2 text-muted-foreground hover:bg-muted hover:text-foreground">Feedback</a>
        </nav>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          {signedIn ? (
            <Button asChild size="sm"><Link to="/dashboard">Open my builder</Link></Button>
          ) : (
            <Button asChild size="sm" variant="outline"><Link to="/auth" search={{ mode: "signin" }}>Sign in</Link></Button>
          )}
        </div>
      </header>

      <main>
        {/* Hero */}
        <section className="border-y border-border">
          <div className="mx-auto grid max-w-7xl md:grid-cols-[0.9fr_1.1fr] md:items-center">
            <div className="flex flex-col justify-center px-5 py-14 lg:px-8 lg:py-20">
              <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-primary">
                <span className="h-2 w-2 rounded-full bg-primary" aria-hidden="true" /> Personal browser start page
              </p>
              <h1 className="mt-5 max-w-3xl font-display text-4xl leading-[1.05] sm:text-5xl lg:text-6xl">
                Start every browser with <span className="text-primary">your links, organised.</span>
              </h1>
              <p className="mt-6 max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg">
                Keep the websites you use every day in one organised page. Add your links, group them by topic, and open your page from any browser.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                {primaryCta}
                {!signedIn ? <Button asChild size="lg" variant="ghost"><Link to="/auth" search={{ mode: "signin" }}>Sign in</Link></Button> : null}
              </div>
            </div>
            <div className="border-t border-border p-4 md:border-l md:border-t-0 lg:p-7"><CompactExample /></div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-5 py-12 lg:px-8 lg:py-16">
          <p className="text-xs font-semibold uppercase tracking-wider text-primary">Three simple steps</p>
          <div className="mt-6 grid gap-6 sm:grid-cols-3">
            {[
              ["01", "Add your first link", "Paste a website address. A name is optional."],
              ["02", "Organise it", "Use the ready-made folder, or add your own later."],
              ["03", "Publish your page", "Open your personal address from any browser."],
            ].map(([number, title, body]) => (
              <div key={number} className="border-l border-border pl-4">
                <span className="text-xs font-bold text-primary">{number}</span>
                <h2 className="mt-2 font-display text-lg">{title}</h2>
                <p className="mt-1 text-sm leading-6 text-muted-foreground">{body}</p>
              </div>
            ))}
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

        {/* Plans */}
        <section id="plans" className="mx-auto max-w-7xl scroll-mt-6 px-5 py-16 lg:px-8 lg:py-24">
          <p className="text-xs font-semibold uppercase tracking-wider text-primary">Free vs premium</p>
          <h2 className="mt-3 max-w-3xl font-display text-3xl sm:text-4xl">Two plans, one builder.</h2>
          <div className="mt-10 grid gap-5 lg:grid-cols-2">
            <PlanCard
              highlight
              icon={Link2}
              eyebrow="Free account"
              title="Free"
              badge={<span className="inline-flex items-center gap-1 rounded-full bg-primary px-2.5 py-1 text-[11px] font-semibold text-primary-foreground"><Check className="h-3 w-3" aria-hidden="true" /> Start here</span>}
              points={[
                "2 profiles — for example Personal and Work",
                "5 tabs per profile",
                "Unlimited links and folders",
                "PIN protection, publishing, and bookmark import",
              ]}
              cta={signedIn
                ? <Button asChild><Link to="/dashboard">Open my builder <ArrowRight /></Link></Button>
                : <Button asChild><Link to="/auth" search={{ mode: "signup" }}>Create my free start page <ArrowRight /></Link></Button>}
            />
            <PlanCard
              icon={Globe2}
              eyebrow="Premium account"
              title="Premium"
              badge={<StatusBadge>Coming soon</StatusBadge>}
              points={[
                "10 profiles",
                "50 tabs per profile",
                "Everything in Free, with room for much more",
              ]}
            />
          </div>
        </section>

        {/* Privacy */}
        <section id="privacy" className="scroll-mt-6 border-y border-border bg-card">
          <div className="mx-auto grid max-w-7xl gap-10 px-5 py-16 lg:grid-cols-[1.1fr_0.9fr] lg:items-center lg:px-8 lg:py-20">
            <div>
              <div className="flex flex-wrap items-center gap-3">
                <p className="text-xs font-semibold uppercase tracking-wider text-primary">Privacy for your personal link</p>
              </div>
              <h2 className="mt-3 font-display text-3xl sm:text-4xl">Your link is a real web address. So we'll lock it for you.</h2>
              <p className="mt-4 max-w-xl text-muted-foreground">
                Anyone who gets hold of a web address could open it. That's why personal links come with a PIN and
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
              <a href="/privacy.html" className="mt-6 inline-flex items-center gap-1.5 text-sm font-medium text-primary underline-offset-4 hover:underline">Read the full privacy policy <ExternalLink className="h-3 w-3" aria-hidden="true" /></a>
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

        {/* Sample screenshots */}
        <section className="mx-auto max-w-7xl px-5 py-16 lg:px-8 lg:py-24">
          <p className="text-xs font-semibold uppercase tracking-wider text-primary">See it in action</p>
          <h2 className="mt-3 max-w-3xl font-display text-3xl sm:text-4xl">A look at the pages you'll build.</h2>
          <p className="mt-4 max-w-2xl text-muted-foreground">Sample screens from the builder and a published page — your own page will carry your name, links and clocks.</p>
          <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[
              { src: builderImage.url, alt: "The builder workspace with tabs, folders and saved links", label: "The builder" },
              { src: homeImage.url, alt: "A published Home page with a greeting, world clocks and favourite links", label: "Published Home page" },
              { src: creativeImage.url, alt: "A published tab with a folder of creative project links", label: "A published tab" },
            ].map((shot) => (
              <figure key={shot.label} className="group">
                <div className="overflow-hidden rounded-lg border border-border bg-card shadow-lg transition-transform duration-500 motion-reduce:transition-none md:group-hover:-translate-y-1">
                  <img src={shot.src} alt={shot.alt} width={1600} height={900} loading="lazy" decoding="async" className="aspect-[16/9] h-full w-full object-cover" />
                </div>
                <figcaption className="mt-3 flex items-center gap-2 text-xs font-medium text-muted-foreground"><span className="h-px w-5 bg-current" aria-hidden="true" />{shot.label}</figcaption>
              </figure>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-5 py-12 lg:px-8 lg:py-16">
          <h2 className="font-display text-2xl">Ready to make yours?</h2>
          <div className="mt-10 flex flex-wrap gap-3">
            {primaryCta}
            <Button asChild size="lg" variant="outline"><Link to="/setup"><RefreshCw /> Browser setup guide</Link></Button>
          </div>
        </section>

      </main>

      <section id="contact" className="scroll-mt-6 border-t border-border bg-card">
        <div className="mx-auto max-w-7xl px-5 py-12 text-center lg:px-8">
          <span className="mx-auto flex h-10 w-10 items-center justify-center rounded-md bg-primary/10 text-primary"><Mail className="h-5 w-5" aria-hidden="true" /></span>
          <h2 className="mt-4 font-display text-2xl sm:text-3xl">Have feedback or an idea?</h2>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-muted-foreground">
            If you have any feedback about the website or think of an enhancement, we'd love to hear from you. Please write to
            {" "}<a href="mailto:antcodeslabs@gmail.com" className="font-medium text-primary underline-offset-4 hover:underline">antcodeslabs@gmail.com</a>.
          </p>
        </div>
      </section>

      <footer className="mx-auto mt-10 flex max-w-7xl flex-col gap-4 border-t border-border px-5 py-8 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between lg:px-8">
        <div className="flex flex-wrap items-center gap-3">
          <Brand className="text-sm text-foreground" />
          <span>by <a href="https://aurunex.com/" target="_blank" rel="noopener noreferrer" className="hover:text-foreground">AuruNex</a></span>
        </div>
        <div className="flex items-center gap-4">
          <a href="mailto:antcodeslabs@gmail.com" className="inline-flex items-center gap-1 hover:text-foreground"><Mail className="h-3 w-3" /> antcodeslabs@gmail.com</a>
          <a href="/privacy.html" className="hover:text-foreground">Privacy Policy</a>
          <Link to="/setup" className="inline-flex items-center gap-1 hover:text-foreground">Browser setup instructions <ExternalLink className="h-3 w-3" /></Link>
        </div>
      </footer>
    </div>
  );
}

const exampleFolders = [
  { name: "Every day", links: ["Gmail", "Calendar", "Drive"] },
  { name: "Creative", links: ["Canva", "Pinterest"] },
];

function CompactExample() {
  const [tab, setTab] = useState<"Home" | "Links">("Home");
  return (
    <div id="example" className="dark overflow-hidden rounded-lg border border-hub-border bg-hub-background text-hub-foreground shadow-2xl">
      <div className="flex items-center justify-between border-b border-hub-border bg-hub-surface px-4 py-3">
        <div className="flex items-center gap-2"><span className="grid size-8 place-items-center rounded-md bg-hub-accent font-semibold text-hub-background">S</span><div><p className="text-xs font-semibold">Shreya</p><p className="text-[10px] text-hub-muted">Example page</p></div></div>
        <span className="text-[10px] text-hub-muted">Personal profile</span>
      </div>
      <div className="flex gap-1 border-b border-hub-border px-3 py-1" aria-label="Example page tabs">
        {(["Home", "Links"] as const).map((name) => <Button key={name} size="sm" variant="ghost" onClick={() => setTab(name)} aria-pressed={tab === name} className={tab === name ? "bg-hub-elevated text-hub-accent" : "text-hub-muted"}>{name}</Button>)}
      </div>
      <div className="min-h-64 p-4 sm:p-5">
        {tab === "Home" ? <div><p className="text-xs text-hub-muted">Good evening</p><p className="mt-1 font-display text-3xl">21:31</p><p className="mt-1 text-xs text-hub-muted">India time</p><div className="mt-6"><p className="text-xs font-semibold text-hub-accent">Favourite links</p><div className="mt-2 flex gap-2">{["Gmail", "Drive", "Canva"].map((name) => <span key={name} className="rounded-md border border-hub-border bg-hub-surface px-3 py-2 text-xs">{name}</span>)}</div></div></div> : <div className="grid gap-3 sm:grid-cols-2">{exampleFolders.map((folder) => <section key={folder.name} className="overflow-hidden rounded-md border border-hub-border bg-hub-surface"><h3 className="border-b border-hub-border px-3 py-2 text-xs font-semibold text-hub-accent">{folder.name}</h3>{folder.links.map((name) => <Button key={name} type="button" variant="ghost" className="flex min-h-10 w-full justify-start rounded-none border-b border-hub-border/60 px-3 text-left text-xs last:border-0 hover:bg-hub-elevated"><span className="grid size-6 place-items-center rounded-sm bg-hub-elevated font-semibold text-hub-accent">{name[0]}</span>{name}<span className="ml-auto text-[10px] text-hub-muted">Example</span></Button>)}</section>)}</div>}
      </div>
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
