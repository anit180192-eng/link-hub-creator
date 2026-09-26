import { useEffect, useState } from "react";
import { Sun, Moon, Monitor } from "lucide-react";
import { PAGE_THEMES, type ColourMode } from "@/lib/page-themes";

export function useSavedMode(key: string | null, fallback: ColourMode = "system") {
  const [mode, setMode] = useState<ColourMode>(fallback);
  useEffect(() => {
    const read = () => {
    let value: string | null = null;
    try { value = key ? localStorage.getItem(key) : null; } catch { /* Storage is optional. */ }
    setMode(value === "light" || value === "dark" || value === "system" ? value : fallback);
    };
    read();
    if (!key) return;
    window.addEventListener("storage", read);
    window.addEventListener("lpb-colour-mode", read);
    return () => { window.removeEventListener("storage", read); window.removeEventListener("lpb-colour-mode", read); };
  }, [key, fallback]);
  return [mode, (value: ColourMode) => {
    setMode(value);
    try { if (key) { localStorage.setItem(key, value); window.dispatchEvent(new Event("lpb-colour-mode")); } } catch { /* Keep it for this visit. */ }
  }] as const;
}
export function ColourModeToggle({ value, onChange, label = "Colour mode" }: { value: ColourMode; onChange: (mode: ColourMode) => void; label?: string }) {
  return <div role="group" aria-label={label} className="colour-mode-toggle">
    {([["light", Sun], ["dark", Moon], ["system", Monitor]] as const).map(([mode, Icon]) =>
      <button type="button" key={mode} aria-pressed={value === mode} aria-label={`${mode} mode`} title={mode === "system" ? "Match system" : mode} onClick={() => onChange(mode)}>
        <Icon size={14} aria-hidden="true" /><span>{mode}</span>
      </button>)}
  </div>;
}
export function ThemePresets({ value, onChange }: { value: string; onChange: (preset: string) => void }) {
  return <div className="grid grid-cols-2 gap-2" role="group" aria-label="20 page colour themes">
    {PAGE_THEMES.map(([id, name, light, dark]) => <button type="button" key={id} aria-pressed={value === id} onClick={() => onChange(id)} className="flex items-center gap-2 rounded-lg border border-hub-border bg-hub-surface p-3 text-left text-xs aria-pressed:ring-2 aria-pressed:ring-hub-accent">
      <span aria-hidden="true" className="flex overflow-hidden rounded-full border border-hub-border"><i style={{background:light}} className="size-4"/><i style={{background:dark}} className="size-4"/></span>{name}{value === id ? " ✓" : ""}
    </button>)}
  </div>;
}
