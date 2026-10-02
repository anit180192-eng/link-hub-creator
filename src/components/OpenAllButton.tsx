import { useState } from "react";
import { ExternalLink } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { eligibleUrls, hostOf, linkCountLabel, openUrls } from "@/lib/startpage";

/** Opens every eligible link from a direct click; explains and offers a manual retry if the browser blocks some. */
export function OpenAllButton({
  urls,
  scope,
  className,
}: {
  urls: string[];
  scope: string;
  className?: string;
}) {
  const [failed, setFailed] = useState<string[]>([]);
  const list = eligibleUrls(urls);
  if (!list.length) return null;
  const run = (targets: string[]) => {
    const { failed: f } = openUrls(targets);
    setFailed(f);
  };
  return (
    <>
      <button
        type="button"
        onClick={() => run(list)}
        aria-label={`Open all ${linkCountLabel(list.length)} in ${scope}`}
        title={`Open all ${linkCountLabel(list.length)} in new tabs`}
        className={cn(
          "inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-semibold text-hub-accent transition-colors hover:bg-hub-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-hub-accent",
          className,
        )}
      >
        <ExternalLink className="size-3.5" aria-hidden="true" /> Open all
      </button>
      <Dialog open={failed.length > 0} onOpenChange={(o) => !o && setFailed([])}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {failed.length === 1 ? "1 link didn't open" : `${failed.length} links didn't open`}
            </DialogTitle>
            <DialogDescription>
              Your browser blocked some new tabs. To allow them, click the blocked pop-up icon in
              the address bar and choose to always allow pop-ups from this site (or add this site
              in your browser's pop-up settings). Then press Retry. Links that already opened
              won't open again. You can also open each one below.
            </DialogDescription>
          </DialogHeader>
          <ul className="max-h-56 space-y-1 overflow-auto text-sm">
            {failed.map((u) => (
              <li key={u}>
                <a
                  href={u}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary underline"
                >
                  Open {hostOf(u)}
                </a>
              </li>
            ))}
          </ul>
          <DialogFooter>
            <button
              type="button"
              onClick={() => setFailed([])}
              className="rounded-md border border-border px-3 py-2 text-sm"
            >
              Close
            </button>
            <button
              type="button"
              onClick={() => run(failed)}
              className="rounded-md bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground"
            >
              Retry {failed.length === 1 ? "1 link" : `${failed.length} links`}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
