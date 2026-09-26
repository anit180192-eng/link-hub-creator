import { useEffect, useState } from "react";
import { Download, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export function ExtensionImportDialog({ open, onOpenChange, canUseChromeStore, canImport, onImport }: {
  open: boolean; onOpenChange: (open: boolean) => void; canUseChromeStore: boolean;
  canImport: boolean; onImport: () => void;
}) {
  const [status, setStatus] = useState<"checking" | "detected" | "unknown">("checking");
  const [manual, setManual] = useState(false);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    if (!open) return;
    setStatus("checking");
    setManual(false);
    const requestId = crypto.randomUUID();
    const receive = (event: MessageEvent) => {
      if (event.source !== window || event.origin !== window.location.origin ||
          event.data?.type !== "LPB_EXTENSION_PRESENT" || event.data.protocol !== 1 ||
          event.data.requestId !== requestId) return;
      setStatus("detected");
      window.clearTimeout(timeout);
    };
    window.addEventListener("message", receive);
    const ping = () => window.postMessage({ type: "LPB_EXTENSION_CHECK", protocol: 1, requestId }, window.location.origin);
    const timeout = window.setTimeout(() => setStatus("unknown"), 2200);
    const retry = window.setTimeout(ping, 700);
    ping();
    return () => { window.removeEventListener("message", receive); window.clearTimeout(timeout); window.clearTimeout(retry); };
  }, [open, attempt]);
  const installed = status === "detected" || manual;
  return <Dialog open={open} onOpenChange={onOpenChange}><DialogContent>
    <DialogHeader><DialogTitle>Import bookmarks</DialogTitle><DialogDescription>
      {installed ? "Use the extension from your browser toolbar." : "Bring your saved websites into this profile, or save a website while you browse."}
    </DialogDescription></DialogHeader>
    <p role="status" className="text-sm text-muted-foreground">{status === "detected" ? "Extension detected in this browser." : manual ? "Showing instructions for your installed extension." : status === "checking" ? "Checking for the extension…" : "Extension not detected. Older versions, disabled extensions or restricted site access may not respond."}</p>
    {installed ? <div className="space-y-3 text-sm text-muted-foreground">
      <ol className="list-decimal space-y-2 pl-5">
        <li>Keep this dashboard open and signed in.</li>
        <li>Click your browser’s Extensions puzzle icon, then Landing Page Builder. Pin it for easier access next time.</li>
        <li>If your version has <strong>Import all bookmarks</strong>, click it while this dashboard is the active tab and wait for the confirmation.</li>
        <li>To save a single page, open that website and choose <strong>Save current website</strong> in the extension, then choose its destination in the builder.</li>
      </ol>
      <p>If your version has no import button, use Import from a file below. If you just installed or enabled the extension, refresh this dashboard.</p>
    </div> : status === "unknown" ? <div className="space-y-3 text-sm text-muted-foreground">
      <p>{canUseChromeStore ? "If you don’t have it yet, install it from the Chrome Web Store, then refresh this dashboard." : "The extension needs desktop Chrome or a compatible browser. On Safari, Firefox or mobile, import an HTML bookmarks file exported from a desktop browser."}</p>
      <Button variant="outline" onClick={() => setManual(true)}>I already have it — show me the steps</Button>
    </div> : null}
    {!canImport ? <p className="text-sm text-muted-foreground">Your profile has reached its tab limit. Remove a tab before importing a file.</p> : null}
    <div className="flex flex-wrap gap-2">
      {!installed && status === "unknown" ? <Button asChild variant={canUseChromeStore ? "default" : "outline"}><a href="https://chromewebstore.google.com/detail/cgbpomcaomohgkboedipghgiojcjkmdk" target="_blank" rel="noopener noreferrer"><ExternalLink />{canUseChromeStore ? "Get Chrome extension" : "View Chrome Web Store listing"}</a></Button> : null}
      <Button disabled={!canImport} variant="outline" onClick={onImport}><Download />Import from a file</Button>
      {status !== "checking" ? <Button variant="ghost" onClick={() => setAttempt(n => n + 1)}>Check again</Button> : null}
    </div>
  </DialogContent></Dialog>;
}
