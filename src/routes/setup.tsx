import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/setup")({
  head: () => ({
    meta: [
      { title: "Make it your homepage — AntLabs" },
      {
        name: "description",
        content:
          "Step-by-step instructions for setting your AntLabs start page as the homepage in Chrome, Safari, Edge and Firefox.",
      },
      { property: "og:title", content: "Make it your homepage — AntLabs" },
      {
        property: "og:description",
        content: "Set your AntLabs start page as the homepage in Chrome, Safari, Edge and Firefox.",
      },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: SetupPage,
});

const GUIDES = [
  {
    browser: "Chrome",
    steps: [
      "Open Settings, then 'On startup'.",
      "Choose 'Open a specific page or set of pages' and click 'Add a new page'.",
      "Paste your start page link and save.",
      "For the home button: Settings → Appearance → Show home button → paste the link.",
    ],
  },
  {
    browser: "Safari",
    steps: [
      "Open Safari → Settings → General.",
      "Set 'Safari opens with' to 'A new window'.",
      "Paste your link in the 'Homepage' field.",
      "Set 'New windows open with' and 'New tabs open with' to 'Homepage'.",
    ],
  },
  {
    browser: "Edge",
    steps: [
      "Open Settings → Start, home, and new tabs.",
      "Choose 'Open these pages' and click 'Add a new page'.",
      "Paste your start page link and save.",
    ],
  },
  {
    browser: "Firefox",
    steps: [
      "Open Settings → Home.",
      "Set 'Homepage and new windows' to 'Custom URLs'.",
      "Paste your start page link.",
      "Set 'New tabs' to 'Custom URLs' too if you want it on every tab.",
    ],
  },
];

function SetupPage() {
  return (
    <div className="min-h-screen px-5 py-16">
      <div className="mx-auto max-w-2xl">
        <Link to="/" className="font-display text-lg font-bold tracking-tight">
          Ant<span className="text-primary">Labs</span>
        </Link>
        <h1 className="mt-8 font-display text-3xl tracking-tight">Make it your homepage</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Browsers don't let a website set itself as your homepage, so it takes about twenty
          seconds. Copy your start page link from the dashboard, then follow your browser below.
        </p>

        <div className="mt-10 space-y-4">
          {GUIDES.map((guide) => (
            <div key={guide.browser} className="rounded-xl border border-border bg-card p-5">
              <h2 className="font-display text-lg">{guide.browser}</h2>
              <ol className="mt-3 list-decimal space-y-1.5 pl-5 text-sm text-muted-foreground">
                {guide.steps.map((step) => (
                  <li key={step}>{step}</li>
                ))}
              </ol>
            </div>
          ))}
        </div>

        <div className="mt-8 rounded-xl border border-border bg-card p-5 text-sm text-muted-foreground">
          <strong className="text-foreground">Using the downloaded file instead?</strong> Save it
          somewhere permanent, open it in your browser, then copy the address from the address bar
          (it starts with <code className="text-primary">file://</code>) and use it in the steps
          above.
        </div>

        <Link to="/dashboard" className="mt-8 inline-block text-sm text-primary underline">
          Back to your dashboard
        </Link>
      </div>
    </div>
  );
}
