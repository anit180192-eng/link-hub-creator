import type { CSSProperties } from "react";

export type ColourMode = "light" | "dark" | "system";
// Stable IDs are persisted in the existing text theme field, alongside layout.
// Legacy grid/list values remain readable; no data migration is needed.
export const PAGE_THEMES = [
  ["cobalt", "Cobalt", "#284be0", "#a9bdff", 225],
  ["ocean", "Ocean", "#0369a1", "#7dd3fc", 205],
  ["teal", "Teal", "#0f766e", "#5eead4", 175],
  ["forest", "Forest", "#166534", "#86efac", 145],
  ["sage", "Sage", "#466334", "#bed69c", 95],
  ["mint", "Mint", "#047857", "#6ee7b7", 160],
  ["violet", "Violet", "#6d28d9", "#c4b5fd", 265],
  ["lavender", "Lavender", "#7e22ce", "#d8b4fe", 280],
  ["plum", "Plum", "#86198f", "#f0abfc", 295],
  ["rose", "Rose", "#be123c", "#fda4af", 345],
  ["coral", "Coral", "#b93825", "#ffb4a2", 15],
  ["ruby", "Ruby", "#b91c1c", "#fca5a5", 0],
  ["amber", "Amber", "#92400e", "#fcd34d", 40],
  ["sunflower", "Sunflower", "#854d0e", "#fde047", 50],
  ["terracotta", "Terracotta", "#9a3412", "#fdba74", 25],
  ["coffee", "Coffee", "#714b35", "#dfbea6", 28],
  ["sand", "Sand", "#735b23", "#e3ce97", 45],
  ["slate", "Slate", "#475569", "#cbd5e1", 215],
  ["graphite", "Graphite", "#374151", "#d1d5db", 220],
  ["ice", "Ice", "#155e75", "#a5f3fc", 190],
] as const;

export function readPageTheme(theme: string, dark = true) {
  const [version, layout, preset = "cobalt", mode = "system"] = theme.split(":");
  const valid = version === "v1";
  return {
    layout: (valid ? layout === "list" : theme === "list") ? "list" : "grid",
    preset: valid && PAGE_THEMES.some(t => t[0] === preset) ? preset : "cobalt",
    mode: (valid && ["light", "dark", "system"].includes(mode) ? mode : dark ? "dark" : "light") as ColourMode,
  };
}
export function writePageTheme(value: ReturnType<typeof readPageTheme>) {
  return `v1:${value.layout === "list" ? "list" : "grid"}:${PAGE_THEMES.some(t => t[0] === value.preset) ? value.preset : "cobalt"}:${value.mode}`;
}
export function themeColours(preset: string, dark: boolean) {
  const t = PAGE_THEMES.find(t => t[0] === preset) ?? PAGE_THEMES[0];
  return {
    background: dark ? `hsl(${t[4]} 32% 10%)` : `hsl(${t[4]} 30% 98%)`,
    surface: dark ? `hsl(${t[4]} 29% 15%)` : "#ffffff",
    elevated: dark ? `hsl(${t[4]} 27% 21%)` : `hsl(${t[4]} 35% 94%)`,
    foreground: dark ? "#edf2fc" : "#17243b",
    muted: dark ? "#afbdd3" : "#566378",
    border: dark ? `hsl(${t[4]} 20% 29%)` : `hsl(${t[4]} 20% 86%)`,
    accent: dark ? t[3] : t[2],
  };
}
export function themeStyle(preset: string): CSSProperties {
  return Object.fromEntries((["light", "dark"] as const).flatMap(mode =>
    Object.entries(themeColours(preset, mode === "dark")).map(([key, value]) => [`--theme-${mode}-${key}`, value])
  )) as CSSProperties;
}
