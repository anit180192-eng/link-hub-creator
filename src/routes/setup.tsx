import { createFileRoute, Link } from "@tanstack/react-router";
import { LandingAdSlot } from "@/components/LandingAdSlot";
import { Brand } from "@/components/Brand";
import { LandingPageSetupGuide } from "@/components/LandingPageSetupGuide";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/setup")({
  staticData: { sitemap: true },
  head: () => ({ meta: [
    { title: "Set your browser landing page — Landing Page Builder" },
    { name: "description", content: "Visual instructions for opening your personal landing page automatically in Chrome, Safari, Edge, or Firefox." },
    { property: "og:title", content: "Set your browser landing page — Landing Page Builder" },
    { property: "og:description", content: "Choose your device and browser for exact landing page setup steps." },
    { property: "og:type", content: "article" },
    { name: "twitter:card", content: "summary" },
  ] }),
  component: SetupPage,
});

function SetupPage() {
  return (
    <div className="min-h-screen px-5 py-8">
      <div className="mx-auto max-w-5xl">
        <div className="flex items-center justify-between"><Link to="/"><Brand className="text-lg" /></Link><Button asChild variant="ghost" size="sm"><Link to="/dashboard">Back to my page</Link></Button></div>
        <div className="mt-14 max-w-2xl"><p className="text-xs font-semibold uppercase text-primary">About 20 seconds</p><h1 className="mt-3 font-display text-4xl sm:text-5xl">See your links whenever your browser opens.</h1><p className="mt-4 text-muted-foreground">Choose your computer and browser below. Browser security requires you to confirm the change yourself, but these visual steps take you directly through it.</p></div>
        <div className="mt-10 border border-border bg-card p-5 sm:p-8"><LandingPageSetupGuide standalone /></div>
        <div className="mt-6 border border-border p-5 text-sm text-muted-foreground"><strong className="text-foreground">Using the downloaded file?</strong> Save it somewhere permanent, open it, copy its <code className="text-primary">file://</code> address, and use that address in the same steps.</div>
        <LandingAdSlot />
      </div>
    </div>
  );
}