import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AuthPanel } from "@/components/AuthPanel";
import { Brand } from "@/components/Brand";
import { ThemeToggle } from "@/components/ThemeToggle";
import { supabase } from "@/integrations/supabase/client";
import { z } from "zod";

export const Route = createFileRoute("/auth")({
  validateSearch: z.object({ mode: z.enum(["signin", "signup"]).optional() }),
  staticData: { sitemap: false },
  head: () => ({ meta: [
    { title: "Sign in — Landing Page Builder" },
    { name: "description", content: "Sign in to create and manage your personal browser landing page." },
    { property: "og:title", content: "Sign in — Landing Page Builder" },
    { property: "og:description", content: "Sign in to create and manage your personal browser landing page." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
  ] }),
  component: AuthPage,
});

function AuthPage() {
  const { mode } = Route.useSearch();
  const navigate = useNavigate();
  const [popupDone, setPopupDone] = useState(false);
  useEffect(() => {
    const isPopup = new URLSearchParams(window.location.search).get("popup") === "1" && !!window.opener;
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) return;
      if (isPopup) {
        // Hand the Google session back to the window that opened this one, then close.
        window.opener.postMessage(
          { type: "lpb-google-session", access_token: data.session.access_token, refresh_token: data.session.refresh_token },
          window.location.origin,
        );
        setPopupDone(true);
        window.setTimeout(() => window.close(), 300);
        return;
      }
      navigate({ to: "/dashboard", replace: true });
    });
  }, [navigate]);
  if (popupDone) {
    return <div className="flex min-h-screen items-center justify-center px-5 text-center"><div><Brand className="text-lg" /><p className="mt-4 text-sm text-muted-foreground">You're signed in. You can close this window.</p></div></div>;
  }
  return <div className="min-h-screen px-5 py-8"><div className="mx-auto max-w-5xl"><div className="flex items-center justify-between gap-3"><Link to="/"><Brand className="text-lg" /></Link><ThemeToggle /></div><div className="mx-auto mt-12 max-w-md"><AuthPanel key={mode} initialMode={mode ?? "signin"} /></div></div></div>;
}