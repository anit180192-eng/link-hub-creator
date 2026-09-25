import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { hostOf } from "@/lib/startpage";
import { MAX_SAVE_TITLE, MAX_SAVE_URL, SAVE_BRIDGE_VERSION, parseSaveCurrent } from "@/lib/saveBridge";

const NONE = "__none";
const NEW = "__new";

type Props = { ready: boolean; currentPageId?: string; currentTabId?: string; onSaved: (pageId: string, tabId: string) => void | Promise<void> };

export function SaveCurrentPageDialog({ ready, currentPageId, currentTabId, onSaved }: Props) {
  const armed = useRef(false);
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [pageId, setPageId] = useState("");
  const [tabId, setTabId] = useState("");
  const [folder, setFolder] = useState(NONE);
  const [newFolder, setNewFolder] = useState("");
  const [saving, setSaving] = useState(false);

  // One-time bridge: listen first, then announce readiness.
  useEffect(() => {
    if (!ready || armed.current) return;
    armed.current = true;
    const on = (e: MessageEvent) => {
      const m = parseSaveCurrent(e.data, { sourceIsWindow: e.source === window, origin: e.origin, expectedOrigin: window.location.origin });
      if (!m) return;
      window.removeEventListener("message", on);
      setUrl(m.url);
      setTitle(m.title || hostOf(m.url).replace(/^www\./, "").slice(0, MAX_SAVE_TITLE));
      setOpen(true);
    };
    window.addEventListener("message", on);
    window.postMessage({ type: "LPB_SAVE_READY", version: SAVE_BRIDGE_VERSION }, window.location.origin);
    return () => window.removeEventListener("message", on);
  }, [ready]);

  const pagesQ = useQuery({ queryKey: ["save-pages"], enabled: open, queryFn: async () => {
    const q = await supabase.from("pages").select("id,name,user_id").order("created_at"); if (q.error) throw q.error; return q.data;
  } });
  const tabsQ = useQuery({ queryKey: ["save-tabs", pageId], enabled: open && !!pageId, queryFn: async () => {
    const q = await supabase.from("page_tabs").select("id,name").eq("page_id", pageId).order("position"); if (q.error) throw q.error; return q.data;
  } });
  const foldersQ = useQuery({ queryKey: ["save-folders", tabId], enabled: open && !!tabId, queryFn: async () => {
    const q = await supabase.from("page_folders").select("id,name").eq("tab_id", tabId).order("position"); if (q.error) throw q.error; return q.data;
  } });

  useEffect(() => { const p = pagesQ.data; if (open && p?.length && !pageId) setPageId(p.find((x) => x.id === currentPageId)?.id || p[0].id); }, [open, pagesQ.data, pageId, currentPageId]);
  useEffect(() => { const t = tabsQ.data; if (!t) return; if (!t.some((x) => x.id === tabId)) setTabId(t.find((x) => x.id === currentTabId)?.id || t[0]?.id || ""); }, [tabsQ.data, tabId, currentTabId]);
  useEffect(() => { setFolder(NONE); setNewFolder(""); }, [tabId]);

  const close = () => { setOpen(false); setPageId(""); setTabId(""); };

  const save = async () => {
    const page = pagesQ.data?.find((p) => p.id === pageId);
    if (!page || !tabId) return toast.error("Choose a profile and tab");
    let parsed: URL;
    try { parsed = new URL(url.trim()); } catch { return toast.error("Enter a valid web address"); }
    if (!/^https?:$/.test(parsed.protocol) || parsed.username || parsed.password || parsed.toString().length > MAX_SAVE_URL) return toast.error("Enter a valid http or https address");
    const cleanUrl = parsed.toString();
    let group = folder === NONE ? "" : folder === NEW ? newFolder.trim().slice(0, 40) : (foldersQ.data?.find((f) => f.id === folder)?.name ?? "");
    if (folder === NEW && !group) return toast.error("Enter a folder name");
    setSaving(true);
    try {
      const dup = await supabase.from("links").select("id").eq("page_id", page.id).eq("tab_id", tabId).eq("group_name", group).eq("url", cleanUrl).limit(1);
      if (dup.error) throw dup.error;
      if (dup.data.length) throw Error("This link is already saved there");
      if (folder === NEW && !foldersQ.data?.some((f) => f.name === group)) {
        const f = await supabase.from("page_folders").insert({ page_id: page.id, tab_id: tabId, user_id: page.user_id, name: group, position: foldersQ.data?.length ?? 0 });
        if (f.error && !f.error.message.includes("duplicate")) throw f.error;
      }
      const cnt = await supabase.from("links").select("id", { count: "exact", head: true }).eq("page_id", page.id);
      const ins = await supabase.from("links").insert({
        user_id: page.user_id, page_id: page.id, tab_id: tabId, platform: "website", position: cnt.count ?? 0,
        label: (title.trim() || hostOf(cleanUrl).replace(/^www\./, "")).slice(0, MAX_SAVE_TITLE), url: cleanUrl, group_name: group, icon_only: false, favourite: false,
      });
      if (ins.error) throw ins.error;
      await onSaved(page.id, tabId);
      toast.success("Page saved");
      close();
    } catch (e) { toast.error(e instanceof Error ? e.message : "Couldn't save this page"); }
    finally { setSaving(false); }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && close()}>
      <DialogContent>
        <DialogHeader><DialogTitle>Save this page</DialogTitle><DialogDescription>Choose where this link should go. Nothing is saved until you press Save.</DialogDescription></DialogHeader>
        <div className="grid gap-3">
          <div className="grid gap-1.5"><Label htmlFor="sp-title">Title</Label><Input id="sp-title" value={title} maxLength={MAX_SAVE_TITLE} onChange={(e) => setTitle(e.target.value)} /></div>
          <div className="grid gap-1.5"><Label htmlFor="sp-url">Web address</Label><Input id="sp-url" value={url} maxLength={MAX_SAVE_URL} onChange={(e) => setUrl(e.target.value)} /></div>
          <div className="grid gap-1.5"><Label>Profile</Label>
            <Select value={pageId} onValueChange={(v) => { setPageId(v); setTabId(""); }}><SelectTrigger><SelectValue placeholder="Loading…" /></SelectTrigger>
              <SelectContent>{pagesQ.data?.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent></Select></div>
          <div className="grid gap-1.5"><Label>Tab</Label>
            <Select value={tabId} onValueChange={setTabId}><SelectTrigger><SelectValue placeholder="Choose a tab" /></SelectTrigger>
              <SelectContent>{tabsQ.data?.map((t) => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}</SelectContent></Select></div>
          <div className="grid gap-1.5"><Label>Folder</Label>
            <Select value={folder} onValueChange={setFolder}><SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value={NONE}>No folder</SelectItem>{foldersQ.data?.map((f) => <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>)}<SelectItem value={NEW}>+ New folder…</SelectItem></SelectContent></Select>
            {folder === NEW && <Input placeholder="Folder name" maxLength={40} value={newFolder} onChange={(e) => setNewFolder(e.target.value)} />}</div>
        </div>
        <DialogFooter><Button variant="outline" onClick={close}>Cancel</Button><Button onClick={save} disabled={saving || !tabId}>{saving ? "Saving…" : "Save"}</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
