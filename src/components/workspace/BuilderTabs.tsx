import { Home, Layers, Plus, GripVertical, ArrowLeft, ArrowRight, NotebookPen } from "lucide-react";
import type { CSSProperties } from "react";
import { useDragOrder } from "./useDragOrder";
import { moveItem } from "@/lib/reorder";
import { Button } from "@/components/ui/button";

type Props = {
  tabs: { id: string; name: string; archived?: boolean; tab_color?: string | null }[];
  notepadEnabled: boolean;
  homeColor?: string | null;
  notepadColor?: string | null;
  onAddNotepad: () => void;
  activeId: string;
  onSelect: (id: string) => void;
  onAdd: () => void;
  onRename: (id: string) => void;
  canAdd: boolean;
  onReorder?: (ids: string[]) => void;
  saving?: boolean;
};

export function BuilderTabs({ tabs, notepadEnabled, homeColor, notepadColor, onAddNotepad, activeId, onSelect, onAdd, onRename, canAdd, onReorder, saving = false }: Props) {
  const items = [{ id: "__home", name: "Home", archived: false, tab_color: homeColor }, ...(notepadEnabled ? [{ id: "__notepad", name: "Notepad", archived: false, tab_color: notepadColor }] : []), ...tabs];
  const movable = tabs.filter(t => !t.archived).map(t => t.id);
  const saveOrder = (ids: string[]) => onReorder?.([...ids, ...tabs.filter(t=>t.archived).map(t=>t.id)]);
  const drag = useDragOrder(movable, 'builder-tabs', saving || !onReorder, saveOrder);
  const selected = movable.indexOf(activeId);
  return (
    <div className="studio-builder-tabs border-b border-hub-border bg-hub-surface/50 px-3 pt-4 sm:px-5">
      <div className="mb-2 flex flex-wrap items-center gap-2 text-[10px] font-semibold text-hub-muted">
        <span className="uppercase tracking-[0.16em]">Page tabs</span>
        {onReorder && <><span>Drag the dotted handles to reorder</span><button type="button" className="rounded p-1 hover:bg-hub-elevated disabled:opacity-40" aria-label="Move selected tab left" disabled={saving || selected<=0} onClick={()=>saveOrder(moveItem(movable,selected,selected-1))}><ArrowLeft className="size-4"/></button><button type="button" className="rounded p-1 hover:bg-hub-elevated disabled:opacity-40" aria-label="Move selected tab right" disabled={saving || selected<0 || selected>=movable.length-1} onClick={()=>saveOrder(moveItem(movable,selected,selected+1))}><ArrowRight className="size-4"/></button></>}
      </div>
      <div className="flex items-end gap-2">
        <div
          data-tour="tabs"
          role="tablist"
          aria-label="Page tabs"
          className="flex min-w-0 flex-1 gap-1 overflow-x-auto pt-1"
          onKeyDown={(event) => {
            if ((event.target as HTMLElement).getAttribute('role') !== 'tab') return;
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
            <div key={item.id} role="presentation" {...(!item.id.startsWith('__') ? drag.targetProps(item.id) : {})} className={`flex shrink-0 items-center rounded-t-xl ${drag.over === item.id ? 'ring-2 ring-inset ring-hub-accent' : ''}`}>
            <button
              id={`builder-tab-${item.id}`}
              role="tab"
              aria-selected={activeId === item.id}
              aria-controls="builder-tab-panel"
              tabIndex={activeId === item.id ? 0 : -1}
              type="button"
              onClick={() => onSelect(item.id)}
              onDoubleClick={() => {
                if (!item.id.startsWith("__")) onRename(item.id);
              }}
              style={item.tab_color && /^#[0-9a-f]{6}$/i.test(item.tab_color) ? { "--tab-accent": item.tab_color } as CSSProperties : undefined}
              className={`relative flex max-w-56 shrink-0 items-center gap-2 rounded-t-xl border px-4 py-3 text-xs font-medium transition-colors focus-visible:z-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-hub-accent ${activeId === item.id ? "border-hub-border border-b-hub-background bg-hub-background text-hub-accent shadow-[0_-3px_12px_rgba(0,0,0,0.08)]" : "border-hub-border/50 bg-hub-surface text-hub-muted hover:bg-hub-elevated/50 hover:text-hub-foreground"}`}
            >
              {item.id === "__home" ? (
                <Home className="size-3.5 shrink-0" />
              ) : item.id === "__notepad" ? (
                <NotebookPen className="size-3.5 shrink-0" />
              ) : (
                <Layers className="size-3.5 shrink-0" />
              )}
              {item.tab_color && /^#[0-9a-f]{6}$/i.test(item.tab_color) ? <span className="studio-builder-tab-dot" aria-hidden="true" /> : null}
              <span className="truncate">{item.name}</span>
              {item.archived ? <span className="text-[9px] text-hub-muted">Archived</span> : null}
              {activeId === item.id ? (
                <span className="absolute inset-x-4 bottom-1 h-0.5 rounded-full bg-hub-accent" />
              ) : null}
            </button>
            {!item.id.startsWith('__') && onReorder && !item.archived ? <button type="button" aria-label={`Drag tab ${item.name}`} title="Drag to reorder tab" disabled={saving || movable.length<2} {...drag.handleProps(item.id)} className="rounded p-1 text-hub-muted hover:text-hub-accent focus-visible:ring-2 focus-visible:ring-hub-accent"><GripVertical className="size-4" /></button> : null}
            </div>
          ))}
        </div>
        {!notepadEnabled ? <Button variant="ghost" size="sm" className="mb-1 shrink-0" onClick={onAddNotepad} aria-label="Add Notepad tab"><NotebookPen className="size-4" /><span className="hidden sm:inline">Notepad</span></Button> : null}
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
