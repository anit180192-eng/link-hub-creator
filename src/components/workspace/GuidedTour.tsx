import { useEffect, useState } from "react";
import { ArrowLeft, ArrowRight, Check } from "lucide-react";
import { Button } from "@/components/ui/button";

export type TourStep = {
  selector: string;
  title: string;
  description: string;
};

type TargetBox = { top: number; left: number; width: number; height: number };

export function GuidedTour({
  open,
  steps,
  onComplete,
}: {
  open: boolean;
  steps: TourStep[];
  onComplete: () => void;
}) {
  const [available, setAvailable] = useState<TourStep[]>([]);
  const [index, setIndex] = useState(0);
  const [box, setBox] = useState<TargetBox | null>(null);
  const step = available[index];

  useEffect(() => {
    if (!open) {
      setAvailable([]);
      setBox(null);
      return;
    }
    setAvailable(
      steps.filter((item) => {
        const target = document.querySelector<HTMLElement>(item.selector);
        return target && target.offsetParent !== null;
      }),
    );
    setIndex(0);
  }, [open, steps]);

  useEffect(() => {
    if (!open || !step) return;
    const update = () => {
      const target = document.querySelector<HTMLElement>(step.selector);
      if (!target) return;
      target.scrollIntoView({ block: "nearest", inline: "nearest" });
      const rect = target.getBoundingClientRect();
      setBox({ top: rect.top - 6, left: rect.left - 6, width: rect.width + 12, height: rect.height + 12 });
    };
    update();
    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, true);
    return () => {
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update, true);
    };
  }, [open, step]);

  if (!open || !step || !box) return null;
  const placeBelow = box.top + box.height + 230 < window.innerHeight;

  return (
    <div className="fixed inset-0 z-[100]" role="dialog" aria-modal="true" aria-label="Builder guided tour">
      <div
        className="pointer-events-none fixed rounded-md ring-2 ring-hub-accent shadow-[0_0_0_9999px_oklch(0.08_0.02_240/0.78)] transition-all duration-200"
        style={{ top: box.top, left: box.left, width: box.width, height: box.height }}
      />
      <section
        className="fixed left-3 right-3 z-[101] max-w-sm rounded-md border border-hub-accent bg-hub-surface p-4 text-hub-foreground shadow-xl sm:left-auto"
        style={{
          top: placeBelow ? Math.min(box.top + box.height + 14, window.innerHeight - 220) : undefined,
          bottom: placeBelow ? undefined : Math.max(window.innerHeight - box.top + 14, 12),
          right: Math.max(12, Math.min(window.innerWidth - box.left - box.width, window.innerWidth - 396)),
        }}
      >
        <div className="flex items-center justify-between gap-3">
          <p className="text-[11px] font-semibold uppercase text-hub-accent">Step {index + 1} of {available.length}</p>
          <Button variant="ghost" size="sm" className="h-7 px-2 text-xs text-hub-muted" onClick={onComplete}>Skip tour</Button>
        </div>
        <h2 className="mt-2 font-display text-lg font-semibold">{step.title}</h2>
        <p className="mt-1 text-sm leading-6 text-hub-muted">{step.description}</p>
        <div className="mt-4 flex items-center justify-between gap-2">
          <Button variant="outline" size="sm" className="border-hub-border" disabled={index === 0} onClick={() => setIndex((value) => value - 1)}>
            <ArrowLeft />Back
          </Button>
          {index === available.length - 1 ? (
            <Button size="sm" onClick={onComplete}><Check />Finish</Button>
          ) : (
            <Button size="sm" onClick={() => setIndex((value) => value + 1)}>Next<ArrowRight /></Button>
          )}
        </div>
      </section>
    </div>
  );
}