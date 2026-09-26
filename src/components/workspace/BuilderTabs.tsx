import { Home, Layers, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

type Props = {
  tabs: { id: string; name: string; archived?: boolean }[];
  activeId: string;
  onSelect: (id: string) => void;
  onAdd: () => void;
  onRename: (id: string) => void;
  canAdd: boolean;
};

export function BuilderTabs({ tabs, activeId, onSelect, onAdd, onRename, canAdd }: Props) {
  const items = [{ id: "__home", name: "Home", archived: false }, ...tabs];
  return (
    <div className="border-b border-hub-border bg-hub-surface/50 px-3 pt-4 sm:px-5">
      <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-hub-muted">
        Page tabs
      </p>
      <div className="flex items-end gap-2">
        <div
          data-tour="tabs"
          role="tablist"
          aria-label="Page tabs"
          className="flex min-w-0 flex-1 gap-1 overflow-x-auto pt-1"
          onKeyDown={(event) => {
            const current = items.findIndex((item) => item.id === activeId);
            let next = current;
            if (event.key === "ArrowRight") next = (current + 1) % items.length;
            else if (event.key === "ArrowLeft") next = (current - 1 + items.length) % items.length;
            else if (event.key === "Home") next = 0;
            else if (event.key === "End") next = items.length - 1;
            else return;
            event.preventDefault();
            const nextItem = items[next];
            if (!nextItem) return;
            onSelect(nextItem.id);
            event.currentTarget.querySelectorAll<HTMLButtonElement>('[role="tab"]')[next]?.focus();
          }}
        >
          {items.map((item) => (
            <button
              key={item.id}
              id={`builder-tab-${item.id}`}
              role="tab"
              aria-selected={activeId === item.id}
              aria-controls="builder-tab-panel"
              tabIndex={activeId === item.id ? 0 : -1}
              type="button"
              onClick={() => onSelect(item.id)}
              onDoubleClick={() => {
                if (item.id !== "__home") onRename(item.id);
              }}
              className={`relative flex max-w-56 shrink-0 items-center gap-2 rounded-t-xl border px-4 py-3 text-xs font-medium transition-colors focus-visible:z-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-hub-accent ${activeId === item.id ? "border-hub-border border-b-hub-background bg-hub-background text-hub-accent shadow-[0_-3px_12px_rgba(0,0,0,0.08)]" : "border-hub-border/50 bg-hub-surface text-hub-muted hover:bg-hub-elevated/50 hover:text-hub-foreground"}`}
            >
              {item.id === "__home" ? (
                <Home className="size-3.5 shrink-0" />
              ) : (
                <Layers className="size-3.5 shrink-0" />
              )}
              <span className="truncate">{item.name}</span>
              {item.archived ? <span className="text-[9px] text-hub-muted">Archived</span> : null}
              {activeId === item.id ? (
                <span className="absolute inset-x-4 bottom-1 h-0.5 rounded-full bg-hub-accent" />
              ) : null}
            </button>
          ))}
        </div>
        <Button
          data-tour="add-tab"
          variant="ghost"
          size="sm"
          className="mb-1 shrink-0 text-hub-muted"
          onClick={onAdd}
          disabled={!canAdd}
          aria-label="Add tab"
          title={canAdd ? "Add a page tab" : "Tab limit reached"}
        >
          <Plus className="size-4" />
          <span className="hidden sm:inline">New tab</span>
        </Button>
      </div>
    </div>
  );
}
