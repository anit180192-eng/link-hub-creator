import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { getPublicPaddleConfig } from "@/lib/billing.functions";
import { isTransactionId } from "@/lib/paddle";
import { loadPaddle } from "@/lib/paddleClient";

export const Route = createFileRoute("/pay")({
  staticData: { sitemap: false },
  validateSearch: (s: Record<string, unknown>) => ({ _ptxn: typeof s._ptxn === "string" ? s._ptxn : undefined }),
  loader: () => getPublicPaddleConfig(),
  head: () => ({
    meta: [
      { title: "Secure payment — Landing Page Builder" },
      { name: "description", content: "Complete or update your Landing Page Builder Premium payment securely with Paddle." },
      { name: "robots", content: "noindex" },
      { property: "og:title", content: "Secure payment — Landing Page Builder" },
      { property: "og:description", content: "Complete or update your Landing Page Builder Premium payment securely with Paddle." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  errorComponent: () => <PayShell>Payment page couldn't load. Please try the link again later.</PayShell>,
  notFoundComponent: () => <PayShell>Page not found.</PayShell>,
  component: PayPage,
});

function PayShell({ children }: { children: React.ReactNode }) {
  return (
    <main className="grid min-h-screen place-items-center bg-background px-5 text-foreground">
      <div className="max-w-md text-center">
        <h1 className="font-display text-2xl">Landing Page Builder</h1>
        <div className="mt-3 text-sm text-muted-foreground">{children}</div>
        <Link to="/" className="mt-6 inline-block text-sm text-primary underline">Back to home</Link>
      </div>
    </main>
  );
}

function PayPage() {
  const cfg = Route.useLoaderData();
  const { _ptxn } = Route.useSearch();
  const valid = isTransactionId(_ptxn);
  const [state, setState] = useState<"loading" | "open" | "done" | "error">("loading");

  useEffect(() => {
    if (!cfg.clientToken || !valid) return;
    loadPaddle(cfg.environment, cfg.clientToken, (e) => {
      if (e?.name === "checkout.loaded") setState("open");
      if (e?.name === "checkout.completed") setState("done");
    }).catch(() => setState("error"));
  }, [cfg.clientToken, cfg.environment, valid]);

  if (!cfg.clientToken) return <PayShell>Payments aren't available yet.</PayShell>;
  if (!valid) return <PayShell>This payment link is missing or invalid. Open the link from your Paddle email or the builder again.</PayShell>;
  if (state === "error") return <PayShell>Checkout couldn't load. Check your connection and reload this page.</PayShell>;
  if (state === "done") return <PayShell>Payment received — thank you. Your account updates within a minute.</PayShell>;
  return <PayShell>{state === "open" ? "Complete your payment in the secure Paddle window." : "Opening secure checkout…"}{cfg.environment === "sandbox" ? " (Test mode — no real charges.)" : ""}</PayShell>;
}
