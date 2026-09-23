import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  Camera,
  Check,
  ChevronDown,
  Clock3,
  Copy,
  Ellipsis,
  Eye,
  Folder,
  GripVertical,
  Link2,
  Menu,
  Monitor,
  Pencil,
  Plus,
  Search,
  Settings,
  ShieldCheck,
  Sparkles,
  Star,
  Trash2,
} from "lucide-react";
import { Brand } from "@/components/Brand";
import { ThemeToggle } from "@/components/ThemeToggle";
import { WorldClocks } from "@/components/WorldClocks";
import { HomeDashboard, type DashboardClock } from "@/components/workspace/HomeDashboard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { faviconFor, hostOf, normalizeUrl } from "@/lib/startpage";
import sampleProfilePhoto from "@/assets/sample-shreya-profile.jpg";

type DemoLink = {
  id: string;
  name: string;
  url: string;
  favourite?: boolean;
  iconOnly?: boolean;
};

type DemoFolder = { id: string; name: string; links: DemoLink[] };
type DemoTab = { id: string; name: string; folders: DemoFolder[] };
type DemoProfile = { id: string; name: string; displayName: string; tagline: string; avatarUrl: string | null; slug: string; protected: boolean; published: boolean; tabs: DemoTab[] };
type Selection =
  | { type: "link"; tabId: string; folderId: string; item: DemoLink }
  | { type: "folder"; tabId: string; item: DemoFolder }
  | { type: "settings" }
  | { type: "security" }
  | { type: "clocks" }
  | { type: "weather" }
  | null;

const uid = () => Math.random().toString(36).slice(2, 10);

const EMPTY_TAB: DemoTab = { id: "empty", name: "Home", folders: [] };
const EMPTY_PROFILE: DemoProfile = {
  id: "empty-profile",
  name: "My Space",
  displayName: "Your name",
  tagline: "A useful place for everything that matters.",
  avatarUrl: null,
  slug: "my-space",
  protected: false,
  published: false,
  tabs: [EMPTY_TAB],
};

const SAMPLE_PROFILES: DemoProfile[] = [
  {
    id: "my-space",
    name: "Personal",
    displayName: "Shreya",
    tagline: "Personal links, projects, and creative work.",
    avatarUrl: sampleProfilePhoto,
    slug: "shreya-personal",
    protected: true,
    published: true,
    tabs: [
      { id: "home", name: "Home", folders: [] },
      {
        id: "personal",
        name: "Personal",
        folders: [
          {
            id: "daily",
            name: "Everyday",
            links: [
              { id: "mail", name: "Gmail", url: "https://mail.google.com", favourite: true },
              { id: "calendar", name: "Google Calendar", url: "https://calendar.google.com", favourite: true },
              { id: "drive", name: "Google Drive", url: "https://drive.google.com" },
            ],
          },
          {
            id: "social",
            name: "Social",
            links: [
              { id: "linkedin", name: "LinkedIn", url: "https://linkedin.com" },
              { id: "instagram", name: "Instagram", url: "https://instagram.com", iconOnly: true },
            ],
          },
        ],
      },
      {
        id: "creativity",
        name: "Creativity",
        folders: [
          {
            id: "create",
            name: "Create",
            links: [
              { id: "canva", name: "Canva", url: "https://canva.com", favourite: true },
              { id: "audio", name: "Audio editor", url: "https://audiomass.co" },
              { id: "video", name: "Video editor", url: "https://clipchamp.com" },
            ],
          },
          {
            id: "publish",
            name: "Publish",
            links: [
              { id: "youtube", name: "YouTube Studio", url: "https://studio.youtube.com" },
            ],
          },
          {
            id: "resources",
            name: "Resources",
            links: [
              { id: "fonts", name: "Google Fonts", url: "https://fonts.google.com" },
              { id: "docs", name: "Reference documents", url: "https://docs.google.com" },
            ],
          },
        ],
      },
      { id: "work", name: "Work", folders: [] },
    ],
  },
  {
    id: "work-space",
    name: "Office",
    displayName: "Shreya",
    tagline: "Work tools, projects, and useful resources.",
    avatarUrl: null,
    slug: "shreya-office",
    protected: false,
    published: true,
    tabs: [
      { id: "work-home", name: "Home", folders: [] },
      {
        id: "projects",
        name: "Projects",
        folders: [
          {
            id: "planning",
            name: "Planning",
            links: [
              { id: "notion", name: "Notion", url: "https://notion.so" },
              { id: "sheets", name: "Google Sheets", url: "https://sheets.google.com" },
            ],
          },
        ],
      },
    ],
  },
];

