import { useEffect, useState } from "react";
import { clockParts, type StartPageClock } from "@/lib/startpage";

export function WorldClocks({
  clocks,
  compact = false,
}: {
  clocks: StartPageClock[];
  dark: boolean;
  compact?: boolean;
}) {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), 15000);
    return () => clearInterval(id);
  }, []);

  if (!clocks.length) return null;

  return (
    <div className="rounded-lg border border-hub-border bg-hub-surface p-4" aria-label="World clocks">
      <div className="mb-3 flex items-center justify-between">
        <span className="text-[10px] font-semibold uppercase text-hub-muted">World time</span>
        <span className="flex items-center gap-1.5 text-[10px] text-hub-muted">
          <span className="h-1.5 w-1.5 rounded-full bg-hub-accent" aria-hidden="true" /> Live
        </span>
      </div>
      <div className={compact ? "grid grid-cols-2 gap-x-4" : "divide-y divide-hub-border"}>
        {clocks.map((clock) => {
          const parts = now ? clockParts(clock.tz, now) : { time: "--:--", day: "" };
          return (
            <div key={`${clock.tz}-${clock.label}`} className="flex min-h-11 items-center justify-between gap-3 py-2">
              <span className="min-w-0">
                <span className="block truncate text-xs font-medium text-hub-foreground">{clock.label}</span>
                <span className="block text-[10px] text-hub-muted">{parts.day}</span>
              </span>
              <span className="font-display text-base font-semibold tabular-nums text-hub-foreground">{parts.time}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
