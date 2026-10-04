import { applyTheme } from "@/lib/theme";
import { ColourModeToggle, useSavedMode } from "@/components/ColourControls";
import { themeStyle, type ColourMode } from "@/lib/page-themes";
import { useEffect, useState, type ReactNode } from "react";
import { Check, Eye, Menu, Pencil, ExternalLink, PanelLeft } from "lucide-react";
import { Brand } from "@/components/Brand";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";

type Props = {
  pagePreset?: string;
  pageMode?: ColourMode;
  tools: ReactNode;
  account: ReactNode;
  profilePicker: ReactNode;
  publishAction: ReactNode;
  tabs: ReactNode;
  guide?: ReactNode;
  children: ReactNode;
  preview: boolean;
  onPreviewChange: (preview: boolean) => void;
  profileName: string;
  published: boolean;
  publicUrl: string;
};

/** Dashboard chrome stays outside the page frame in both edit and preview mode. */
export function BuilderShell({
  pagePreset = "cobalt",
  pageMode = "system",
  tools,
  account,
  profilePicker,
  publishAction,
  tabs,
  guide,
  children,
  preview,
  onPreviewChange,
  profileName,
  published,
  publicUrl,
}: Props) {
  const [colourMode, setColourMode] = useSavedMode("lpb-dashboard-theme");
  useEffect(() => {
    const update = () => applyTheme(colourMode);
    update();
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    media.addEventListener("change", update);
    return () => { media.removeEventListener("change", update); applyTheme(); };
  }, [colourMode]);
  const [navigationOpen, setNavigationOpen] = useState(false);
  const navigation = (
    <>
      <div className="studio-builder-brand border-b border-hub-border px-5 py-6">
        <Brand className="text-sm" />
        <p className="mt-2 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-hub-muted">
          <PanelLeft className="size-3" /> Builder dashboard
        </p>
      </div>
      <div
        className="studio-builder-tools min-h-0 flex-1 overflow-y-auto px-3 py-5"
        onClick={(event) => {
          if ((event.target as HTMLElement).closest("button, a")) setNavigationOpen(false);
        }}
      >
        {tools}
      </div>
      <div className="border-t border-hub-border p-3">{account}</div>
    </>
  );

  return (
    <div className="builder-studio theme-scope flex min-h-screen bg-hub-background text-hub-foreground" data-colour-mode={colourMode} style={themeStyle("cobalt")}>
      <aside
        aria-label="Builder tools"
        className="studio-builder-sidebar sticky top-0 hidden h-dvh w-60 shrink-0 flex-col border-r border-hub-border bg-hub-surface md:flex"
      >
        {navigation}
      </aside>
      <Sheet open={navigationOpen} onOpenChange={setNavigationOpen}>
        <SheetContent
          side="left"
          data-colour-mode={colourMode} style={themeStyle("cobalt")} className="builder-studio studio-builder-navigation theme-scope flex w-72 flex-col gap-0 border-hub-border bg-hub-surface p-0 text-hub-foreground"
        >
          <SheetHeader className="sr-only">
            <SheetTitle>Builder tools</SheetTitle>
            <SheetDescription>Settings for the selected profile and your account.</SheetDescription>
          </SheetHeader>
          {navigation}
        </SheetContent>
      </Sheet>
      <div className="min-w-0 flex-1">
        <header className="studio-builder-toolbar flex min-h-20 flex-wrap items-center justify-between gap-3 border-b border-hub-border px-4 py-4 sm:px-7 lg:px-9">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              aria-label="Open builder tools"
              className="md:hidden"
              onClick={() => setNavigationOpen(true)}
            >
              <Menu />
            </Button>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-hub-muted">
                Dashboard
              </p>
              <h1 className="mt-1 font-display text-lg font-semibold">Page builder</h1>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <ColourModeToggle value={colourMode} onChange={setColourMode} label="Dashboard colour mode" />
            <div
              className="flex rounded-xl border border-hub-border bg-hub-surface p-1"
              role="group"
              aria-label="Page mode"
            >
              <Button
                size="sm"
                variant="ghost"
                aria-pressed={!preview}
                onClick={() => onPreviewChange(false)}
                className={`h-8 rounded-lg px-3 ${!preview ? "bg-hub-elevated text-hub-foreground shadow-sm" : "text-hub-muted"}`}
              >
                <Pencil className="size-3.5" />
                Edit
              </Button>
              <Button
                data-tour="preview"
                size="sm"
                variant="ghost"
                aria-pressed={preview}
                onClick={() => onPreviewChange(true)}
                className={`h-8 rounded-lg px-3 ${preview ? "bg-hub-elevated text-hub-foreground shadow-sm" : "text-hub-muted"}`}
              >
                <Eye className="size-3.5" />
                Preview
              </Button>
            </div>
            {publishAction}
          </div>
        </header>
        <main data-colour-mode={pageMode} style={themeStyle(pagePreset)} className="studio-builder-workspace theme-scope bg-hub-background text-hub-foreground mx-auto w-full max-w-[1680px] px-3 py-5 sm:px-7 sm:py-7 lg:px-9">
          <section
            aria-label="Profile selection"
            className="studio-builder-profile mb-6 flex flex-wrap items-center justify-between gap-3"
          >
            <div className="min-w-0">
              <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-hub-muted">
                {preview ? "Previewing profile" : "You’re editing"}
              </p>
              {profilePicker}
            </div>
            <div className="flex items-center gap-3 text-xs">
              <span
                className={`studio-publish-status inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 ${published ? "border-emerald-400/20 bg-emerald-400/10 text-emerald-300" : "border-hub-border text-hub-muted"}`}
              >
                <span
                  className={`size-1.5 rounded-full ${published ? "bg-emerald-400" : "bg-hub-muted"}`}
                />
                {published ? "Published" : "Not published"}
              </span>
              {published ? (
                <a
                  className="inline-flex items-center gap-1.5 text-hub-muted hover:text-hub-foreground"
                  href={publicUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Open live page
                  <ExternalLink className="size-3.5" />
                </a>
              ) : null}
            </div>
          </section>
          {!preview ? guide : null}
          <section
            aria-label={preview ? "Published-page preview" : "Editable page"}
            className="studio-builder-frame overflow-hidden rounded-2xl border border-hub-border bg-hub-background shadow-[0_16px_60px_rgba(0,0,0,0.2)]"
          >
            <div className="studio-builder-frame-header flex flex-wrap items-center justify-between gap-2 border-b border-hub-border bg-hub-surface px-4 py-3 sm:px-5">
              <div className="flex min-w-0 items-center gap-2.5">
                <span className="grid size-7 shrink-0 place-items-center rounded-lg bg-hub-accent/10 text-hub-accent">
                  {preview ? <Eye className="size-3.5" /> : <PanelLeft className="size-3.5" />}
                </span>
                <div className="min-w-0">
                  <h2 className="truncate text-xs font-semibold">
                    {preview ? "Published-page preview" : "Your page"} · {profileName}
                  </h2>
                  <p className="mt-0.5 text-[11px] text-hub-muted">
                    {preview
                      ? "This is how your page looks to visitors."
                      : "Arrange your content here. Use Preview to see the result."}
                  </p>
                </div>
              </div>
              <span className="inline-flex items-center gap-1.5 text-[10px] text-hub-muted">
                <Check className="size-3" />
                {published ? "Changes save to your live page" : "Changes save automatically"}
              </span>
            </div>
            {!preview ? tabs : null}
            <div data-tour="canvas">{children}</div>
          </section>
          <p className="mt-3 text-center text-[11px] text-hub-muted">
            Builder controls stay here. Your published page shows your profile, tabs and links.
          </p>
        </main>
      </div>
    </div>
  );
}