function LinkRow({ link, editing, onSelect }: { link: DemoLink; editing: boolean; onSelect: () => void }) {
  const icon = faviconFor(link.url);
  return (
    <div className="group grid min-h-11 grid-cols-[18px_28px_minmax(0,1fr)_auto] items-center gap-2 border-t border-hub-border/70 px-2.5 first:border-t-0 hover:bg-hub-elevated/55">
      {editing ? (
        <GripVertical className="size-4 cursor-grab text-hub-muted opacity-50 group-hover:opacity-100" aria-label="Drag to reorder" />
      ) : (
        <span aria-hidden="true" />
      )}
      {icon ? (
        <img src={icon} alt="" className="size-6 rounded-sm" />
      ) : (
        <span className="grid size-6 place-items-center rounded-sm bg-hub-accent text-[10px] font-bold text-hub-background">
          {link.name.slice(0, 1).toUpperCase()}
        </span>
      )}
      <a
        href={editing ? undefined : normalizeUrl(link.url)}
        target={editing ? undefined : "_blank"}
        rel={editing ? undefined : "noopener noreferrer"}
        onClick={editing ? (event) => { event.preventDefault(); onSelect(); } : undefined}
        className="min-w-0 cursor-pointer rounded-sm py-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-hub-accent"
      >
        <span className="block truncate text-[13px] font-medium text-hub-foreground">{link.name}</span>
        <span className="block truncate text-[10px] text-hub-muted">{hostOf(link.url)}</span>
      </a>
      {link.favourite ? <Star className="size-3.5 fill-hub-accent text-hub-accent" aria-label="Favourite" /> : null}
      {editing ? (
        <Button variant="ghost" size="icon" className="size-7 text-hub-muted" onClick={onSelect} aria-label={`Edit ${link.name}`}>
          <Pencil className="size-3.5" />
        </Button>
      ) : null}
    </div>
  );
}

function FolderPanel({
  folder,
  editing,
  query,
  onSelectFolder,
  onSelectLink,
  onAddLink,
}: {
  folder: DemoFolder;
  editing: boolean;
  query: string;
  onSelectFolder: () => void;
  onSelectLink: (link: DemoLink) => void;
  onAddLink: () => void;
}) {
  const visible = folder.links.filter((link) =>
    `${link.name} ${hostOf(link.url)}`.toLowerCase().includes(query.toLowerCase()),
  );
  if (query && visible.length === 0) return null;
  return (
    <section className="break-inside-avoid overflow-hidden rounded-md border border-hub-border bg-hub-surface" aria-labelledby={`folder-${folder.id}`}>
      <header className="grid min-h-10 grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2 border-b border-hub-border bg-hub-elevated/45 px-3">
        <Folder className="size-4 text-hub-accent" aria-hidden="true" />
        <div className="flex min-w-0 items-center gap-2">
          <h2 id={`folder-${folder.id}`} className="truncate font-display text-xs font-semibold text-hub-foreground">{folder.name}</h2>
          <span className="text-[10px] tabular-nums text-hub-muted">{visible.length}</span>
        </div>
        {editing ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="size-7 text-hub-muted" aria-label={`${folder.name} menu`}>
                <Ellipsis className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onSelect={onAddLink}><Plus /> Add link</DropdownMenuItem>
              <DropdownMenuItem onSelect={onSelectFolder}><Pencil /> Rename folder</DropdownMenuItem>
              <DropdownMenuItem onSelect={onSelectFolder}><Copy /> Duplicate</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onSelect={onSelectFolder} className="text-destructive"><Trash2 /> Delete</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : null}
      </header>
      <div>
        {visible.length ? visible.map((link) => (
          <LinkRow key={link.id} link={link} editing={editing} onSelect={() => onSelectLink(link)} />
        )) : (
          <div className="px-3 py-5 text-center text-xs text-hub-muted">No links in this folder.</div>
        )}
      </div>
      {editing ? (
        <Button variant="ghost" size="sm" className="h-9 w-full justify-start rounded-none text-hub-muted hover:text-hub-accent" onClick={onAddLink}>
          <Plus className="size-3.5" /> Add link
        </Button>
      ) : null}
    </section>
  );
}

