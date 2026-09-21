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
    <div
      className={`grid grid-cols-2 border-b border-hub-border sm:flex sm:flex-wrap ${compact ? "" : "lg:grid lg:grid-cols-3"}`}
      aria-label="World clocks"
    >
      {clocks.map((clock) => {
        const parts = now ? clockParts(clock.tz, now) : { time: "--:--", day: "" };
        return (
          <div
            key={`${clock.tz}-${clock.label}`}
            className="min-w-[118px] border-r border-hub-border px-5 py-4 last:border-r-0 sm:flex-1 lg:px-6"
          >
            <span className="block text-[10px] font-semibold uppercase text-hub-muted">
              {clock.label}
            </span>
            <span className="mt-1 block font-display text-xl font-medium tabular-nums text-hub-foreground">
              {parts.time}
            </span>
            <span className="block text-[10px] text-hub-muted">{parts.day}</span>
          </div>
        );
      })}
    </div>
  );
}
