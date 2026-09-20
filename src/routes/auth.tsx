import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { AuthPanel } from "@/components/AuthPanel";
import { Brand } from "@/components/Brand";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/auth")({
  head: () => ({ meta: [
    { title: "Sign in — Browser Homepage" },
    { name: "description", content: "Sign in to create and manage your personal browser homepage." },
    { property: "og:title", content: "Sign in — Browser Homepage" },
    { property: "og:description", content: "Sign in to create and manage your personal browser homepage." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
  ] }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  useEffect(() => { supabase.auth.getSession().then(({ data }) => { if (data.session) navigate({ to: "/dashboard", replace: true }); }); }, [navigate]);
  return <div className="min-h-screen px-5 py-8"><div className="mx-auto max-w-5xl"><Link to="/"><Brand className="text-lg" /></Link><div className="mx-auto mt-12 max-w-md"><AuthPanel /></div></div></div>;
}