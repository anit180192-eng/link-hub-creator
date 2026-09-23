import { useSyncExternalStore } from "react";

export type ThemeChoice = "light" | "dark" | "system";

const STORAGE_KEY = "lpb-theme";
const listeners = new Set<() => void>();

function readChoice(): ThemeChoice {
  try {
    const value = window.localStorage.getItem(STORAGE_KEY);
    if (value === "light" || value === "dark" || value === "system") return value;
  } catch {
    // Storage can be blocked (private mode, embedded frames) — fall back to system.
  }
  return "system";
}

function systemPrefersDark() {
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

/** Adds or removes the `dark` class on <html> to match the saved choice. */
export function applyTheme(choice: ThemeChoice = readChoice()) {
  const dark = choice === "dark" || (choice === "system" && systemPrefersDark());
  const root = document.documentElement;
  root.classList.toggle("dark", dark);
  root.style.colorScheme = dark ? "dark" : "light";
}

export function setThemeChoice(choice: ThemeChoice) {
  try {
    window.localStorage.setItem(STORAGE_KEY, choice);
  } catch {
    // Ignore — the theme still applies for this visit.
  }
  applyTheme(choice);
  listeners.forEach((listener) => listener());
}

/** Keeps the page in sync when the device switches between light and dark. */
export function watchSystemTheme() {
  const media = window.matchMedia("(prefers-color-scheme: dark)");
  const onChange = () => {
    if (readChoice() === "system") applyTheme("system");
  };
  const onStorage = (event: StorageEvent) => {
    if (event.key !== STORAGE_KEY) return;
    applyTheme();
    listeners.forEach((listener) => listener());
  };
  media.addEventListener("change", onChange);
  window.addEventListener("storage", onStorage);
  return () => {
    media.removeEventListener("change", onChange);
    window.removeEventListener("storage", onStorage);
  };
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useThemeChoice(): ThemeChoice {
  return useSyncExternalStore(subscribe, readChoice, () => "system");
}

/** Runs in <head> before the page paints, so there is no flash of the wrong theme. */
export const THEME_INIT_SCRIPT = `(function(){try{var t=localStorage.getItem('${STORAGE_KEY}');var d=t==='dark'||(t!=='light'&&window.matchMedia('(prefers-color-scheme: dark)').matches);var r=document.documentElement;if(d){r.classList.add('dark')}else{r.classList.remove('dark')}r.style.colorScheme=d?'dark':'light';}catch(e){}})();`;
