import { useEffect, useState } from "react";
import { clockParts, type StartPageClock } from "@/lib/startpage";

export function WorldClocks({
  clocks,
  dark,
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

  const cardCls = dark ? "bg-card border-border" : "bg-white border-[#e4e4dd]";
  const mutedCls = dark ? "text-muted-foreground" : "text-[#61656b]";

  return (
    <div className={`mb-8 flex flex-wrap justify-center gap-2.5 ${compact ? "mb-6" : ""}`}>
      {clocks.map((clock) => {
        const parts = now ? clockParts(clock.tz, now) : { time: "--:--", day: "" };
        return (
          <div
            key={`${clock.tz}-${clock.label}`}
            className={`min-w-[118px] rounded-[14px] border px-4 py-2.5 text-center ${cardCls}`}
          >
            <span className={`block text-[11px] uppercase tracking-[0.12em] ${mutedCls}`}>
              {clock.label}
            </span>
            <span className="block text-[22px] font-semibold tabular-nums">{parts.time}</span>
            <span className={`block text-[11px] ${mutedCls}`}>{parts.day}</span>
          </div>
        );
      })}
    </div>
  );
}
