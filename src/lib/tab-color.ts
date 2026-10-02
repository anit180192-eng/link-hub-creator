import type { CSSProperties } from "react";

export const TAB_COLORS = ["#f8c8d8", "#f6d99b", "#d9edaa", "#a8dfe0", "#b9cafa", "#dec6f5", "#efbba5"];

export function tabColorStyle(color?: string | null): CSSProperties | undefined {
  if (!color || !/^#[0-9a-f]{6}$/i.test(color)) return undefined;
  const rgb = [1, 3, 5].map((i) => parseInt(color.slice(i, i + 2), 16));
  const light = ((rgb[0] ?? 0) * 299 + (rgb[1] ?? 0) * 587 + (rgb[2] ?? 0) * 114) / 1000 > 150;
  return { backgroundColor: color, color: light ? "#172033" : "#ffffff", borderColor: color };
}
