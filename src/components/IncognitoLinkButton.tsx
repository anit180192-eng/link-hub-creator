import { useState } from "react";
import { Glasses } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { normalizeUrl } from "@/lib/startpage";

/** Websites cannot open a private browser window; offer a one-click copy and clear instructions. */
export function IncognitoLinkButton({ url, name, disabled = false }: { url: string; name: string; disabled?: boolean }) {
  const [copied, setCopied] = useState(false);
  return <Dialog onOpenChange={() => setCopied(false)}>
    <DialogTrigger asChild>
      <button type="button" disabled={disabled} onClick={(event) => event.stopPropagation()} aria-label={`Private window instructions for ${name}`} title={`Private window instructions for ${name}`} className="relative z-10 inline-flex shrink-0 items-center rounded p-1 text-hub-muted hover:text-hub-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-hub-accent disabled:opacity-40">
        <Glasses className="size-4" aria-hidden="true" />
      </button>
    </DialogTrigger>
    <DialogContent>
      <DialogHeader><DialogTitle>Open in a private window</DialogTitle><DialogDescription>For privacy, browsers only let you open a private window yourself. Copy this link, open a private window (⌘⇧N on Mac or Ctrl+Shift+N on Windows), then paste it.</DialogDescription></DialogHeader>
      <div className="break-all rounded border p-3 text-sm">{normalizeUrl(url)}</div>
      <Button type="button" onClick={async () => { try { await navigator.clipboard.writeText(normalizeUrl(url)); setCopied(true); } catch { setCopied(false); } }}>{copied ? "Copied" : "Copy link"}</Button>
    </DialogContent>
  </Dialog>;
}