export function WorkspacePrototype() {
  const [profiles, setProfiles] = useState(SAMPLE_PROFILES);
  const [profileId, setProfileId] = useState("my-space");
  const profile = profiles.find((item) => item.id === profileId) ?? profiles[0] ?? EMPTY_PROFILE;
  const [tabId, setTabId] = useState("home");
  const tab = profile.tabs.find((item) => item.id === tabId) ?? profile.tabs[0] ?? EMPTY_TAB;
  const [query, setQuery] = useState("");
  const [preview, setPreview] = useState(false);
  const [selection, setSelection] = useState<Selection>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [draft, setDraft] = useState({ name: "", url: "" });
  const [dirty, setDirty] = useState(false);
  const [saveState, setSaveState] = useState<"saved" | "saving" | "error">("saved");
  const [addingLink, setAddingLink] = useState<{ tabId: string; folderId: string } | null>(null);
  const [pin, setPin] = useState("");
  const [clocks, setClocks] = useState<DashboardClock[]>([{ tz: "Europe/London", label: "London" }, { tz: "Asia/Kolkata", label: "New Delhi" }]);
  const [weatherCity, setWeatherCity] = useState("");
  const [clockDraft, setClockDraft] = useState({ label: "", tz: "" });
  const [weatherDraft, setWeatherDraft] = useState("");
  const [profileDraft, setProfileDraft] = useState({ pageName: "", displayName: "", tagline: "" });
  const [photoError, setPhotoError] = useState("");

  useEffect(() => {
    if (!dirty) return;
    const warn = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  const currentLinks = useMemo(() => tab.folders.flatMap((folder) => folder.links), [tab.folders]);
  const profileLinks = useMemo(() => profile.tabs.flatMap((profileTab) => profileTab.folders.flatMap((folder) => folder.links)), [profile.tabs]);

  function selectProfile(nextId: string) {
    if (dirty && !window.confirm("Discard the unsaved changes in the open drawer?")) return;
    const next = profiles.find((item) => item.id === nextId);
    if (!next) return;
    setProfileId(nextId);
    setTabId(next.tabs[0]?.id ?? "");
    setQuery("");
    setDirty(false);
    setDrawerOpen(false);
  }

  function openLink(tabIdValue: string, folderId: string, link?: DemoLink) {
    setAddingLink({ tabId: tabIdValue, folderId });
    setSelection(link ? { type: "link", tabId: tabIdValue, folderId, item: link } : null);
    setDraft(link ? { name: link.name, url: link.url } : { name: "", url: "" });
    setDirty(false);
    setDrawerOpen(true);
  }

  function openFolder(folder: DemoFolder) {
    setSelection({ type: "folder", tabId: tab.id, item: folder });
    setDraft({ name: folder.name, url: "" });
    setDirty(false);
    setDrawerOpen(true);
  }

  function updateProfile(mutator: (current: DemoProfile) => DemoProfile) {
    setProfiles((items) => items.map((item) => item.id === profile.id ? mutator(item) : item));
  }

  function saveDrawer() {
    if (!draft.name.trim()) {
      setSaveState("error");
      return;
    }
    if (selection?.type === "link" || addingLink) {
      if (!draft.url.trim()) {
        setSaveState("error");
        return;
      }
      const target = selection?.type === "link" ? selection : addingLink;
      if (!target) return;
      updateProfile((current) => ({
        ...current,
        tabs: current.tabs.map((currentTab) => currentTab.id !== target.tabId ? currentTab : {
          ...currentTab,
          folders: currentTab.folders.map((folder) => folder.id !== target.folderId ? folder : {
            ...folder,
            links: selection?.type === "link"
              ? folder.links.map((link) => link.id === selection.item.id ? { ...link, name: draft.name.trim(), url: normalizeUrl(draft.url) } : link)
              : [...folder.links, { id: uid(), name: draft.name.trim(), url: normalizeUrl(draft.url) }],
          }),
        }),
      }));
    } else if (selection?.type === "folder") {
      updateProfile((current) => ({
        ...current,
        tabs: current.tabs.map((currentTab) => currentTab.id !== selection.tabId ? currentTab : {
          ...currentTab,
          folders: currentTab.folders.map((folder) => folder.id === selection.item.id ? { ...folder, name: draft.name.trim() } : folder),
        }),
      }));
    }
    setSaveState("saving");
    setDirty(false);
    window.setTimeout(() => {
      setSaveState("saved");
      setDrawerOpen(false);
      setSelection(null);
      setAddingLink(null);
    }, 450);
  }

  function addFolder() {
    const next: DemoFolder = { id: uid(), name: "New folder", links: [] };
    updateProfile((current) => ({
      ...current,
      tabs: current.tabs.map((currentTab) => currentTab.id === tab.id ? { ...currentTab, folders: [...currentTab.folders, next] } : currentTab),
    }));
    openFolder(next);
  }

  function addTab() {
    const next: DemoTab = { id: uid(), name: `Tab ${profile.tabs.length + 1}`, folders: [] };
    updateProfile((current) => ({ ...current, tabs: [...current.tabs, next] }));
    setTabId(next.id);
  }

  function addProfile() {
    const id = uid();
    const next: DemoProfile = {
      id,
      name: "New page",
      displayName: "Your name",
      tagline: "A useful place for everything that matters.",
      avatarUrl: null,
      slug: `new-page-${profiles.length + 1}`,
      protected: false,
      published: false,
      tabs: [{ id: uid(), name: "Home", folders: [] }],
    };
    setProfiles((items) => [...items, next]);
    setProfileId(id);
    setTabId(next.tabs[0]?.id ?? "");
    setQuery("");
  }

  function publishProfile() {
    updateProfile((current) => ({ ...current, published: true }));
    setSaveState("saving");
    window.setTimeout(() => setSaveState("saved"), 600);
  }

  function openSettings() {
    setProfileDraft({ pageName: profile.name, displayName: profile.displayName, tagline: profile.tagline });
    setPhotoError("");
    setSelection({ type: "settings" });
    setDirty(false);
    setDrawerOpen(true);
  }

  function saveProfileDetails() {
    const pageName = profileDraft.pageName.trim();
    const displayName = profileDraft.displayName.trim();
    if (!pageName || !displayName) {
      setSaveState("error");
      return;
    }
    updateProfile((current) => ({ ...current, name: pageName, displayName, tagline: profileDraft.tagline.trim() }));
    setDirty(false);
    setSaveState("saving");
    window.setTimeout(() => { setSaveState("saved"); setDrawerOpen(false); }, 450);
  }

  function changeProfilePhoto(file: File | undefined) {
    if (!file) return;
    if (!file.type.startsWith("image/") || file.size > 5 * 1024 * 1024) {
      setPhotoError("Choose a JPG, PNG, WebP, or GIF image under 5 MB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result !== "string") return;
      updateProfile((current) => ({ ...current, avatarUrl: reader.result }));
      setPhotoError("");
      setSaveState("saved");
    };
    reader.readAsDataURL(file);
  }

  function openSecurity() {
    setSelection({ type: "security" });
    setDirty(false);
    setDrawerOpen(true);
  }

  function openClocks() {
    setSelection({ type: "clocks" });
    setClockDraft({ label: "", tz: "" });
    setDrawerOpen(true);
  }

  function openWeather() {
    setSelection({ type: "weather" });
    setWeatherDraft(weatherCity);
    setDrawerOpen(true);
  }

  function toggleProtection(checked: boolean) {
    updateProfile((current) => ({ ...current, protected: checked }));
    setSaveState("saving");
    window.setTimeout(() => setSaveState("saved"), 450);
  }

  return (
    <div className="dark min-h-screen bg-hub-background text-hub-foreground">
      <div className="flex min-h-screen flex-col">
        <header className="border-b border-hub-border bg-hub-surface">
          <div className="grid min-h-14 grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-3 sm:px-5">
            <div className="flex min-w-0 items-center gap-3">
              <Brand className="hidden shrink-0 text-sm md:inline-flex" />
              <div className="hidden h-5 w-px bg-hub-border xl:block" />
              <Select value={profile.id} onValueChange={selectProfile}>
                <SelectTrigger className="h-9 w-[168px] border-hub-border bg-hub-background text-hub-foreground sm:w-[210px]" aria-label="Select profile">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {profiles.map((item) => <SelectItem key={item.id} value={item.id}>{item.name}</SelectItem>)}
                </SelectContent>
              </Select>
              <Button variant="ghost" size="icon" className="size-8 shrink-0 text-hub-muted hover:text-hub-accent" onClick={addProfile} aria-label="Create another landing page"><Plus /></Button>
              <span className="hidden items-center gap-1.5 text-xs text-hub-muted md:inline-flex" role="status">
                {saveState === "saving" ? <Clock3 className="size-3.5" /> : saveState === "error" ? <span className="size-2 rounded-full bg-destructive" /> : <Check className="size-3.5 text-hub-accent" />}
                {saveState === "saving" ? "Saving…" : saveState === "error" ? "Needs attention" : "Saved"}
              </span>
            </div>
            <div className="flex shrink-0 items-center gap-1.5">
              <ThemeToggle />
              <Button variant="outline" size="sm" className="border-hub-border bg-hub-background px-2 text-hub-foreground hover:text-hub-foreground sm:px-3" onClick={openSecurity} aria-label="PIN and trusted browsers">
                <ShieldCheck /> <span className="hidden lg:inline">Security</span>{profile.protected ? <span className="size-1.5 rounded-full bg-hub-accent" aria-label="PIN protection is on" /> : null}
              </Button>
              <Button variant="outline" size="sm" className="hidden border-hub-border bg-hub-background text-hub-foreground hover:text-hub-foreground sm:inline-flex" onClick={() => setPreview((value) => !value)}>
                {preview ? <Pencil /> : <Eye />} {preview ? "Edit" : "Preview"}
              </Button>
              <Button size="sm" onClick={publishProfile}>
                {profile.published ? "Update" : "Publish"}
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="size-8 text-hub-muted" aria-label="Account menu"><Menu /></Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onSelect={openSettings}><Settings /> Profile settings</DropdownMenuItem>
                  <DropdownMenuItem onSelect={openSecurity}><ShieldCheck /> PIN & trusted browsers</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          <div className="grid grid-cols-[minmax(0,1fr)_auto] items-end gap-2 border-t border-hub-border px-3 sm:px-5">
            <nav className="flex min-w-0 gap-1 overflow-x-auto py-1" aria-label={`${profile.name} tabs`}>
              {profile.tabs.map((item) => (
                <Button
                  key={item.id}
                  variant="ghost"
                  size="sm"
                  className={`relative shrink-0 rounded-sm text-hub-muted hover:text-hub-foreground ${item.id === tab.id ? "bg-hub-elevated text-hub-foreground after:absolute after:inset-x-2 after:-bottom-1 after:h-0.5 after:bg-hub-accent" : ""}`}
                  onClick={() => { setTabId(item.id); setQuery(""); }}
                  aria-current={item.id === tab.id ? "page" : undefined}
                >
                  {item.name}
                </Button>
              ))}
            </nav>
            {!preview ? <Button variant="ghost" size="sm" className="mb-1 shrink-0 text-hub-muted hover:text-hub-accent" onClick={addTab}><Plus /> Add tab</Button> : null}
          </div>
        </header>

        <div className="flex min-h-0 flex-1">
          {!preview ? (
            <aside className="hidden w-48 shrink-0 border-r border-hub-border bg-hub-surface lg:block">
              <div className="p-3">
                <p className="px-2 pb-2 text-[10px] font-semibold uppercase text-hub-muted">This profile</p>
                <Button variant="secondary" className="h-9 w-full justify-start text-xs"><Monitor /> Page canvas</Button>
                <Button variant="ghost" className="mt-1 h-9 w-full justify-start text-xs text-hub-muted" onClick={openSettings}><Settings /> Settings</Button>
                <Button variant="ghost" className="mt-1 h-9 w-full justify-start text-xs text-hub-muted" onClick={openSecurity}><ShieldCheck /> PIN & access {profile.protected ? <span className="ml-auto size-1.5 rounded-full bg-hub-accent" /> : null}</Button>
                <div className="my-4 border-t border-hub-border" />
                <p className="px-2 pb-2 text-[10px] font-semibold uppercase text-hub-muted">Selected tab</p>
                {tab.folders.map((folder) => (
                  <Button key={folder.id} variant="ghost" className="h-8 w-full justify-start text-xs text-hub-muted" onClick={() => openFolder(folder)}><Folder /> <span className="truncate">{folder.name}</span></Button>
                ))}
                <Button variant="ghost" className="mt-1 h-8 w-full justify-start text-xs text-hub-accent" onClick={addFolder}><Plus /> Add folder</Button>
              </div>
            </aside>
          ) : null}

          <main className="min-w-0 flex-1 overflow-auto bg-hub-background">
            <div className="mx-auto w-full max-w-[1480px] px-3 py-5 sm:px-5 lg:px-7">
              {tab.name !== "Home" ? <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-4 border-b border-hub-border pb-4">
                <div className="flex min-w-0 items-center gap-3">
                  {profile.avatarUrl ? <img src={profile.avatarUrl} alt={`${profile.displayName} profile`} className="size-10 shrink-0 rounded-md border border-hub-border object-cover" /> : <span className="grid size-10 shrink-0 place-items-center rounded-md border border-hub-border bg-hub-elevated font-display text-sm font-semibold text-hub-accent">{profile.displayName.split(/\s+/).map((part) => part[0]).join("").slice(0, 2).toUpperCase() || "?"}</span>}
                  <div className="min-w-0">
                    <h1 className="truncate font-display text-xl font-semibold text-hub-foreground">{profile.name}</h1>
                    <p className="truncate text-xs text-hub-muted">{tab.name} · {currentLinks.length} links · <span className="text-hub-accent">{profile.published ? `/p/${profile.slug}` : "Not published yet"}</span></p>
                  </div>
                </div>
                <div className="relative w-44 sm:w-64">
                  <Search className="pointer-events-none absolute left-2.5 top-2.5 size-4 text-hub-muted" />
                  <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search links" aria-label="Search links in this profile" className="border-hub-border bg-hub-surface pl-9 text-hub-foreground" />
                </div>
              </div> : null}

              {tab.name === "Home" ? (
                <HomeDashboard profileId={profile.id} profileName={profile.name} displayName={profile.displayName} tagline={profile.tagline} avatarUrl={profile.avatarUrl} slug={profile.slug} published={profile.published} links={profileLinks} clocks={clocks} weatherCity={weatherCity} editing={!preview} onEditIdentity={openSettings} onEditClocks={openClocks} onEditWeather={openWeather} onPublish={publishProfile} />
              ) : tab.folders.length ? (
                <div className="mt-5 columns-1 gap-4 space-y-4 md:columns-2 xl:columns-3">
                  {tab.folders.map((folder) => (
                    <FolderPanel
                      key={folder.id}
                      folder={folder}
                      editing={!preview}
                      query={query}
                      onSelectFolder={() => openFolder(folder)}
                      onSelectLink={(link) => openLink(tab.id, folder.id, link)}
                      onAddLink={() => openLink(tab.id, folder.id)}
                    />
                  ))}
                  {!preview ? (
                    <Button variant="outline" className="min-h-20 w-full border-dashed border-hub-border bg-transparent text-hub-muted hover:text-hub-accent" onClick={addFolder}><Plus /> Add folder</Button>
                  ) : null}
                </div>
              ) : (
                <div className="mx-auto flex max-w-sm flex-col items-center py-24 text-center">
                  <span className="grid size-12 place-items-center rounded-md border border-hub-border bg-hub-surface text-hub-accent"><Folder /></span>
                  <h2 className="mt-4 font-display text-lg font-semibold">This tab is ready</h2>
                  <p className="mt-1 text-sm text-hub-muted">Add a folder, then place the links you use together inside it.</p>
                  {!preview ? <Button className="mt-5" onClick={addFolder}><Plus /> Add your first folder</Button> : null}
                </div>
              )}

              <footer className="mt-10 flex flex-col gap-2 border-t border-hub-border py-4 text-[10px] uppercase text-hub-muted sm:flex-row sm:justify-between">
                <span>{profile.name} · {tab.name}</span>
                <span>Built with Landing Page Builder by AuruNex</span>
              </footer>
            </div>
          </main>
        </div>
      </div>

      <Sheet open={drawerOpen} onOpenChange={(open) => { if (!open && dirty && !window.confirm("Discard your unsaved changes?")) return; setDrawerOpen(open); if (!open) { setDirty(false); setSelection(null); setAddingLink(null); } }}>
        <SheetContent className="dark w-full border-hub-border bg-hub-surface text-hub-foreground sm:max-w-md">
          <SheetHeader>
            <SheetTitle className="font-display text-hub-foreground">{selection?.type === "folder" ? "Folder settings" : selection?.type === "security" ? "PIN & trusted browsers" : selection?.type === "settings" ? "Profile settings" : selection?.type === "clocks" ? "World clocks" : selection?.type === "weather" ? "Weather" : selection?.type === "link" ? "Edit link" : "Add link"}</SheetTitle>
            <SheetDescription className="text-hub-muted">{selection?.type === "security" ? `Control access to the published ${profile.name} page.` : selection?.type === "settings" ? "Appearance, export and profile details live here." : selection?.type === "clocks" ? "Choose up to five clocks for this page." : selection?.type === "weather" ? "Set a city for this page. Live data requires a weather provider." : "Only the essentials are shown first."}</SheetDescription>
          </SheetHeader>
          {selection?.type === "security" ? (
            <div className="mt-6 space-y-4">
              <div className="rounded-md border border-hub-border bg-hub-background p-4">
                <div className="flex items-start justify-between gap-4">
                  <div><Label htmlFor="protect-page" className="flex items-center gap-2 text-sm font-semibold"><ShieldCheck className="size-4 text-hub-accent" /> Ask for PIN on {profile.name}</Label><p className="mt-1 text-xs leading-5 text-hub-muted">Each page can be locked separately. Your account uses one PIN across all locked pages.</p></div>
                  <Switch id="protect-page" checked={profile.protected} onCheckedChange={toggleProtection} />
                </div>
              </div>
              <div className="rounded-md border border-hub-border bg-hub-background p-4">
                <div className="flex items-center justify-between"><p className="text-sm font-semibold">Your 6-digit PIN</p><span className="flex items-center gap-1 text-xs text-hub-accent"><Check className="size-3.5" /> PIN is set</span></div>
                <p className="mt-1 text-xs text-hub-muted">Change it here. The PIN itself is never shown on your published page.</p>
                <Input value={pin} onChange={(event) => setPin(event.target.value.replace(/\D/g, "").slice(0, 6))} inputMode="numeric" maxLength={6} placeholder="New 6-digit PIN" aria-label="New six digit PIN" className="mt-3 max-w-48 border-hub-border bg-hub-surface font-mono text-base" />
                <Button size="sm" className="mt-3" disabled={pin.length !== 6}>Save PIN</Button>
              </div>
              <div className="rounded-md border border-hub-border bg-hub-background p-4">
                <p className="text-sm font-semibold">Trusted browsers</p>
                <p className="mt-1 text-xs leading-5 text-hub-muted">A trusted browser can open all your locked pages without asking again. Remove access whenever you need to.</p>
                <div className="mt-3 flex items-center gap-3 border-t border-hub-border pt-3"><Monitor className="size-4 text-hub-muted" /><div className="min-w-0 flex-1"><p className="text-sm">Chrome on Mac</p><p className="text-[10px] text-hub-muted">Trusted 20 Sep · last used today</p></div><Button variant="ghost" size="sm" className="text-hub-muted">Remove</Button></div>
              </div>
              <div className="rounded-md border border-hub-border bg-hub-elevated/35 p-4 text-xs leading-5 text-hub-muted"><strong className="text-hub-foreground">How it works:</strong> a new browser enters the PIN once, then can be trusted. Other browsers continue to ask for it.</div>
            </div>
          ) : selection?.type === "clocks" ? (
            <div className="mt-6 space-y-4">
              <div className="space-y-2">{clocks.map((clock) => <div key={`${clock.tz}-${clock.label}`} className="flex items-center gap-3 rounded-md border border-hub-border bg-hub-background p-3"><Clock3 className="size-4 text-hub-accent" /><div className="min-w-0 flex-1"><p className="text-sm font-medium">{clock.label}</p><p className="truncate text-xs text-hub-muted">{clock.tz}</p></div><Button variant="ghost" size="icon" className="size-8 text-hub-muted" onClick={() => setClocks((items) => items.filter((item) => item !== clock))} disabled={clocks.length === 1} aria-label={`Remove ${clock.label}`}><Trash2 /></Button></div>)}</div>
              {clocks.length < 5 ? <div className="rounded-md border border-hub-border bg-hub-background p-4"><Label htmlFor="clock-label">City label</Label><Input id="clock-label" value={clockDraft.label} onChange={(event) => setClockDraft({ ...clockDraft, label: event.target.value })} placeholder="Singapore" className="mt-2 border-hub-border bg-hub-surface" /><Label htmlFor="clock-zone" className="mt-3 block">Time zone</Label><Input id="clock-zone" value={clockDraft.tz} onChange={(event) => setClockDraft({ ...clockDraft, tz: event.target.value })} placeholder="Asia/Singapore" className="mt-2 border-hub-border bg-hub-surface" /><Button size="sm" className="mt-3" disabled={!clockDraft.label.trim() || !clockDraft.tz.trim()} onClick={() => { try { new Intl.DateTimeFormat("en", { timeZone: clockDraft.tz }).format(); setClocks((items) => [...items, { label: clockDraft.label.trim(), tz: clockDraft.tz.trim() }]); setClockDraft({ label: "", tz: "" }); } catch { setSaveState("error"); } }}><Plus /> Add clock</Button>{saveState === "error" ? <p className="mt-2 text-xs text-destructive">Enter a valid time zone, such as Europe/London.</p> : null}</div> : null}
            </div>
          ) : selection?.type === "weather" ? (
            <div className="mt-6 rounded-md border border-hub-border bg-hub-background p-4"><Label htmlFor="weather-city">City</Label><Input id="weather-city" value={weatherDraft} onChange={(event) => setWeatherDraft(event.target.value.slice(0, 80))} placeholder="London" className="mt-2 border-hub-border bg-hub-surface" /><p className="mt-3 text-xs leading-5 text-hub-muted">The city will be saved now. Live conditions remain unavailable until a weather provider is configured.</p><div className="mt-4 flex gap-2"><Button size="sm" onClick={() => { setWeatherCity(weatherDraft.trim()); setDrawerOpen(false); setSaveState("saved"); }}>Save city</Button><Button variant="ghost" size="sm" className="text-hub-muted" onClick={() => setWeatherDraft("")}>Clear</Button></div></div>
          ) : selection?.type === "settings" ? (
            <div className="mt-6 space-y-5">
              <div className="rounded-md border border-hub-border bg-hub-background p-4">
                <div className="flex items-center gap-4">
                  {profile.avatarUrl ? <img src={profile.avatarUrl} alt={`${profile.displayName} profile`} className="size-16 rounded-md border border-hub-border object-cover" /> : <span className="grid size-16 place-items-center rounded-md border border-hub-border bg-hub-elevated font-display text-xl font-semibold text-hub-accent">{profile.displayName.split(/\s+/).map((part) => part[0]).join("").slice(0, 2).toUpperCase() || "?"}</span>}
                  <div className="flex flex-wrap gap-2"><Label htmlFor="profile-photo" className="inline-flex h-9 cursor-pointer items-center gap-2 rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground"><Camera className="size-4" /> {profile.avatarUrl ? "Change picture" : "Add picture"}</Label><input id="profile-photo" type="file" accept="image/png,image/jpeg,image/webp,image/gif" className="sr-only" onChange={(event) => changeProfilePhoto(event.target.files?.[0])} />{profile.avatarUrl ? <Button variant="ghost" size="sm" className="text-hub-muted" onClick={() => updateProfile((current) => ({ ...current, avatarUrl: null }))}>Remove</Button> : null}</div>
                </div>
                {photoError ? <p role="alert" className="mt-3 text-xs text-destructive">{photoError}</p> : <p className="mt-3 text-xs leading-5 text-hub-muted">No picture? Your initials appear automatically.</p>}
              </div>
              <div className="space-y-4 rounded-md border border-hub-border bg-hub-background p-4">
                <div className="space-y-1.5"><Label htmlFor="profile-display-name">Your display name</Label><Input id="profile-display-name" value={profileDraft.displayName} onChange={(event) => { setProfileDraft({ ...profileDraft, displayName: event.target.value }); setDirty(true); }} maxLength={60} className="border-hub-border bg-hub-surface" /></div>
                <div className="space-y-1.5"><Label htmlFor="profile-tagline">Short introduction</Label><Input id="profile-tagline" value={profileDraft.tagline} onChange={(event) => { setProfileDraft({ ...profileDraft, tagline: event.target.value }); setDirty(true); }} maxLength={120} className="border-hub-border bg-hub-surface" /></div>
                <div className="space-y-1.5"><Label htmlFor="profile-page-name">Page name</Label><Input id="profile-page-name" value={profileDraft.pageName} onChange={(event) => { setProfileDraft({ ...profileDraft, pageName: event.target.value }); setDirty(true); }} maxLength={50} className="border-hub-border bg-hub-surface" /></div>
                {saveState === "error" ? <p role="alert" className="text-xs text-destructive">Add both your display name and page name.</p> : null}
                <Button onClick={saveProfileDetails}>Save profile</Button>
              </div>
              <div className="rounded-md border border-hub-border bg-hub-background p-3"><p className="text-xs text-hub-muted">Published address</p><p className="mt-1 truncate font-mono text-xs text-hub-foreground">landingpagebuilder.aurunex.com/p/{profile.slug}</p></div>
              <div className="grid gap-2 sm:grid-cols-2"><Button variant="outline" className="justify-start border-hub-border bg-hub-background text-hub-foreground"><Sparkles /> Appearance</Button><Button variant="outline" className="justify-start border-hub-border bg-hub-background text-hub-foreground"><Copy /> Export HTML</Button></div>
            </div>
          ) : (
            <form className="mt-6 space-y-4" onSubmit={(event) => { event.preventDefault(); saveDrawer(); }}>
              {(selection?.type === "link" || addingLink) ? (
                <div className="space-y-1.5"><Label htmlFor="demo-url">URL</Label><Input id="demo-url" autoFocus value={draft.url} placeholder="https://example.com" onChange={(event) => { setDraft({ ...draft, url: event.target.value }); setDirty(true); setSaveState("saved"); }} className="border-hub-border bg-hub-background" /></div>
              ) : null}
              <div className="space-y-1.5"><Label htmlFor="demo-name">Display name</Label><Input id="demo-name" autoFocus={selection?.type === "folder"} value={draft.name} placeholder="Name" onChange={(event) => { setDraft({ ...draft, name: event.target.value }); setDirty(true); setSaveState("saved"); }} className="border-hub-border bg-hub-background" /></div>
              {(selection?.type === "link" || addingLink) ? (
                <details className="rounded-md border border-hub-border bg-hub-background p-3 text-sm"><summary className="cursor-pointer font-medium text-hub-muted">Optional settings</summary><div className="mt-3 space-y-2 text-xs text-hub-muted"><p>Move to another folder</p><p>Show logo only</p><p>Mark as favourite</p></div></details>
              ) : null}
              {saveState === "error" ? <p role="alert" className="text-sm text-destructive">Complete the required fields before saving.</p> : null}
              <div className="flex gap-2 pt-2"><Button type="submit" disabled={saveState === "saving"}>{saveState === "saving" ? "Saving…" : "Save"}</Button><Button type="button" variant="ghost" className="text-hub-muted" onClick={() => setDrawerOpen(false)}>Cancel</Button></div>
            </form>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}