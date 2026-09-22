import { useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Chrome } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

const schema = z.object({
  email: z.string().trim().email("Enter a valid email address").max(255),
  password: z.string().min(6, "Password must be at least 6 characters").max(72),
});

export function AuthPanel({ className }: { className?: string }) {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const parsed = schema.safeParse({ email, password });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Check your details");
      return;
    }
    setBusy(true);
    try {
      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email: parsed.data.email,
          password: parsed.data.password,
          options: { emailRedirectTo: window.location.origin },
        });
        if (error) throw error;
        if (!data.session) {
          setSent(true);
          toast.success("Check your email to confirm your account");
          return;
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword(parsed.data);
        if (error) throw error;
      }
      navigate({ to: "/dashboard" });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  function showGoogleError(error: { message: string }) {
    setBusy(false);
    toast.error(
      error.message.toLowerCase().includes("provider is not enabled")
        ? "Google sign-in isn't switched on yet. Use email for now."
        : "Google sign-in didn't work. Try again.",
    );
  }

  // Google refuses to load its sign-in page inside a frame (e.g. an embedded preview),
  // so when framed we open it in a small window and receive the session back.
  async function handleGooglePopup() {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth?popup=1`, skipBrowserRedirect: true },
    });
    if (error || !data?.url) return showGoogleError(error ?? { message: "" });

    const popup = window.open(data.url, "lpb-google-signin", "width=500,height=650");
    if (!popup) {
      setBusy(false);
      toast.error("Your browser blocked the Google window. Allow pop-ups and try again.");
      return;
    }

    const onMessage = async (event: MessageEvent) => {
      if (event.origin !== window.location.origin || event.source !== popup) return;
      const payload = event.data as { type?: string; access_token?: string; refresh_token?: string };
      if (payload?.type !== "lpb-google-session" || !payload.access_token || !payload.refresh_token) return;
      cleanup();
      const { error: sessionError } = await supabase.auth.setSession({
        access_token: payload.access_token,
        refresh_token: payload.refresh_token,
      });
      if (sessionError) return showGoogleError(sessionError);
      navigate({ to: "/dashboard" });
    };
    const timer = window.setInterval(() => {
      if (popup.closed) { cleanup(); setBusy(false); }
    }, 800);
    function cleanup() {
      window.removeEventListener("message", onMessage);
      window.clearInterval(timer);
    }
    window.addEventListener("message", onMessage);
  }

  async function handleGoogle() {
    setBusy(true);
    if (window.self !== window.top) return handleGooglePopup();
    // Returns to the public /auth page, which forwards signed-in users to /dashboard.
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth` },
    });
    if (error) showGoogleError(error);
  }

  return (
    <div className={cn("border border-border bg-card p-6 shadow-2xl sm:p-8", className)}>
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase text-primary">Your page starts here</p>
          <h2 className="mt-2 font-display text-2xl">
            {mode === "signin" ? "Sign in to your landing page" : "Create your free account"}
          </h2>
        </div>
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md bg-secondary text-primary">
          <Chrome className="h-5 w-5" />
        </span>
      </div>
      <p className="mt-2 text-sm text-muted-foreground">
        {mode === "signin"
          ? "Open the page where all your important links live."
          : "Save your links and use the same landing page on every browser."}
      </p>

      {sent ? (
        <div className="mt-6 border border-primary/40 bg-primary/10 p-4 text-sm">
          We sent a confirmation link to <strong>{email}</strong>. Open it to finish creating your account.
        </div>
      ) : (
        <>
          <Button variant="outline" className="mt-6 w-full" onClick={handleGoogle} disabled={busy}>
            <Chrome className="h-4 w-4" /> Continue with Google
          </Button>
          <div className="my-5 flex items-center gap-3 text-xs text-muted-foreground">
            <span className="h-px flex-1 bg-border" /> or use email <span className="h-px flex-1 bg-border" />
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="auth-email">Email address</Label>
              <Input id="auth-email" type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="auth-password">Password</Label>
              <Input id="auth-password" type="password" autoComplete={mode === "signin" ? "current-password" : "new-password"} value={password} onChange={(event) => setPassword(event.target.value)} placeholder="At least 6 characters" />
            </div>
            <Button type="submit" className="w-full" disabled={busy}>
              {busy ? "Please wait…" : mode === "signin" ? "Sign in and open my page" : "Create my landing page"}
            </Button>
          </form>
          <Button type="button" variant="link" className="mt-4 w-full text-muted-foreground" onClick={() => { setMode(mode === "signin" ? "signup" : "signin"); setSent(false); }}>
            {mode === "signin" ? "New here? Create an account" : "Already have an account? Sign in"}
          </Button>
        </>
      )}
    </div>
  );
}
