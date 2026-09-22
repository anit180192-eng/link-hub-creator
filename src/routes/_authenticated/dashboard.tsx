import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { z } from "zod";
import {
  ArrowDown,
  ArrowUp,
  Check,
  CircleDashed,
  Clock3,
  Copy,
  Download,
  ExternalLink,
  FilePlus2,
  Folder,
  FolderPlus,
  Image as ImageIcon,
  Lock,
  LogOut,
  Pencil,
  Plus,
  Trash2,
  X,
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
import { Brand } from "@/components/Brand";
import { AdSpace } from "@/components/AdSpace";
import { CollapsibleSection } from "@/components/CollapsibleSection";
import { PinSecurityPanel } from "@/components/PinSecurityPanel";
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

const searchSchema = z.object({ page: z.string().max(64).optional() });

export const Route = createFileRoute("/_authenticated/dashboard")({
  staticData: { sitemap: false },
  validateSearch: (search) => searchSchema.parse(search),
  head: () => ({
    meta: [
      { title: "Your landing pages — Landing Page Builder" },
      {
        name: "description",
        content: "Create landing pages for personal, office and more, each with its own link.",
      },
      { property: "og:title", content: "Your landing pages — Landing Page Builder" },
      { property: "og:description", content: "Create several landing pages, each with its own link." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Dashboard,
});

type ProfileRow = StartPageProfile & {
  id: string;
  user_id: string;
  name: string;
  published: boolean;
  pin_protected?: boolean;
};

const NO_FOLDER = "__none__";
const MAX_PAGES = 10;

function randomSuffix() {
  return Math.random().toString(36).slice(2, 6);
}

function DashboardHeader({ onSignOut }: { onSignOut?: () => void }) {
  return (
    <header className="border-b border-border">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4">
        <Link to="/" aria-label="Landing Page Builder home">
          <Brand className="text-lg" />
        </Link>
        <div className="flex items-center gap-2">
          <Button asChild variant="ghost" size="sm">
            <Link to="/setup">Setup guide</Link>
          </Button>
          {onSignOut ? (
            <Button variant="outline" size="sm" onClick={onSignOut}>
              <LogOut className="mr-1 h-4 w-4" /> Sign out
            </Button>
          ) : null}
        </div>
      </div>
    </header>
  );
}

function Dashboard() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const search = Route.useSearch();

  const pagesQuery = useQuery({
    queryKey: ["pages"],
    queryFn: async (): Promise<ProfileRow[]> => {
      const { data: userData } = await supabase.auth.getUser();
      const user = userData.user;
      if (!user) throw new Error("Please sign in again");
      const existing = await supabase
        .from("pages")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: true });
      if (existing.error) throw existing.error;
      if (existing.data.length) return existing.data as unknown as ProfileRow[];

      const base = slugify(user.email?.split("@")[0] ?? "me") || "me";
      const created = await supabase
        .from("pages")
        .insert({
          user_id: user.id,
          name: "Personal",
          slug: `${base}-${user.id.slice(0, 4)}`,
          display_name: user.user_metadata?.["full_name"] ?? base,
        })
        .select("*")
        .single();
      if (created.error) throw created.error;
      return [created.data as unknown as ProfileRow];
    },
  });

  const pages = pagesQuery.data ?? [];
  const profile = pages.find((p) => p.id === search.page) ?? pages[0];

  const linksQuery = useQuery({
    queryKey: ["links", profile?.id],
    enabled: !!profile?.id,
    queryFn: async (): Promise<StartPageLink[]> => {
      const { data, error } = await supabase
        .from("links")
        .select("id, platform, label, url, group_name, position, icon_only")
        .eq("page_id", profile!.id)
        .order("position", { ascending: true });
      if (error) throw error;
      return (data ?? []) as StartPageLink[];
    },
  });

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
  const [creatingPage, setCreatingPage] = useState(false);
  const [newPage, setNewPage] = useState({ name: "", slug: "" });

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

  function selectPage(id: string) {
    setEditingLink(null);
    setExtraFolders([]);
    setNewLink((prev) => ({ ...prev, label: "", url: "", group_name: "" }));
    navigate({ to: "/dashboard", search: { page: id }, replace: true });
  }

  const createPage = useMutation({
    mutationFn: async () => {
      if (!profile) return null;
      if (pages.length >= MAX_PAGES) throw new Error(`You can have up to ${MAX_PAGES} pages`);
      const name = newPage.name.trim().slice(0, 40);
      if (!name) throw new Error("Give your new page a name, e.g. Office");
      const slug =
        slugify(newPage.slug) ||
        `${slugify(`${form?.slug.split("-")[0] ?? "me"}-${name}`)}-${randomSuffix()}`;
      const { data, error } = await supabase
        .from("pages")
        .insert({
          user_id: profile.user_id,
          name,
          slug: slug.slice(0, 40),
          display_name: profile.display_name,
          avatar_url: profile.avatar_url,
          theme: profile.theme,
          dark_mode: profile.dark_mode,
        })
        .select("id")
        .single();
      if (error) throw error;
      return data.id;
    },
    onSuccess: async (id) => {
      setCreatingPage(false);
      setNewPage({ name: "", slug: "" });
      await queryClient.invalidateQueries({ queryKey: ["pages"] });
      if (id) selectPage(id);
      toast.success("New page created");
    },
    onError: (e: Error) =>
      toast.error(
        e.message.includes("duplicate")
          ? "That link address is already taken. Choose another."
          : e.message,
      ),
  });

  const deletePage = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("pages").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: async () => {
      const next = pages.find((p) => p.id !== profile?.id);
      await queryClient.invalidateQueries({ queryKey: ["pages"] });
      if (next) selectPage(next.id);
      toast.success("Page deleted");
    },
    onError: () => toast.error("Couldn't delete that page"),
  });

  const saveProfile = useMutation({
    mutationFn: async (patch: Partial<ProfileRow>) => {
      if (!profile) return;
      const { error } = await supabase.from("pages").update(patch).eq("id", profile.id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["pages"] }),
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
      const path = `${profile.user_id}/page-${profile.id}-${Date.now()}.${ext}`;
      const up = await supabase.storage
        .from("avatars")
        .upload(path, file, { upsert: true, contentType: file.type });
      if (up.error) throw up.error;
      const signed = await supabase.storage
        .from("avatars")
        .createSignedUrl(path, 60 * 60 * 24 * 365 * 10);
      if (signed.error) throw signed.error;
      const { error } = await supabase
        .from("pages")
        .update({ avatar_url: signed.data.signedUrl })
        .eq("id", profile.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Photo updated");
      queryClient.invalidateQueries({ queryKey: ["pages"] });
    },
    onError: (e: Error) => toast.error(e.message || "Couldn't upload that photo"),
  });

  const addLink = useMutation({
    mutationFn: async () => {
      if (!profile) return;
      if (!isSafeUrl(newLink.url)) throw new Error("Enter a valid web address");
      const { error } = await supabase.from("links").insert({
        user_id: profile.user_id,
        page_id: profile.id,
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
      await Promise.all([
        supabase.from("links").update({ position: target }).eq("id", a.id),
        supabase.from("links").update({ position: index }).eq("id", b.id),
      ]);
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
      if (!profile) return;
      const clean = to.trim().slice(0, 40);
      const { error } = await supabase
        .from("links")
        .update({ group_name: clean })
        .eq("page_id", profile.id)
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
      if (!profile || !slug) throw new Error("Choose a link address before publishing");
      const { error } = await supabase
        .from("pages")
        .update({ slug, published })
        .eq("id", profile.id);
      if (error) throw error;
      return { published, slug };
    },
    onSuccess: ({ published, slug }) => {
      setForm((current) => (current ? { ...current, slug, published } : current));
      queryClient.invalidateQueries({ queryKey: ["pages"] });
      toast.success(published ? "This page is live at its own link" : "This page is now private");
    },
    onError: (e: Error) =>
      toast.error(
        e.message.includes("duplicate")
          ? "That link address is already taken. Choose another."
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

  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const publicUrl = form ? `${origin}/p/${form.slug}` : "";

  if (pagesQuery.isError) {
    return (
      <div className="min-h-screen">
        <DashboardHeader onSignOut={handleSignOut} />
        <p className="px-5 py-20 text-center text-sm text-muted-foreground">
          We couldn't load your pages. Refresh to try again.
        </p>
      </div>
    );
  }

  if (pagesQuery.isLoading || !form || !profile) {
    return (
      <div className="min-h-screen">
        <DashboardHeader />
        <p className="px-5 py-20 text-center text-sm text-muted-foreground">
          Loading your pages…
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <DashboardHeader onSignOut={handleSignOut} />

      <section className="mx-auto max-w-7xl px-5 pt-8">
        <PinSecurityPanel
          pageName={form.name}
          pageProtected={!!form.pin_protected}
          toggling={saveProfile.isPending}
          onToggle={(pin_protected) => {
            setForm({ ...form, pin_protected });
            saveProfile.mutate(
              { pin_protected },
              {
                onSuccess: () =>
                  toast.success(pin_protected ? "This page now asks for your PIN" : "PIN turned off for this page"),
              },
            );
          }}
        />
      </section>

      {/* Page switcher */}
      <section className="mx-auto max-w-7xl px-5 pt-6">
        <CollapsibleSection
          title="Your landing pages"
          headingId="pages-heading"
          subtitle="Make one page for personal use, another for the office, and so on. Every page has its own link."
          collapsedBadge={
            <span className="rounded-full border border-border px-2 py-0.5 text-xs text-muted-foreground">
              {pages.length} {pages.length === 1 ? "page" : "pages"}
            </span>
          }
          actions={
            <Button
              variant="outline"
              disabled={pages.length >= MAX_PAGES}
              onClick={() => setCreatingPage((v) => !v)}
              aria-expanded={creatingPage}
            >
              {creatingPage ? <X className="mr-1 h-4 w-4" /> : <FilePlus2 className="mr-1 h-4 w-4" />}
              {creatingPage ? "Cancel" : "New page"}
            </Button>
          }
        >
          <div className="flex flex-wrap gap-2" role="tablist" aria-label="Your pages">
            {pages.map((page) => {
              const active = page.id === profile.id;
              return (
                <button
                  key={page.id}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => selectPage(page.id)}
                  className={`flex min-w-[160px] flex-col items-start rounded-lg border px-3 py-2 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                    active
                      ? "border-primary bg-primary/10"
                      : "border-border bg-background hover:border-primary/60 hover:bg-secondary"
                  }`}
                >
                  <span className="text-sm font-semibold text-foreground">{page.name || "Untitled page"}</span>
                  <span className="mt-0.5 max-w-[220px] truncate text-xs text-muted-foreground">/p/{page.slug}</span>
                  <span className={`mt-1.5 inline-flex items-center gap-1 text-[11px] font-medium ${page.published ? "text-accent" : "text-muted-foreground"}`}>
                    {page.published ? <Check className="h-3 w-3" aria-hidden="true" /> : <CircleDashed className="h-3 w-3" aria-hidden="true" />}
                    {page.published ? "Live" : "Draft"}
                    {page.pin_protected ? (
                      <span className="ml-1.5 inline-flex items-center gap-1 text-muted-foreground">
                        <Lock className="h-3 w-3" aria-hidden="true" /> PIN
                      </span>
                    ) : null}
                  </span>
                </button>
              );
            })}
          </div>

          {creatingPage ? (
            <form
              className="mt-4 grid gap-3 rounded-lg border border-border bg-background p-4 sm:grid-cols-[1fr_1fr_auto] sm:items-end"
              onSubmit={(e) => {
                e.preventDefault();
                createPage.mutate();
              }}
            >
              <div className="space-y-1.5">
                <Label htmlFor="new-page-name">Page name</Label>
                <Input
                  id="new-page-name"
                  autoFocus
                  placeholder="e.g. Office"
                  maxLength={40}
                  value={newPage.name}
                  onChange={(e) => setNewPage({ ...newPage, name: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="new-page-slug">Link address (optional)</Label>
                <Input
                  id="new-page-slug"
                  placeholder="e.g. shreya-office"
                  maxLength={40}
                  value={newPage.slug}
                  onChange={(e) => setNewPage({ ...newPage, slug: slugify(e.target.value) })}
                />
              </div>
              <Button type="submit" disabled={createPage.isPending}>
                <Plus className="mr-1 h-4 w-4" /> {createPage.isPending ? "Creating…" : "Create page"}
              </Button>
              <p className="text-xs text-muted-foreground sm:col-span-3">
                Your new page starts empty and private. Its link will be /p/
                {newPage.slug || "chosen-for-you"}. You can change it any time before publishing.
              </p>
            </form>
          ) : null}
        </CollapsibleSection>
      </section>

      <main className="mx-auto grid max-w-7xl gap-8 px-5 py-10 lg:grid-cols-[minmax(0,1fr)_480px]">
        <div className="space-y-8">
          {/* Profile */}
          <CollapsibleSection
            title={<>Editing: <span className="text-primary">{form.name || "Untitled page"}</span></>}
            collapsedBadge={
              <span className="rounded-full border border-border px-2 py-0.5 text-xs text-muted-foreground">
                {form.published ? "Live" : "Draft"}
              </span>
            }
            actions={
              <Button
                type="button"
                variant="ghost"
                size="sm"
                disabled={pages.length <= 1 || deletePage.isPending}
                title={pages.length <= 1 ? "You need at least one page" : undefined}
                onClick={() => {
                  if (
                    window.confirm(
                      `Delete the page "${form.name || form.slug}" and all its links? Its link will stop working.`,
                    )
                  ) {
                    deletePage.mutate(profile.id);
                  }
                }}
              >
                <Trash2 className="mr-1 h-4 w-4" /> Delete page
              </Button>
            }
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="page-name">Page name (only you see this)</Label>
                <Input
                  id="page-name"
                  value={form.name}
                  maxLength={40}
                  placeholder="e.g. Personal, Office"
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  onBlur={() => saveProfile.mutate({ name: form.name.trim() || "My page" })}
                />
              </div>
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
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="slug">This page's link address</Label>
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
