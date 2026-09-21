import { useEffect, useState } from "react";
import { Apple, Check, Copy, Laptop, Monitor, Settings2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const GUIDES = {
  chrome: { name: "Chrome", path: "Settings → On startup", steps: ["Open Chrome Settings.", "Choose On startup.", "Select Open a specific page.", "Paste your landing page link and save."] },
  edge: { name: "Edge", path: "Settings → Start, home, and new tabs", steps: ["Open Edge Settings.", "Choose Start, home, and new tabs.", "Select Open these pages.", "Add your landing page link."] },
  safari: { name: "Safari", path: "Safari → Settings → General", steps: ["Open Safari Settings.", "Choose General.", "Paste your link in Homepage.", "Set new windows and tabs to Homepage."] },
  firefox: { name: "Firefox", path: "Settings → Home", steps: ["Open Firefox Settings.", "Choose Home.", "Select Custom URLs.", "Paste your landing page link."] },
} as const;

type Browser = keyof typeof GUIDES;
type OS = "windows" | "mac";

function detectOS(): OS {
  if (typeof navigator === "undefined") return "windows";
  return /Mac|iPhone|iPad/i.test(navigator.userAgent) ? "mac" : "windows";
}

function detectBrowser(): Browser {
  if (typeof navigator === "undefined") return "chrome";
  const agent = navigator.userAgent;
  if (/Edg/i.test(agent)) return "edge";
  if (/Firefox/i.test(agent)) return "firefox";
  if (/Safari/i.test(agent) && !/Chrome|Chromium/i.test(agent)) return "safari";
  return "chrome";
}

export function LandingPageSetupGuide({
  triggerLabel = "Set as my landing page",
  standalone = false,
  url,
}: {
  triggerLabel?: string;
  standalone?: boolean;
  url?: string;
}) {
  const [os, setOS] = useState<OS>("windows");
  const [browser, setBrowser] = useState<Browser>("chrome");

  useEffect(() => {
    setOS(detectOS());
    setBrowser(detectBrowser());
  }, []);

  const guide = GUIDES[browser];
  const content = (
    <div className="mt-5">
      {url ? (
        <div className="mb-5 rounded-lg border border-border bg-muted/40 p-4">
          <p className="text-xs font-semibold uppercase text-primary">Your link</p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <code className="min-w-0 flex-1 truncate text-xs text-foreground">{url}</code>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => navigator.clipboard.writeText(url)}
            >
              <Copy className="mr-1 h-4 w-4" /> Copy link
            </Button>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            Paste this into the setting below so your browser opens your own page.
          </p>
        </div>
      ) : null}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4">
        <div className="flex rounded-md bg-muted p-1" aria-label="Operating system">
          <Button size="sm" variant={os === "windows" ? "secondary" : "ghost"} onClick={() => setOS("windows")}><Monitor /> Windows</Button>
          <Button size="sm" variant={os === "mac" ? "secondary" : "ghost"} onClick={() => setOS("mac")}><Apple /> Mac</Button>
        </div>
        <p className="text-xs text-muted-foreground">Detected: {os === "mac" ? "Mac" : "Windows"}</p>
      </div>
      <Tabs value={browser} onValueChange={(value) => setBrowser(value as Browser)} className="mt-5">
        <TabsList className="grid h-auto w-full grid-cols-2 gap-1 sm:grid-cols-4">
          {Object.entries(GUIDES).map(([key, item]) => <TabsTrigger key={key} value={key}>{item.name}</TabsTrigger>)}
        </TabsList>
        {Object.entries(GUIDES).map(([key, item]) => (
          <TabsContent key={key} value={key} className="mt-5">
            <div className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
              <div className="border border-border bg-muted/40 p-5">
                <div className="flex items-center gap-2 text-xs font-semibold uppercase text-primary"><Settings2 className="h-4 w-4" /> Open this setting</div>
                <p className="mt-3 font-display text-lg">{item.path}</p>
                <div className="mt-5 space-y-2">
                  <div className="h-7 w-2/3 rounded-md bg-secondary" />
                  <div className="border border-primary bg-background p-3">
                    <div className="flex items-center gap-2 text-xs"><span className="h-3 w-3 rounded-full border-4 border-primary" /> Open a specific page</div>
                    <div className="mt-3 flex h-8 items-center justify-between border border-border bg-card px-2 text-[10px] text-muted-foreground"><span className="truncate">{url ?? "your-landing-page-link"}</span><Check className="h-3 w-3 text-primary" /></div>
                  </div>
                  <div className="h-7 w-1/2 rounded-md bg-secondary" />
                </div>
              </div>
              <ol className="space-y-3">
                {item.steps.map((step, index) => (
                  <li key={step} className="flex gap-3 border-b border-border pb-3 text-sm last:border-0">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">{index + 1}</span>
                    <span className="pt-0.5">{step}</span>
                  </li>
                ))}
              </ol>
            </div>
            <div className="mt-5 flex items-start gap-3 bg-secondary p-4 text-sm text-secondary-foreground">
              <Laptop className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              <p>For security, {guide.name} requires this final confirmation. A website cannot change your landing page automatically.</p>
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );

  if (standalone) return content;
  return (
    <Dialog>
      <DialogTrigger asChild><Button size="lg" variant="outline"><Copy /> {triggerLabel}</Button></DialogTrigger>
      <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
        <DialogHeader><DialogTitle className="font-display text-2xl">Make your landing page open automatically</DialogTitle><DialogDescription>We found your device. Choose your browser for the exact steps.</DialogDescription></DialogHeader>
        {content}
      </DialogContent>
    </Dialog>
  );
}
