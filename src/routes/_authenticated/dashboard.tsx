import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import {
  ArrowDown,
  ArrowUp,
  Check,
  Copy,
  Download,
  ExternalLink,
  LogOut,
  Plus,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
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
import { StartPageView } from "@/components/StartPageView";
import {
  PLATFORMS,
  isSafeUrl,
  normalizeUrl,
  renderStartPageHtml,
  slugify,
  type StartPageLink,
  type StartPageProfile,
} from "@/lib/startpage";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Your start page — AntLabs" },
      {
        name: "description",
        content: "Add your accounts, pick a theme, and publish your personal browser start page.",
      },
      { property: "og:title", content: "Your start page — AntLabs" },
      { property: "og:description", content: "Add your accounts and publish your start page." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Dashboard,
});

type ProfileRow = StartPageProfile & { id: string; published: boolean };

function Dashboard() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const profileQuery = useQuery({
    queryKey: ["profile"],
    queryFn: async (): Promise<ProfileRow> => {
      const { data: userData } = await supabase.auth.getUser();
      const user = userData.user!;
      const existing = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();
      if (existing.error) throw existing.error;
      if (existing.data) return existing.data as ProfileRow;

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
      return created.data as ProfileRow;
    },
  });

  const linksQuery = useQuery({
    queryKey: ["links"],
    queryFn: async (): Promise<StartPageLink[]> => {
      const { data, error } = await supabase
        .from("links")
        .select("id, platform, label, url, group_name, position")
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

  const moveLink = useMutation({
    mutationFn: async ({ index, dir }: { index: number; dir: -1 | 1 }) => {
      const target = index + dir;
      if (target < 0 || target >= links.length) return;
      const a = links[index]!;
      const b = links[target]!;
      const updates = [
        supabase.from("links").update({ position: target }).eq("id", a.id),
        supabase.from("links").update({ position: index }).eq("id", b.id),
      ];
      await Promise.all(updates);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["links"] }),
  });

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
            Ant<span className="text-primary">Labs</span>
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

      <main className="mx-auto grid max-w-6xl gap-8 px-5 py-10 lg:grid-cols-[1fr_420px]">
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
                <Label htmlFor="slug">Page address</Label>
                <Input
                  id="slug"
                  value={form.slug}
                  maxLength={40}
                  onChange={(e) => setForm({ ...form, slug: slugify(e.target.value) })}
                  onBlur={() => form.slug && saveProfile.mutate({ slug: form.slug })}
                />
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
                <Label htmlFor="avatar">Photo link (optional)</Label>
                <Input
                  id="avatar"
                  value={form.avatar_url ?? ""}
                  maxLength={500}
                  placeholder="https://…"
                  onChange={(e) => setForm({ ...form, avatar_url: e.target.value })}
                  onBlur={() =>
                    saveProfile.mutate({
                      avatar_url:
                        form.avatar_url && isSafeUrl(form.avatar_url)
                          ? normalizeUrl(form.avatar_url)
                          : null,
                    })
                  }
                />
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

          {/* Links */}
          <section className="rounded-xl border border-border bg-card p-6">
            <h2 className="font-display text-lg">Your links</h2>

            <div className="mt-4 grid gap-3 sm:grid-cols-[150px_1fr_150px_auto]">
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
              <Input
                className="sm:col-span-4"
                placeholder="Group (optional) — e.g. Social, Work, Reading"
                value={newLink.group_name}
                maxLength={40}
                onChange={(e) => setNewLink({ ...newLink, group_name: e.target.value })}
              />
            </div>

            <ul className="mt-6 space-y-2">
              {links.length === 0 ? (
                <li className="text-sm text-muted-foreground">
                  Nothing yet. Add your first account above.
                </li>
              ) : (
                links.map((link, index) => (
                  <li
                    key={link.id}
                    className="flex items-center gap-3 rounded-lg border border-border bg-background px-3 py-2"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">
                        {link.label || link.platform}
                        {link.group_name ? (
                          <span className="ml-2 rounded bg-secondary px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-muted-foreground">
                            {link.group_name}
                          </span>
                        ) : null}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">{link.url}</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => moveLink.mutate({ index, dir: -1 })}
                      aria-label="Move up"
                    >
                      <ArrowUp className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => moveLink.mutate({ index, dir: 1 })}
                      aria-label="Move down"
                    >
                      <ArrowDown className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeLink.mutate(link.id)}
                      aria-label="Delete link"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </li>
                ))
              )}
            </ul>
          </section>

          {/* Publish */}
          <section className="rounded-xl border border-border bg-card p-6">
            <h2 className="font-display text-lg">Publish</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Publishing puts your page online at a link you can set as your browser homepage.
            </p>

            <div className="mt-5 flex flex-wrap items-center gap-3">
              <Button
                onClick={() => {
                  const published = !form.published;
                  setForm({ ...form, published });
                  saveProfile.mutate({ published });
                  toast.success(published ? "Your page is live" : "Your page is now private");
                }}
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
          </section>
        </div>

        <aside className="lg:sticky lg:top-10 lg:h-fit">
          <p className="mb-3 text-xs uppercase tracking-[0.14em] text-muted-foreground">
            Live preview
          </p>
          <div className="overflow-hidden rounded-xl border border-border">
            <StartPageView profile={form} links={links} compact />
          </div>
        </aside>
      </main>
    </div>
  );
}
