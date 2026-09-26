import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  cleanNotes,
  cleanTasks,
  cleanFocus,
  DEFAULT_FOCUS,
  monthDays,
  productivityKey,
  remainingSeconds,
  type Note,
  type Task,
} from "@/lib/productivity-widgets";

// These values never enter profile data or a published-page response.
function useBrowserData<T>(
  key: string,
  initial: T,
  clean: (raw: unknown) => T,
) {
  const [value, setValue] = useState(initial);
  const current = useRef(initial);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState(false);
  useEffect(() => {
    const read = () => {
      try {
        const raw = localStorage.getItem(key);
        const next = raw === null ? initial : clean(JSON.parse(raw));
        current.current = next;
        setValue(next);
        setError(false);
      } catch {
        setError(true);
      }
      setReady(true);
    };
    const sync = (e: StorageEvent) => {
      if (e.key === key || e.key === null) read();
    };
    read();
    window.addEventListener("storage", sync);
    return () => window.removeEventListener("storage", sync);
    // Component is keyed by profile and widget; defaults are mount-only.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
  const update = (change: (old: T) => T) => {
    const next = clean(change(current.current));
    current.current = next;
    setValue(next);
    try {
      localStorage.setItem(key, JSON.stringify(next));
      setError(false);
    } catch {
      setError(true);
    }
  };
  return { value, update, ready, error };
}
const inputClass =
  "w-full min-w-0 rounded-md border border-hub-border bg-hub-background p-2 text-sm text-hub-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-hub-accent";
function StorageNotice({ error }: { error: boolean }) {
  return (
    <p
      className="mb-3 text-xs text-hub-muted"
      role={error ? "alert" : undefined}
    >
      {error
        ? "Browser storage unavailable. Changes may be lost when you leave."
        : "Saved only in this browser for this profile. Not synced or published. Shared browser users can see it; clearing browser data removes it."}
    </p>
  );
}
function Notes({ profile }: { profile: string }) {
  const {
    value: notes,
    update,
    ready,
    error,
  } = useBrowserData<Note[]>(productivityKey(profile, "notes"), [], cleanNotes);
  const [removed, setRemoved] = useState<Note | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const active = notes.find((note) => note.id === selected);
  const colours = [
    "bg-amber-100",
    "bg-rose-100",
    "bg-sky-100",
    "bg-emerald-100",
    "bg-violet-100",
  ];
  return (
    <>
      <StorageNotice error={error} />
      <div className="grid grid-cols-[repeat(auto-fill,minmax(130px,160px))] gap-3">
        {notes.map((note, i) => (
          <button
            key={note.id}
            type="button"
            aria-label={`Open note ${i + 1}`}
            aria-expanded={selected === note.id}
            aria-controls="sticky-note-editor"
            onClick={() => setSelected(selected === note.id ? null : note.id)}
            className={`relative h-32 overflow-hidden rounded-sm border border-black/10 p-3 text-left text-slate-900 shadow-sm transition-shadow hover:shadow-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-hub-accent ${colours[i % colours.length]} ${selected === note.id ? "ring-2 ring-hub-accent" : ""}`}
          >
            <span
              aria-hidden="true"
              className="absolute right-0 top-0 size-5 bg-white/50 [clip-path:polygon(0_0,100%_100%,100%_0)]"
            />
            <span className="mb-2 block text-[11px] font-medium text-slate-600">
              Note {i + 1}
            </span>
            <span className="line-clamp-3 whitespace-pre-wrap break-words text-sm">
              {note.text || "Click to write a note…"}
            </span>
          </button>
        ))}
      </div>
      {active && (
        <div
          id="sticky-note-editor"
          className="mt-4 rounded-md border border-hub-border bg-hub-elevated p-3"
        >
          <label
            htmlFor={`note-${active.id}`}
            className="mb-2 block text-sm font-medium"
          >
            Edit note {notes.findIndex((n) => n.id === active.id) + 1}
          </label>
          <textarea
            key={active.id}
            autoFocus
            id={`note-${active.id}`}
            rows={6}
            maxLength={2000}
            placeholder="Write a thought or reminder…"
            className={inputClass + " resize-y"}
            value={active.text}
            onChange={(e) =>
              update((old) =>
                old.map((n) =>
                  n.id === active.id ? { ...n, text: e.target.value } : n,
                ),
              )
            }
          />
          <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
            <span className="text-xs text-hub-muted">
              {active.text.length}/2,000 characters ·{" "}
              {error ? "Not saved" : "Saved in this browser"}
            </span>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  setRemoved(active);
                  update((old) => old.filter((n) => n.id !== active.id));
                  setSelected(null);
                }}
              >
                Delete note
              </Button>
              <Button size="sm" onClick={() => setSelected(null)}>
                Done
              </Button>
            </div>
          </div>
        </div>
      )}
      {!notes.length && (
        <p className="mb-3 text-sm text-hub-muted">
          Capture an idea, a reminder or your next step.
        </p>
      )}
      <div className="mt-3 flex flex-wrap gap-2">
        <Button
          size="sm"
          disabled={!ready || notes.length >= 20}
          onClick={() => {
            const id = crypto.randomUUID();
            update((old) => [...old, { id, text: "" }]);
            setSelected(id);
          }}
        >
          Add note
        </Button>
        {removed && (
          <Button
            size="sm"
            variant="ghost"
            disabled={notes.length >= 20}
            onClick={() => {
              update((old) => [...old, removed]);
              setRemoved(null);
            }}
          >
            Undo delete
          </Button>
        )}
      </div>
      <p className="mt-2 text-xs text-hub-muted">
        {notes.length}/20 notes · click a note to expand
      </p>
    </>
  );
}
function Checklist({ profile }: { profile: string }) {
  const {
    value: tasks,
    update,
    ready,
    error,
  } = useBrowserData<Task[]>(productivityKey(profile, "tasks"), [], cleanTasks);
  const [draft, setDraft] = useState("");
  const [removed, setRemoved] = useState<Task | null>(null);
  return (
    <>
      <StorageNotice error={error} />
      <form
        className="mb-3 flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          if (!draft.trim() || tasks.length >= 20 || !ready) return;
          update((old) => [
            ...old,
            { id: crypto.randomUUID(), text: draft.trim(), done: false },
          ]);
          setDraft("");
        }}
      >
        <input
          aria-label="New task"
          className={inputClass}
          placeholder="What needs doing?"
          value={draft}
          maxLength={300}
          onChange={(e) => setDraft(e.target.value)}
        />
        <Button
          type="submit"
          disabled={!ready || !draft.trim() || tasks.length >= 20}
        >
          Add
        </Button>
      </form>
      <ul className="space-y-2">
        {tasks.map((task) => (
          <li
            key={task.id}
            className="flex items-center gap-2 rounded-md border border-hub-border p-2"
          >
            <input
              type="checkbox"
              aria-label={`Complete ${task.text}`}
              checked={task.done}
              onChange={(e) =>
                update((old) =>
                  old.map((t) =>
                    t.id === task.id ? { ...t, done: e.target.checked } : t,
                  ),
                )
              }
            />
            <span
              className={`min-w-0 flex-1 break-words text-sm ${task.done ? "text-hub-muted line-through" : ""}`}
            >
              {task.text}
            </span>
            <Button
              size="sm"
              variant="ghost"
              aria-label={`Delete task ${task.text}`}
              onClick={() => {
                setRemoved(task);
                update((old) => old.filter((t) => t.id !== task.id));
              }}
            >
              Delete
            </Button>
          </li>
        ))}
      </ul>
      <p className="mt-3 text-xs text-hub-muted">
        {tasks.filter((t) => t.done).length} of {tasks.length} complete · up to
        20 tasks
      </p>
      {removed && (
        <Button
          size="sm"
          variant="ghost"
          disabled={tasks.length >= 20}
          onClick={() => {
            update((old) => [...old, removed]);
            setRemoved(null);
          }}
        >
          Undo delete
        </Button>
      )}
    </>
  );
}
function FocusTimer({ profile }: { profile: string }) {
  const {
    value: timer,
    update,
    ready,
    error,
  } = useBrowserData(
    productivityKey(profile, "focus"),
    DEFAULT_FOCUS,
    cleanFocus,
  );
  const [now, setNow] = useState(0);
  useEffect(() => {
    const tick = () => setNow(Date.now());
    tick();
    const interval = window.setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, []);
  const seconds = remainingSeconds(timer, now || Date.now());
  const running = timer.endsAt !== null && seconds > 0;
  return (
    <>
      <p className="mb-3 text-xs text-hub-muted">
        Your timer stays in this browser. No notifications or account required.
      </p>
      {error && (
        <p role="alert" className="text-sm text-hub-muted">
          Timer could not be saved. Keep this page open.
        </p>
      )}
      <select
        aria-label="Focus duration"
        className={inputClass}
        disabled={!ready || running}
        value={timer.duration}
        onChange={(e) => {
          const duration = Number(e.target.value);
          update(() => ({ duration, remaining: duration, endsAt: null }));
        }}
      >
        <option value={300}>5 minute break</option>
        <option value={900}>15 minutes</option>
        <option value={1500}>25 minutes</option>
        <option value={3000}>50 minutes</option>
      </select>
      <p
        className="my-5 text-center text-5xl tabular-nums text-hub-accent"
        aria-label="Time remaining"
      >
        {String(Math.floor(seconds / 60)).padStart(2, "0")}:
        {String(seconds % 60).padStart(2, "0")}
      </p>
      <p role="status" className="mb-3 text-center text-sm text-hub-muted">
        {seconds === 0
          ? "Session complete. Time for a breather."
          : running
            ? "Focus on one thing at a time."
            : "Ready when you are."}
      </p>
      <div className="flex justify-center gap-2">
        <Button
          disabled={!ready}
          onClick={() =>
            update((old) => {
              const remaining = remainingSeconds(old);
              return running
                ? { ...old, remaining, endsAt: null }
                : {
                    ...old,
                    remaining: remaining || old.duration,
                    endsAt: Date.now() + (remaining || old.duration) * 1000,
                  };
            })
          }
        >
          {running ? "Pause" : seconds === 0 ? "Start again" : "Start"}
        </Button>
        <Button
          variant="outline"
          disabled={!ready}
          onClick={() =>
            update((old) => ({ ...old, remaining: old.duration, endsAt: null }))
          }
        >
          Reset
        </Button>
      </div>
    </>
  );
}
function MonthCalendar() {
  const [month, setMonth] = useState<Date | null>(null);
  const [today, setToday] = useState<Date | null>(null);
  useEffect(() => {
    const date = new Date();
    setMonth(new Date(date.getFullYear(), date.getMonth(), 1));
    setToday(date);
    const interval = window.setInterval(() => setToday(new Date()), 60000);
    return () => clearInterval(interval);
  }, []);
  if (!month || !today)
    return <p className="text-sm text-hub-muted">Loading calendar…</p>;
  return (
    <>
      <div className="mb-3 flex items-center justify-between gap-2">
        <Button
          size="sm"
          variant="ghost"
          aria-label="Previous month"
          onClick={() =>
            setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))
          }
        >
          ←
        </Button>
        <p aria-live="polite" className="text-sm font-medium">
          {month.toLocaleDateString(undefined, {
            month: "long",
            year: "numeric",
          })}
        </p>
        <Button
          size="sm"
          variant="ghost"
          aria-label="Next month"
          onClick={() =>
            setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))
          }
        >
          →
        </Button>
      </div>
      <table
        className="w-full table-fixed text-center text-sm"
        aria-label={month.toLocaleDateString(undefined, {
          month: "long",
          year: "numeric",
        })}
      >
        <thead>
          <tr>
            {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
              <th
                key={d}
                scope="col"
                className="py-2 text-xs font-normal text-hub-muted"
              >
                {d}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from(
            {
              length:
                monthDays(month.getFullYear(), month.getMonth()).length / 7,
            },
            (_, row) => (
              <tr key={row}>
                {monthDays(month.getFullYear(), month.getMonth())
                  .slice(row * 7, row * 7 + 7)
                  .map((day, col) => {
                    const isToday =
                      day === today.getDate() &&
                      month.getMonth() === today.getMonth() &&
                      month.getFullYear() === today.getFullYear();
                    return (
                      <td
                        key={col}
                        aria-current={isToday ? "date" : undefined}
                        className={`rounded py-2 ${isToday ? "bg-hub-elevated text-hub-accent ring-1 ring-inset ring-hub-accent font-semibold" : ""}`}
                      >
                        {day}
                      </td>
                    );
                  })}
              </tr>
            ),
          )}
        </tbody>
      </table>
      <Button
        className="mt-3"
        variant="ghost"
        size="sm"
        onClick={() => {
          const date = new Date();
          setToday(date);
          setMonth(new Date(date.getFullYear(), date.getMonth(), 1));
        }}
      >
        Today
      </Button>
      <p className="mt-2 text-xs text-hub-muted">
        Calendar only · no external events or account connection.
      </p>
    </>
  );
}
export function ProductivityWidget({
  id,
  profile,
}: {
  id: string;
  profile: string;
}) {
  if (id === "notes") return <Notes profile={profile} />;
  if (id === "tasks") return <Checklist profile={profile} />;
  if (id === "focus") return <FocusTimer profile={profile} />;
  if (id === "calendar") return <MonthCalendar />;
  return null;
}
