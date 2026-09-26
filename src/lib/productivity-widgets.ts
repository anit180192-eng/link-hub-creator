export type Note = { id: string; text: string };
export type Task = Note & { done: boolean };
export type Focus = {
  duration: number;
  remaining: number;
  endsAt: number | null;
};
export const DEFAULT_FOCUS: Focus = {
  duration: 1500,
  remaining: 1500,
  endsAt: null,
};
export function cleanNotes(raw: unknown): Note[] {
  if (!Array.isArray(raw)) return [];
  const seen = new Set<string>();
  return raw
    .filter((n) => {
      if (
        !n ||
        typeof n.id !== "string" ||
        typeof n.text !== "string" ||
        seen.has(n.id)
      )
        return false;
      seen.add(n.id);
      return true;
    })
    .slice(0, 20)
    .map((n) => ({ id: n.id.slice(0, 100), text: n.text.slice(0, 2000) }));
}
export function cleanTasks(raw: unknown): Task[] {
  if (!Array.isArray(raw)) return [];
  return cleanNotes(raw).map((n) => ({
    ...n,
    text: n.text.slice(0, 300),
    done: raw.find((t) => t?.id === n.id)?.done === true,
  }));
}
export function cleanFocus(raw: unknown): Focus {
  const f = raw as Focus | null;
  if (
    !f ||
    ![300, 900, 1500, 3000].includes(f.duration) ||
    !Number.isFinite(f.remaining) ||
    f.remaining < 0 ||
    f.remaining > f.duration ||
    (f.endsAt !== null && (!Number.isFinite(f.endsAt) || f.endsAt < 0))
  )
    return { ...DEFAULT_FOCUS };
  return { duration: f.duration, remaining: f.remaining, endsAt: f.endsAt };
}
export function remainingSeconds(focus: Focus, now = Date.now()) {
  return focus.endsAt === null
    ? focus.remaining
    : Math.max(
        0,
        Math.min(focus.duration, Math.ceil((focus.endsAt - now) / 1000)),
      );
}
export function productivityKey(profile: string, widget: string) {
  return `landing-page-builder:productivity:v1:${encodeURIComponent(profile)}:${widget}`;
}
export function monthDays(year: number, month: number): (number | null)[] {
  const offset = (new Date(year, month, 1).getDay() + 6) % 7;
  const days = new Date(year, month + 1, 0).getDate();
  const cells: (number | null)[] = [
    ...Array(offset).fill(null),
    ...Array.from({ length: days }, (_, i) => i + 1),
  ];
  while (cells.length % 7) cells.push(null);
  return cells;
}
