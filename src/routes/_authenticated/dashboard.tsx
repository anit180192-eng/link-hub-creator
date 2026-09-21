import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import {
  ArrowDown,
  ArrowUp,
  Check,
  Clock3,
  Copy,
  Download,
  ExternalLink,
  Folder,
  FolderPlus,
  Image as ImageIcon,
  LogOut,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { LandingPageSetupGuide } from "@/components/LandingPageSetupGuide";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { LivePagePreview } from "@/components/LivePagePreview";
import { AdSpace } from "@/components/AdSpace";
import {
  MAX_CLOCKS,
  PLATFORMS,
  TIMEZONES,
  clockParts,
  isSafeUrl,
  normalizeUrl,
  parseClocks,
  renderStartPageHtml,
  slugify,
  timezoneLabel,
  type StartPageClock,
  type StartPageLink,
  type StartPageProfile,
} from "@/lib/startpage";


export const Route = createFileRoute("/_authenticated/dashboard")({
  staticData: { sitemap: false },
  head: () => ({
    meta: [
      { title: "Your landing page — Landing Page Builder" },
      {
        name: "description",
        content: "Add your accounts, pick a theme, and publish your personal browser start page.",
      },
      { property: "og:title", content: "Your landing page — Landing Page Builder" },
      { property: "og:description", content: "Add your accounts and publish your start page." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Dashboard,
});

type ProfileRow = StartPageProfile & { id: string; published: boolean };

const NO_FOLDER = "__none__";

function Dashboard() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const profileQuery = useQuery({
    queryKey: ["profile"],
    queryFn: async (): Promise<ProfileRow> => {
      const { data: userData } = await supabase.auth.getUser();
      const user = userData.user;
      if (!user) throw new Error("Please sign in again");
      const existing = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();
      if (existing.error) throw existing.error;
      if (existing.data) return existing.data as unknown as ProfileRow;

      const base = slugify(user.email?.split("@")[0] ?? "me") || "me";
      const slug = `${base}-${user.id.slice(0, 4)}`;
      const created = await supabase
        .from("profiles")
        .insert({
          id: user.id,
          slug,
          display_name: user.user_metadata?.["full_name"] ?? base,
        })
        .select("*")
        .single();
      if (created.error) throw created.error;
      return created.data as unknown as ProfileRow;
    },
  });

  const linksQuery = useQuery({
    queryKey: ["links"],
    queryFn: async (): Promise<StartPageLink[]> => {
      const { data, error } = await supabase
        .from("links")
        .select("id, platform, label, url, group_name, position, icon_only")
        .order("position", { ascending: true });
      if (error) throw error;
      return (data ?? []) as StartPageLink[];
    },
  });

  const profile = profileQuery.data;
  const links = linksQuery.data ?? [];

  const [form, setForm] = useState<ProfileRow | null>(null);
  useEffect(() => {
    if (profile) setForm(profile);
  }, [profile]);

  const [newLink, setNewLink] = useState({
    platform: "instagram",
    label: "",
    url: "",
    group_name: "",
  });
  const [newFolder, setNewFolder] = useState("");
  const [extraFolders, setExtraFolders] = useState<string[]>([]);
  const [editingLink, setEditingLink] = useState<StartPageLink | null>(null);

  const clocks = parseClocks(form?.clocks);


  const folders = Array.from(
    new Set([...links.map((l) => l.group_name.trim()).filter(Boolean), ...extraFolders]),
  );

  const sections: [string, StartPageLink[]][] = [
    ...folders.map(
      (folder) => [folder, links.filter((l) => l.group_name.trim() === folder)] as [
        string,
        StartPageLink[],
      ],
    ),
  ];
  const ungrouped = links.filter((l) => !l.group_name.trim());
  if (ungrouped.length) sections.push(["", ungrouped]);

  const saveProfile = useMutation({
    mutationFn: async (patch: Partial<ProfileRow>) => {
      if (!profile) return;
      const { error } = await supabase.from("profiles").update(patch).eq("id", profile.id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["profile"] }),
    onError: (e: Error) =>
      toast.error(
        e.message.includes("duplicate") ? "That page address is taken" : "Couldn't save changes",
      ),
  });

  const uploadAvatar = useMutation({
    mutationFn: async (file: File) => {
      if (!profile) return;
      if (!file.type.startsWith("image/")) throw new Error("Please choose an image file");
      if (file.size > 5 * 1024 * 1024) throw new Error("Please choose an image under 5 MB");
      const ext = (file.name.split(".").pop() ?? "jpg").toLowerCase().slice(0, 5);
      const path = `${profile.id}/avatar-${Date.now()}.${ext}`;
      const up = await supabase.storage
        .from("avatars")
        .upload(path, file, { upsert: true, contentType: file.type });
      if (up.error) throw up.error;
      const signed = await supabase.storage
        .from("avatars")
        .createSignedUrl(path, 60 * 60 * 24 * 365 * 10);
      if (signed.error) throw signed.error;
      const { error } = await supabase
        .from("profiles")
        .update({ avatar_url: signed.data.signedUrl })
        .eq("id", profile.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Photo updated");
      queryClient.invalidateQueries({ queryKey: ["profile"] });
    },
    onError: (e: Error) => toast.error(e.message || "Couldn't upload that photo"),
  });

  const addLink = useMutation({
    mutationFn: async () => {
      if (!profile) return;
      if (!isSafeUrl(newLink.url)) throw new Error("Enter a valid web address");
      const { error } = await supabase.from("links").insert({
        user_id: profile.id,
        platform: newLink.platform,
        label: newLink.label.trim().slice(0, 60),
        url: normalizeUrl(newLink.url).slice(0, 500),
        group_name: newLink.group_name.trim().slice(0, 40),
        position: links.length,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      setNewLink({ platform: newLink.platform, label: "", url: "", group_name: "" });
      queryClient.invalidateQueries({ queryKey: ["links"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const removeLink = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("links").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["links"] }),
  });

  const updateLink = useMutation({
    mutationFn: async (link: StartPageLink) => {
      if (!isSafeUrl(link.url)) throw new Error("Enter a valid web address");
      const { error } = await supabase
        .from("links")
        .update({
          platform: link.platform,
          label: link.label.trim().slice(0, 60),
          url: normalizeUrl(link.url).slice(0, 500),
          group_name: link.group_name.trim().slice(0, 40),
          icon_only: !!link.icon_only,
        })
        .eq("id", link.id);
      if (error) throw error;
    },
    onSuccess: () => {
      setEditingLink(null);
      queryClient.invalidateQueries({ queryKey: ["links"] });
      toast.success("Link updated");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const moveLink = useMutation({
    mutationFn: async ({ index, dir }: { index: number; dir: -1 | 1 }) => {
      const target = index + dir;
      if (target < 0 || target >= links.length) return;
      const a = links[index];
      const b = links[target];
      if (!a || !b) return;
      const updates = [
        supabase.from("links").update({ position: target }).eq("id", a.id),
        supabase.from("links").update({ position: index }).eq("id", b.id),
      ];
      await Promise.all(updates);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["links"] }),
  });

  const moveToFolder = useMutation({
    mutationFn: async ({ id, group_name }: { id: string; group_name: string }) => {
      const { error } = await supabase.from("links").update({ group_name }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["links"] }),
    onError: () => toast.error("Couldn't move that link"),
  });

  const renameFolder = useMutation({
    mutationFn: async ({ from, to }: { from: string; to: string }) => {
      const clean = to.trim().slice(0, 40);
      const { error } = await supabase
        .from("links")
        .update({ group_name: clean })
        .eq("group_name", from);
      if (error) throw error;
      setExtraFolders((prev) => {
        const rest = prev.filter((f) => f !== from);
        return clean && !rest.includes(clean) ? [...rest, clean] : rest;
      });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["links"] }),
    onError: () => toast.error("Couldn't update that folder"),
  });

  const publishPage = useMutation({
    mutationFn: async (published: boolean) => {
      const slug = slugify(form?.slug ?? "");
      if (!profile || !slug) throw new Error("Choose a username before publishing");
      const { error } = await supabase
        .from("profiles")
        .update({ slug, published })
        .eq("id", profile.id);
      if (error) throw error;
      return { published, slug };
    },
    onSuccess: ({ published, slug }) => {
      setForm((current) => (current ? { ...current, slug, published } : current));
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      toast.success(published ? "Your unique landing page is live" : "Your page is now private");
    },
    onError: (e: Error) =>
      toast.error(
        e.message.includes("duplicate")
          ? "That username is already taken. Choose another."
          : e.message,
      ),
  });

  function saveClocks(next: StartPageClock[]) {
    const cleaned = next.slice(0, MAX_CLOCKS).map((c) => ({
      tz: c.tz,
      label: (c.label || timezoneLabel(c.tz)).trim().slice(0, 24) || timezoneLabel(c.tz),
    }));
    setForm((current) => (current ? { ...current, clocks: cleaned } : current));
    saveProfile.mutate({ clocks: cleaned } as Partial<ProfileRow>);
  }

  function createFolder() {

    const name = newFolder.trim().slice(0, 40);
    if (!name) return;
    if (folders.includes(name)) {
      toast.error("You already have a folder with that name");
      return;
    }
    setExtraFolders((prev) => [...prev, name]);
    setNewLink((prev) => ({ ...prev, group_name: name }));
    setNewFolder("");
    toast.success(`Folder “${name}” created`);
  }

  async function handleSignOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  function handleDownload() {
    if (!form) return;
    const html = renderStartPageHtml(form, links);
    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${form.slug || "start-page"}.html`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Downloaded your start page");
  }

  const publicUrl =
    typeof window !== "undefined" && form ? `${window.location.origin}/p/${form.slug}` : "";

  if (profileQuery.isLoading || !form) {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-muted-foreground">
        Loading your start page…
      </div>
    );
  }

  if (profileQuery.isError) {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-muted-foreground">
        We couldn't load your start page. Refresh to try again.
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
          <Link to="/" className="font-display text-lg font-bold tracking-tight">
            Landing Page <span className="text-primary">Builder</span>
          </Link>
          <div className="flex items-center gap-2">
            <Button asChild variant="ghost" size="sm">
              <Link to="/setup">Setup guide</Link>
            </Button>
            <Button variant="outline" size="sm" onClick={handleSignOut}>
              <LogOut className="mr-1 h-4 w-4" /> Sign out
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto grid max-w-7xl gap-8 px-5 py-10 lg:grid-cols-[minmax(0,1fr)_480px]">
        <div className="space-y-8">
          {/* Profile */}
          <section className="rounded-xl border border-border bg-card p-6">
            <h2 className="font-display text-lg">Your page</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="name">Display name</Label>
                <Input
                  id="name"
                  value={form.display_name}
                  maxLength={60}
                  onChange={(e) => setForm({ ...form, display_name: e.target.value })}
                  onBlur={() => saveProfile.mutate({ display_name: form.display_name })}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="slug">Landing page username</Label>
                <div className="flex gap-2">
                  <Input
                    id="slug"
                    value={form.slug}
                    maxLength={40}
                    aria-describedby="slug-help"
                    onChange={(e) => setForm({ ...form, slug: slugify(e.target.value) })}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    disabled={!form.slug || saveProfile.isPending}
                    onClick={() => saveProfile.mutate({ slug: form.slug })}
                  >
                    Save
                  </Button>
                </div>
                <p id="slug-help" className="text-xs text-muted-foreground">
                  Your unique link ends in /p/{form.slug || "your-name"}. If it is taken, we'll ask you to choose another.
                </p>
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="tagline">Tagline</Label>
                <Input
                  id="tagline"
                  value={form.tagline}
                  maxLength={120}
                  placeholder="Designer, builder, chronic tab-opener"
                  onChange={(e) => setForm({ ...form, tagline: e.target.value })}
                  onBlur={() => saveProfile.mutate({ tagline: form.tagline })}
                />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="avatar">Your photo (optional)</Label>
                <div className="flex flex-wrap items-center gap-3">
                  {form.avatar_url ? (
                    <img
                      src={form.avatar_url}
                      alt="Your profile photo"
                      className="size-14 rounded-full border border-border object-cover"
                    />
                  ) : (
                    <div className="flex size-14 items-center justify-center rounded-full border border-border bg-muted text-muted-foreground">
                      <ImageIcon className="size-5" aria-hidden="true" />
                    </div>
                  )}
                  <input
                    id="avatar"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      e.target.value = "";
                      if (file) uploadAvatar.mutate(file);
                    }}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    disabled={uploadAvatar.isPending}
                    onClick={() => document.getElementById("avatar")?.click()}
                  >
                    {uploadAvatar.isPending
                      ? "Uploading…"
                      : form.avatar_url
                        ? "Change photo"
                        : "Upload photo"}
                  </Button>
                  {form.avatar_url ? (
                    <Button
                      type="button"
                      variant="ghost"
                      disabled={saveProfile.isPending}
                      onClick={() => {
                        setForm({ ...form, avatar_url: null });
                        saveProfile.mutate({ avatar_url: null });
                      }}
                    >
                      Remove
                    </Button>
                  ) : null}
                </div>
                <p className="text-xs text-muted-foreground">
                  JPG or PNG, up to 5 MB. Only you can replace your photo.
                </p>
              </div>
            </div>

            <div className="mt-6 flex flex-wrap items-center gap-6">
              <div className="flex items-center gap-2">
                <Label className="text-sm">Theme</Label>
                <Select
                  value={form.theme}
                  onValueChange={(theme) => {
                    setForm({ ...form, theme });
                    saveProfile.mutate({ theme });
                  }}
                >
                  <SelectTrigger className="w-44">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="grid">Icon grid dashboard</SelectItem>
                    <SelectItem value="list">Link-in-bio list</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  id="dark"
                  checked={form.dark_mode}
                  onCheckedChange={(dark_mode) => {
                    setForm({ ...form, dark_mode });
                    saveProfile.mutate({ dark_mode });
                  }}
                />
                <Label htmlFor="dark">Dark page</Label>
              </div>
            </div>
          </section>

          {/* World clocks */}
          <section className="rounded-xl border border-border bg-card p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="font-display text-lg">World clocks</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Show the time in up to {MAX_CLOCKS} countries at the top of your page. Add none if
                  you'd rather keep it clean.
                </p>
              </div>
              <Button
                variant="outline"
                disabled={clocks.length >= MAX_CLOCKS}
                onClick={() => {
                  const used = new Set(clocks.map((c) => c.tz));
                  const next = TIMEZONES.find((t) => !used.has(t.tz)) ?? TIMEZONES[0]!;
                  saveClocks([...clocks, { tz: next.tz, label: next.label }]);
                }}
              >
                <Clock3 className="mr-1 h-4 w-4" /> Add clock
              </Button>
            </div>

            {clocks.length === 0 ? (
              <p className="mt-4 text-sm text-muted-foreground">
                No clocks yet — your page shows just your links.
              </p>
            ) : (
              <ul className="mt-4 space-y-3">
                {clocks.map((clock, index) => (
                  <li key={index} className="flex flex-wrap items-center gap-2">
                    <span className="text-xs text-muted-foreground">Clock {index + 1}</span>
                    <Select
                      value={clock.tz}
                      onValueChange={(tz) =>
                        saveClocks(
                          clocks.map((c, i) =>
                            i === index
                              ? { tz, label: c.label === timezoneLabel(c.tz) ? timezoneLabel(tz) : c.label }
                              : c,
                          ),
                        )
                      }
                    >
                      <SelectTrigger className="w-56" aria-label={`Country for clock ${index + 1}`}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="max-h-72">
                        {TIMEZONES.map((t) => (
                          <SelectItem key={t.tz} value={t.tz}>
                            {t.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Input
                      className="w-44"
                      aria-label={`Label for clock ${index + 1}`}
                      value={clock.label}
                      maxLength={24}
                      placeholder="Label shown on page"
                      onChange={(e) =>
                        setForm({
                          ...form,
                          clocks: clocks.map((c, i) =>
                            i === index ? { ...c, label: e.target.value } : c,
                          ),
                        })
                      }
                      onBlur={() => saveClocks(clocks)}
                    />
                    <span className="text-xs tabular-nums text-muted-foreground">
                      {clockParts(clock.tz).time}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label={`Remove clock ${index + 1}`}
                      onClick={() => saveClocks(clocks.filter((_, i) => i !== index))}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </section>


          {/* Folders + links */}
          <section className="rounded-xl border border-border bg-card p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="font-display text-lg">Your folders &amp; links</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Group related accounts together — e.g. a folder per brand, project or person.
                </p>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <Input
                className="w-64"
                placeholder="New folder name — e.g. Bhakti Raga Media"
                value={newFolder}
                maxLength={40}
                onChange={(e) => setNewFolder(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") createFolder();
                }}
              />
              <Button variant="outline" onClick={createFolder}>
                <FolderPlus className="mr-1 h-4 w-4" /> Add folder
              </Button>
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-[150px_1fr_150px_auto]">
              <Select
                value={newLink.platform}
                onValueChange={(platform) => setNewLink({ ...newLink, platform })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PLATFORMS.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                placeholder="https://instagram.com/yourhandle"
                value={newLink.url}
                maxLength={500}
                onChange={(e) => setNewLink({ ...newLink, url: e.target.value })}
              />
              <Input
                placeholder="Label (optional)"
                value={newLink.label}
                maxLength={60}
                onChange={(e) => setNewLink({ ...newLink, label: e.target.value })}
              />
              <Button onClick={() => addLink.mutate()} disabled={addLink.isPending}>
                <Plus className="h-4 w-4" />
              </Button>
              <div className="sm:col-span-4">
                <Select
                  value={newLink.group_name || NO_FOLDER}
                  onValueChange={(value) =>
                    setNewLink({ ...newLink, group_name: value === NO_FOLDER ? "" : value })
                  }
                >
                  <SelectTrigger className="sm:w-72">
                    <SelectValue placeholder="Put in folder" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NO_FOLDER}>No folder</SelectItem>
                    {folders.map((folder) => (
                      <SelectItem key={folder} value={folder}>
                        {folder}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="mt-6 space-y-5">
              {links.length === 0 && folders.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Nothing yet. Create a folder, then add your first account above.
                </p>
              ) : null}

              {sections.map(([folder, items]) => (
                <div key={folder || "__none"} className="rounded-lg border border-border">
                  <div className="flex items-center gap-2 border-b border-border px-3 py-2">
                    <Folder className="h-4 w-4 shrink-0 text-primary" />
                    <span className="min-w-0 flex-1 truncate text-sm font-semibold">
                      {folder || "Ungrouped links"}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {items.length} {items.length === 1 ? "link" : "links"}
                    </span>
                    {folder ? (
                      <>
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label="Rename folder"
                          onClick={() => {
                            const next = window.prompt("Rename folder", folder);
                            if (next !== null) renameFolder.mutate({ from: folder, to: next });
                          }}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label="Remove folder"
                          onClick={() => renameFolder.mutate({ from: folder, to: "" })}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </>
                    ) : null}
                  </div>

                  <ul className="divide-y divide-border">
                    {items.length === 0 ? (
                      <li className="px-3 py-3 text-sm text-muted-foreground">
                        Empty folder — add a link above and choose “{folder}”.
                      </li>
                    ) : (
                      items.map((link) => {
                        const index = links.findIndex((l) => l.id === link.id);
                        return (
                          <li key={link.id} className="px-3 py-3">
                            {editingLink?.id === link.id ? (
                              <div className="grid gap-2 sm:grid-cols-[130px_1fr_1fr]">
                                <Select
                                  value={editingLink.platform}
                                  onValueChange={(platform) =>
                                    setEditingLink({ ...editingLink, platform })
                                  }
                                >
                                  <SelectTrigger aria-label="Link type"><SelectValue /></SelectTrigger>
                                  <SelectContent>
                                    {PLATFORMS.map((p) => <SelectItem key={p.id} value={p.id}>{p.label}</SelectItem>)}
                                  </SelectContent>
                                </Select>
                                <Input
                                  aria-label="Link address"
                                  value={editingLink.url}
                                  maxLength={500}
                                  onChange={(e) => setEditingLink({ ...editingLink, url: e.target.value })}
                                />
                                <Input
                                  aria-label="Link label"
                                  placeholder="Label (optional)"
                                  value={editingLink.label}
                                  maxLength={60}
                                  onChange={(e) => setEditingLink({ ...editingLink, label: e.target.value })}
                                />
                                <div className="flex flex-wrap gap-2 sm:col-span-3">
                                  <Select
                                    value={editingLink.group_name || NO_FOLDER}
                                    onValueChange={(value) =>
                                      setEditingLink({ ...editingLink, group_name: value === NO_FOLDER ? "" : value })
                                    }
                                  >
                                    <SelectTrigger className="w-44" aria-label="Folder"><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value={NO_FOLDER}>No folder</SelectItem>
                                      {folders.map((f) => <SelectItem key={f} value={f}>{f}</SelectItem>)}
                                    </SelectContent>
                                  </Select>
                                  <label className="flex items-center gap-2 rounded-md border border-border px-3 text-sm">
                                    <Switch
                                      checked={!!editingLink.icon_only}
                                      onCheckedChange={(icon_only) =>
                                        setEditingLink({ ...editingLink, icon_only })
                                      }
                                      aria-label="Show logo only"
                                    />
                                    <ImageIcon className="h-4 w-4 text-muted-foreground" />
                                    Show logo only
                                  </label>
                                  <Button onClick={() => updateLink.mutate(editingLink)} disabled={updateLink.isPending}>
                                    <Check className="h-4 w-4" /> Save changes
                                  </Button>
                                  <Button variant="ghost" onClick={() => setEditingLink(null)}>Cancel</Button>
                                </div>
                              </div>
                            ) : (
                              <div className="flex items-center gap-2">
                                <div className="min-w-0 flex-1">
                                  <p className="truncate text-sm font-medium">{link.label || link.platform}</p>
                                  <p className="truncate text-xs text-muted-foreground">
                                    {link.icon_only ? "Logo only · " : ""}
                                    {link.url}
                                  </p>
                                </div>
                                <Select
                                  value={link.group_name || NO_FOLDER}
                                  onValueChange={(value) => moveToFolder.mutate({ id: link.id, group_name: value === NO_FOLDER ? "" : value })}
                                >
                                  <SelectTrigger className="h-8 w-36 text-xs"><SelectValue /></SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value={NO_FOLDER}>No folder</SelectItem>
                                    {folders.map((f) => <SelectItem key={f} value={f}>{f}</SelectItem>)}
                                  </SelectContent>
                                </Select>
                                <Button
                                  variant={link.icon_only ? "secondary" : "ghost"}
                                  size="icon"
                                  onClick={() => updateLink.mutate({ ...link, icon_only: !link.icon_only })}
                                  aria-label={link.icon_only ? "Show logo and label" : "Show logo only"}
                                  title={link.icon_only ? "Showing logo only" : "Show logo only"}
                                >
                                  <ImageIcon className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="icon" onClick={() => setEditingLink({ ...link })} aria-label="Edit link">
                                  <Pencil className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="icon" onClick={() => moveLink.mutate({ index, dir: -1 })} aria-label="Move up">
                                  <ArrowUp className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="icon" onClick={() => moveLink.mutate({ index, dir: 1 })} aria-label="Move down">
                                  <ArrowDown className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="icon" onClick={() => removeLink.mutate(link.id)} aria-label="Delete link">
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            )}
                          </li>
                        );
                      })
                    )}
                  </ul>
                </div>
              ))}
            </div>
          </section>

          {/* Publish */}
          <section className="rounded-xl border border-border bg-card p-6">
            <h2 className="font-display text-lg">Publish</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Publishing puts your page online at a link you can set as your browser landing page.
            </p>

            <div className="mt-5 flex flex-wrap items-center gap-3">
              <Button
                disabled={publishPage.isPending || !form.slug}
                onClick={() => publishPage.mutate(!form.published)}
              >
                {form.published ? <Check className="mr-1 h-4 w-4" /> : null}
                {form.published ? "Published" : "Create & publish"}
              </Button>
              <Button variant="outline" onClick={handleDownload}>
                <Download className="mr-1 h-4 w-4" /> Download HTML
              </Button>
            </div>

            {form.published ? (
              <div className="mt-5 flex flex-wrap items-center gap-2 rounded-lg border border-border bg-background px-3 py-2">
                <code className="min-w-0 flex-1 truncate text-xs text-primary">{publicUrl}</code>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    navigator.clipboard.writeText(publicUrl);
                    toast.success("Link copied");
                  }}
                >
                  <Copy className="mr-1 h-4 w-4" /> Copy
                </Button>
                <Button variant="ghost" size="sm" asChild>
                  <a href={publicUrl} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="mr-1 h-4 w-4" /> Open
                  </a>
                </Button>
              </div>
            ) : null}

            <div className="mt-5 border-t border-border pt-5">
              <p className="text-sm text-muted-foreground">
                {form.published
                  ? "Now make this page open every time your browser starts."
                  : "Publish first, then follow the steps to open it every time your browser starts."}
              </p>
              <div className="mt-3">
                <LandingPageSetupGuide url={form.published ? publicUrl : undefined} />
              </div>
            </div>
          </section>
        </div>

        <aside className="lg:sticky lg:top-10 lg:h-fit">
          <p className="mb-3 text-xs uppercase tracking-[0.14em] text-muted-foreground">
            Live preview
          </p>
          <LivePagePreview profile={form} links={links} />
          <AdSpace />
        </aside>
      </main>
    </div>
  );
}
