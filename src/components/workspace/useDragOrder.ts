import { useEffect, useRef, useState, type PointerEvent } from "react";
import { moveItem } from "@/lib/reorder";

// Pointer capture supports both mouse and touch without interfering with native link dragging.
export function useDragOrder(
  ids: string[],
  scope: string,
  disabled: boolean,
  save: (ids: string[]) => void,
) {
  const source = useRef<{
    id: string;
    scope: string;
    x: number;
    y: number;
    moved: boolean;
  } | null>(null);
  const [over, setOver] = useState<string | null>(null);
  const clear = () => {
    source.current = null;
    setOver(null);
  };
  useEffect(() => {
    source.current = null;
    setOver(null);
  }, [scope, disabled]);
  const targetAt = (x: number, y: number) => {
    const target = document
      .elementFromPoint(x, y)
      ?.closest<HTMLElement>("[data-order-id]");
    const id = target?.getAttribute("data-order-id");
    return target?.getAttribute("data-order-scope") === scope &&
      id &&
      ids.includes(id)
      ? id
      : null;
  };
  const active = () =>
    !disabled &&
    source.current?.scope === scope &&
    ids.includes(source.current.id);
  return {
    over,
    handleProps: (id: string) => ({
      style: { touchAction: "none", userSelect: "none" } as const,
      onPointerDown: (e: PointerEvent<HTMLButtonElement>) => {
        if (disabled || ids.length < 2 || e.button !== 0) return;
        source.current = {
          id,
          scope,
          x: e.clientX,
          y: e.clientY,
          moved: false,
        };
        e.currentTarget.setPointerCapture(e.pointerId);
      },
      onPointerMove: (e: PointerEvent<HTMLButtonElement>) => {
        if (!active()) return;
        const start = source.current!;
        if (
          !start.moved &&
          Math.hypot(e.clientX - start.x, e.clientY - start.y) < 6
        )
          return;
        start.moved = true;
        setOver(targetAt(e.clientX, e.clientY));
        if (e.clientY < 60) window.scrollBy(0, -18);
        else if (e.clientY > window.innerHeight - 60) window.scrollBy(0, 18);
      },
      onPointerUp: (e: PointerEvent<HTMLButtonElement>) => {
        const target =
          active() && source.current?.moved
            ? targetAt(e.clientX, e.clientY)
            : null;
        const next = target
          ? moveItem(ids, ids.indexOf(source.current!.id), ids.indexOf(target))
          : ids;
        clear();
        if (e.currentTarget.hasPointerCapture(e.pointerId))
          e.currentTarget.releasePointerCapture(e.pointerId);
        if (next !== ids) save(next);
      },
      onPointerCancel: clear,
      onLostPointerCapture: clear,
    }),
    targetProps: (id: string) => ({
      "data-order-id": id,
      "data-order-scope": scope,
    }),
  };
}
