import { useId, useState } from "react";
import { Pencil, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { faviconFor } from "@/lib/startpage";
import { FEATURED_LINK_LIMIT, featuredLinkUrl, type FeaturedLink } from "@/lib/home-widgets";

export function FeaturedLinksWidget({ links, editing, saving, disabled, onChange }: {
  links: FeaturedLink[];
  editing: boolean;
  saving: boolean;
  disabled: boolean;
  onChange: (links: FeaturedLink[]) => void;
}) {
  const fieldId = useId();
  const [draft, setDraft] = useState<FeaturedLink | null>(null);
  const [error, setError] = useState("");
  const atLimit = links.length >= FEATURED_LINK_LIMIT;
  const updating = !!draft?.id;
  return (
    <div className="space-y-3">
      {editing ? <div className="flex items-center justify-between gap-2">
        <p className="text-xs text-hub-muted">{links.length} / {FEATURED_LINK_LIMIT} links</p>
        {editing ? <Button size="sm" variant="outline" disabled={saving || atLimit || !!draft} onClick={() => {
          setError(""); setDraft({ id: "", name: "", url: "" });
        }}><Plus /> Add link</Button> : null}
      </div> : null}
      {links.length ? (
        <div role="region" aria-label="Featured links" tabIndex={0} className="max-h-52 overflow-y-auto overscroll-contain rounded p-1 focus-visible:ring-2 focus-visible:ring-hub-accent">
          <div className="studio-featured-grid grid grid-cols-[repeat(auto-fill,5rem)] gap-3">
            {links.map((link) => (
              <div key={link.id} className="studio-featured-item w-20">
                <a href={disabled ? undefined : link.url} target="_blank" rel="noopener noreferrer" aria-disabled={disabled || undefined}
                  aria-label={link.name} title={disabled ? "Archived — renew Premium to open this link" : link.name}
                  className="studio-featured-tile flex size-20 flex-col items-center justify-center gap-2 rounded-md border border-hub-border bg-hub-background p-2 text-center hover:border-hub-accent focus-visible:ring-2 focus-visible:ring-hub-accent">
                  <img src={faviconFor(link.url) || "/favicon.svg"} alt="" className="size-7" />
                  <span className="w-full truncate text-[11px]">{link.name}</span>
                </a>
                {editing ? <div className="mt-1 flex justify-center gap-1">
                  <Button variant="ghost" size="icon" className="size-7" aria-label={`Edit ${link.name}`} disabled={saving} onClick={() => { setError(""); setDraft({ ...link }); }}><Pencil /></Button>
                  <Button variant="ghost" size="icon" className="size-7" aria-label={`Remove ${link.name}`} disabled={saving} onClick={() => {
                    onChange(links.filter((item) => item.id !== link.id));
                    if (draft?.id === link.id) setDraft(null);
                  }}><X /></Button>
                </div> : null}
              </div>
            ))}
          </div>
        </div>
      ) : <p className="text-sm text-hub-muted">{editing ? "Add your first featured link." : "No featured links yet."}</p>}
      {editing && atLimit && !draft ? <p className="text-xs text-hub-muted">Maximum 10 links. Remove a link to add another.</p> : null}
      {editing && draft ? (
        <form className="space-y-3 rounded-md border border-hub-border p-3" onSubmit={(event) => {
          event.preventDefault();
          if (saving) return;
          const url = featuredLinkUrl(draft.url);
          if (!draft.name.trim() || !url) { setError("Enter a name and a valid http or https website address."); return; }
          if (!updating && atLimit) { setError("You can add up to 10 featured links."); return; }
          if (links.some((link) => link.id !== draft.id && link.url === url)) { setError("This link is already featured."); return; }
          const link = { id: draft.id || crypto.randomUUID(), name: draft.name.trim(), url };
          onChange(updating ? links.map((item) => item.id === draft.id ? link : item) : [...links, link]);
          setDraft(null); setError("");
        }}>
          <label className="block text-xs" htmlFor={`${fieldId}-name`}>Link name</label>
          <Input id={`${fieldId}-name`} required maxLength={80} value={draft.name} disabled={saving} onChange={(event) => setDraft({ ...draft, name: event.target.value })} />
          <label className="block text-xs" htmlFor={`${fieldId}-url`}>Website address</label>
          <Input id={`${fieldId}-url`} required inputMode="url" placeholder="https://example.com" value={draft.url} disabled={saving} onChange={(event) => setDraft({ ...draft, url: event.target.value })} />
          {error ? <p role="alert" className="text-xs text-destructive">{error}</p> : null}
          <div className="flex gap-2">
            <Button type="submit" size="sm" disabled={saving}>{updating ? "Save link" : "Add link"}</Button>
            <Button type="button" variant="ghost" size="sm" disabled={saving} onClick={() => { setDraft(null); setError(""); }}>Cancel</Button>
          </div>
        </form>
      ) : null}
    </div>
  );
}
