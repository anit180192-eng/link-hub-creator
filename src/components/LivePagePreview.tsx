import { useState } from "react";
import { Maximize2, Monitor, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { StartPageView } from "@/components/StartPageView";
import type { StartPageLink, StartPageProfile } from "@/lib/startpage";

type PreviewDevice = "desktop" | "mobile";

export function LivePagePreview({
  profile,
  links,
}: {
  profile: StartPageProfile;
  links: StartPageLink[];
}) {
  const [device, setDevice] = useState<PreviewDevice>("desktop");
  const [expanded, setExpanded] = useState(false);

  return (
    <>
      <div className="overflow-hidden rounded-lg border border-border bg-card shadow-sm">
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 border-b border-border px-3 py-2">
          <div className="flex min-w-0 items-center gap-2">
            <span className="size-2 shrink-0 rounded-full bg-primary" aria-hidden="true" />
            <span className="truncate text-xs font-medium text-muted-foreground">Live page</span>
          </div>
          <div className="flex shrink-0 items-center gap-1">
            <Button
              type="button"
              variant={device === "desktop" ? "secondary" : "ghost"}
              size="icon"
              className="size-8"
              onClick={() => setDevice("desktop")}
              aria-label="Desktop preview"
              title="Desktop preview"
            >
              <Monitor />
            </Button>
            <Button
              type="button"
              variant={device === "mobile" ? "secondary" : "ghost"}
              size="icon"
              className="size-8"
              onClick={() => setDevice("mobile")}
              aria-label="Mobile preview"
              title="Mobile preview"
            >
              <Smartphone />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-8"
              onClick={() => setExpanded(true)}
              aria-label="Expand preview"
              title="Expand preview"
            >
              <Maximize2 />
            </Button>
          </div>
        </div>

        <div className={`page-preview-stage page-preview-stage--${device}`}>
          <div className={`page-preview-canvas page-preview-canvas--${device}`}>
            <StartPageView profile={profile} links={links} />
          </div>
        </div>
      </div>

      <Dialog open={expanded} onOpenChange={setExpanded}>
        <DialogContent className="h-[92vh] max-w-[94vw] overflow-hidden p-0">
          <DialogHeader className="border-b border-border px-5 py-4">
            <DialogTitle>Your landing page</DialogTitle>
            <DialogDescription>Live preview of the page your visitors will see.</DialogDescription>
          </DialogHeader>
          <div className="overflow-auto bg-hub-background">
            <StartPageView profile={profile} links={links} />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}