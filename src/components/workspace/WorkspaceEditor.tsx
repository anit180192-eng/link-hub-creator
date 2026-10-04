import { publicPageUrl } from "@/lib/public-page-url";
import { SOCIAL_PLATFORMS, parseSocialLinks, socialName, socialUrl, type SocialLink } from "@/lib/social-links";
import { useDragOrder } from "./useDragOrder";
import { moveItem, orderLinksByFolders } from "@/lib/reorder";
import { folderName } from "@/lib/folder-names";
import {
  ColourModeToggle,
  ThemePresets,
  useSavedMode,
} from "@/components/ColourControls";
import { readPageTheme, writePageTheme, themeStyle } from "@/lib/page-themes";
import { ExtensionImportDialog } from "./ExtensionImportDialog";
import { useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import {
  Check,
  Clock3,
  Copy,
  Download,
  ExternalLink,
  Ellipsis,
  Eye,
  Folder,
  GripVertical,
  ArrowUp,
  ArrowDown,
  Image as ImageIcon,
  LogOut,
  Monitor,
  Pencil,
  Plus,
  Search,
  Settings,
  ShieldCheck,
  Sparkles,
  Star,
  Trash2,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";
import { BuilderShell } from "./BuilderShell";
import { BuilderTabs } from "./BuilderTabs";
import { LinkCommentButton } from "@/components/LinkCommentButton";
import { IncognitoLinkButton } from "@/components/IncognitoLinkButton";
import { commentWordCount, type LinkComment } from "@/lib/link-comments";
import { TAB_COLORS, tabColorStyle } from "@/lib/tab-color";
import { PublishedTabs } from "@/components/PublishedTabs";
import { WIDGETS, parseWidgets, type HomeWidget } from "@/lib/home-widgets";
import { HomeDashboard } from "@/components/workspace/HomeDashboard";
import { GuidedTour, type TourStep } from "@/components/workspace/GuidedTour";
import { PinSecurityPanel } from "@/components/PinSecurityPanel";
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
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { SaveCurrentPageDialog } from "@/components/workspace/SaveCurrentPageDialog";
import { LandingPageSetupGuide } from "@/components/LandingPageSetupGuide";
import {
  MAX_CLOCKS,
  TIMEZONES,
  faviconFor,
  hostOf,
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

type PageRow = Omit<StartPageProfile, "clocks"> & {
  notepad_enabled: boolean;
  notepad_content: string;
  landing_tab: string;
  home_tab_color: string | null;
  notepad_tab_color: string | null;
  id: string;
  user_id: string;
  name: string;
  published: boolean;
  pin_protected: boolean;
  weather_city: string;
  clocks: Json;
  home_widgets: Json | null;
};
type TabRow = {
  id: string;
  page_id: string;
  user_id: string;
  name: string;
  position: number;
  tab_color: string | null;
};
type FolderRow = {
  id: string;
  page_id: string;
  tab_id: string;
  user_id: string;
  name: string;
  position: number;
};
type LinkRow = StartPageLink & { favourite: boolean; tab_id: string | null };
type Drawer =
  | "identity"
  | "appearance"
  | "security"
  | "widgets"
  | "clocks"
  | "link"
  | "folder"
  | "tab"
  | "publish"
  | null;
import { PremiumDialog } from "./PremiumDialog";
import { getBillingConfig } from "@/lib/billing.functions";
import {
  friendlyLimitError,
  isProfileArchived,
  isTabArchived,
  limitMessage,
  limitsFor,
  PREMIUM_PRICE_LABEL,
  type Plan,
} from "@/lib/plans";
const TOUR_STEPS: TourStep[] = [
  {
    selector: '[data-tour="profiles"]',
    title: "Profile is the top level",
    description:
      "Each profile is a whole start page with its own address. Pick one here — everything below belongs to the profile you choose.",
  },
  {
    selector: '[data-tour="tabs"]',
    title: "Tabs sit under your profile",
    description:
      "Home is your daily overview. The raised tabs belong to your page. Add a tab for each topic, then group its links into folders.",
  },
  {
    selector: '[data-tour="canvas"]',
    title: "Your page canvas",
    description:
      "This is how your start page is arranged. Open a tab to add, edit, favourite, or move links.",
  },
  {
    selector: '[data-tour="add-link"]',
    title: "Add your first link",
    description:
      "A useful page starts with one website. Paste its address; giving it a name is optional.",
  },
  {
    selector: '[data-tour="add-tab"]',
    title: "Add tabs and bookmarks",
    description:
      "Create another topic here. The same panel also lets you import a browser bookmarks file.",
  },
  {
    selector: '[data-tour="security"]',
    title: "Optional PIN protection",
    description:
      "Protect this profile with a six-digit PIN and manage browsers you trust.",
  },
  {
    selector: '[data-tour="preview"]',
    title: "Preview before publishing",
    description:
      "Preview uses your published-page layout. The builder sidebar stays outside the page. Return to Edit to make changes.",
  },
  {
    selector: '[data-tour="publish"]',
    title: "Publish your page",
    description:
      "When at least one link is ready, publish it and open or copy its public address.",
  },
];
const uidSuffix = () => Math.random().toString(36).slice(2, 6);
const initials = (value: string) =>
  value
    .split(/\s+/)
    .map((x) => x[0])
    .join("")
    .slice(0, 2)
    .toUpperCase() || "?";

function LinkItem({
  link,
  editing,
  archived,
  onEdit,
  onFavourite,
  onDelete,
  comments,
  onAddComment,
  onDeleteComment,
}: {
  link: LinkRow;
  editing: boolean;
  archived: boolean;
  onEdit: () => void;
  onFavourite: () => void;
  onDelete: () => void;
  comments: LinkComment[];
  onAddComment: (body: string) => Promise<void>;
  onDeleteComment: (id: string) => Promise<void>;
}) {
  const icon = faviconFor(link.url);
  return (
    <div className="studio-builder-link group grid min-h-11 grid-cols-[28px_minmax(0,1fr)_auto] items-center gap-2 border-t border-hub-border/70 px-3 first:border-t-0 hover:bg-hub-elevated/55">
      {icon ? (
        <img src={icon} alt="" className="size-6 rounded-sm" />
      ) : (
        <span className="grid size-6 place-items-center rounded-sm bg-hub-accent text-[10px] font-bold text-hub-background">
          {(link.label || link.platform)[0]?.toUpperCase()}
        </span>
      )}
      <div className="min-w-0 py-1"><div className="flex min-w-0 items-center gap-1"><a
        href={editing || archived ? undefined : normalizeUrl(link.url)}
        target={editing || archived ? undefined : "_blank"}
        rel="noopener noreferrer"
        aria-disabled={archived || undefined}
        title={archived ? "Archived — renew Premium to open" : undefined}
        onClick={
          editing
            ? (e) => {
                e.preventDefault();
                onEdit();
              }
            : undefined
        }
        className="min-w-0 truncate rounded-sm text-[13px] font-medium text-hub-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-hub-accent"
      >
          {link.label || link.platform}
          {archived ? " · Archived" : ""}
      </a></div>
        <span className="block truncate text-[10px] text-hub-muted">
          {hostOf(link.url)}
        </span>
      </div>
      <div className="flex items-center gap-0.5">
        <a href={archived ? undefined : normalizeUrl(link.url)} target={archived ? undefined : "_blank"} rel="noopener noreferrer" aria-label={`Open ${link.label || link.platform} in a new tab`} aria-disabled={archived || undefined} className="rounded p-1 text-hub-muted hover:text-hub-accent focus-visible:ring-2 focus-visible:ring-hub-accent"><ExternalLink className="size-4" aria-hidden="true" /></a>
        <IncognitoLinkButton url={link.url} name={link.label || link.platform} disabled={archived} />
        <LinkCommentButton linkId={link.id} linkName={link.label || link.platform} ownerNote={link.comment_text} comments={comments} onSubmit={onAddComment} onDelete={onDeleteComment} />
      {editing ? (
        <div className="flex">
          <Button
            variant="ghost"
            size="icon"
            className="size-7 text-hub-muted"
            onClick={onFavourite}
            aria-label={link.favourite ? "Remove favourite" : "Mark favourite"}
          >
            <Star
              className={`size-3.5 ${link.favourite ? "fill-hub-accent text-hub-accent" : ""}`}
            />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="size-7 text-hub-muted"
            onClick={onEdit}
            aria-label={`Edit ${link.label || link.platform}`}
          >
            <Pencil className="size-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="size-7 text-hub-muted hover:text-destructive"
            onClick={onDelete}
            aria-label={`Delete ${link.label || link.platform}`}
            title="Delete link"
          >
            <Trash2 className="size-3.5" />
          </Button>
        </div>
      ) : link.favourite ? (
        <Star className="size-3.5 fill-hub-accent text-hub-accent" />
      ) : null}
      </div>
    </div>
  );
}

export function WorkspaceEditor() {
  const [importOpen, setImportOpen] = useState(false);
  const [importNotice, setImportNotice] = useState("");
  const [extOpen, setExtOpen] = useState(false);
  const [canUseChromeStore, setCanUseChromeStore] = useState(false);
  useEffect(() => {
    const mobile =
      /Android|iPhone|iPad|iPod/i.test(navigator.userAgent) ||
      (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
    setCanUseChromeStore(
      !mobile && /Chrome|Chromium|Edg\//.test(navigator.userAgent),
    );
  }, []);
  const defaultFolderPending = useRef(false);
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [pageId, setPageId] = useState("");
  const [tabId, setTabId] = useState("__home");
  const [preview, setPreview] = useState(false);
  const [query, setQuery] = useState("");
  const [drawer, setDrawer] = useState<Drawer>(null);
  const [publishWarningPage, setPublishWarningPage] = useState<string | null>(
    null,
  );
  const [skipPublishWarning, setSkipPublishWarning] = useState(false);
  const [socialDraft, setSocialDraft] = useState<SocialLink[]>([]);
  const [moveTarget, setMoveTarget] = useState("");
  const [identity, setIdentity] = useState({
    name: "",
    display_name: "",
    tagline: "",
    slug: "",
  });
  const [dashboardMode] = useSavedMode("lpb-dashboard-theme");
  const [appearance, setAppearance] = useState({
    theme: "v1:grid:cobalt:system",
    dark_mode: true,
  });
  const [linkDraft, setLinkDraft] = useState({
    id: "",
    label: "",
    url: "",
    group_name: "",
    icon_only: false,
    favourite: false,
    comment_text: "",
  });
  const [folderDraft, setFolderDraft] = useState({
    id: "",
    from: "",
    name: "",
  });
  const [tabDraft, setTabDraft] = useState({ id: "", name: "", tab_color: null as string | null });
  const specialTabDraft = tabDraft.id === "__home" || tabDraft.id === "__notepad";
  const [notepadDraft, setNotepadDraft] = useState("");
  const [clockDraft, setClockDraft] = useState({ label: "", tz: "" });
  const [photoError, setPhotoError] = useState("");
  const [email, setEmail] = useState("");
  const [tourOpen, setTourOpen] = useState(false);
  const [onboarding, setOnboarding] = useState<boolean | null>(null);
  const [guideDismissed, setGuideDismissed] = useState(false);
  const [notice, setNotice] = useState<{ title: string; body: string } | null>(
    null,
  );
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setEmail(data.user?.email ?? "");
      setTourOpen(data.user?.user_metadata?.["builder_tour_v1"] !== true);
    });
  }, []);
  const pagesQ = useQuery({
    queryKey: ["pages"],
    queryFn: async (): Promise<PageRow[]> => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw Error("Please sign in again");
      const q = await supabase
        .from("pages")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at");
      if (q.error) throw q.error;
      if (q.data.length) return q.data as PageRow[];
      const base = slugify(user.email?.split("@")[0] || "me") || "me";
      const c = await supabase
        .from("pages")
        .insert({
          user_id: user.id,
          name: "Personal",
          theme: "v1:grid:cobalt:system",
          slug: `${base}-${user.id.slice(0, 4)}`,
          display_name: user.user_metadata?.["full_name"] || base,
        })
        .select("*")
        .single();
      if (c.error) throw c.error;
      const t = await supabase
        .from("page_tabs")
        .insert({
          page_id: c.data.id,
          user_id: user.id,
          name: "Links",
          position: 0,
        })
        .select("id")
        .single();
      if (t.error) throw t.error;
      const f = await supabase.from("page_folders").insert({
        page_id: c.data.id,
        tab_id: t.data.id,
        user_id: user.id,
        name: "Folder 1",
        position: 0,
      });
      if (f.error) throw f.error;
      return [c.data as PageRow];
    },
  });
  const pages = pagesQ.data || [];
  const page = pages.find((p) => p.id === pageId) || pages[0];
  useEffect(() => {
    if (page && !pageId) setPageId(page.id);
  }, [page, pageId]);
  const [premiumOpen, setPremiumOpen] = useState(false);
  const billingFn = useServerFn(getBillingConfig);
  const billingQ = useQuery({
    queryKey: ["billing-config"],
    queryFn: () => billingFn(),
    refetchInterval: 60_000,
  });
  const plan: Plan = billingQ.data?.plan ?? "free";
  const MAX_PAGES = limitsFor(plan).profiles;
  const MAX_TABS = limitsFor(plan).tabsPerProfile;
  const limErr = (e: Error) => friendlyLimitError(e.message, plan) ?? e.message;
  const tabsQ = useQuery({
    queryKey: ["tabs", page?.id],
    enabled: !!page,
    queryFn: async (): Promise<TabRow[]> => {
      const q = await supabase
        .from("page_tabs")
        .select("*")
        .eq("page_id", page?.id || "")
        .order("position");
      if (q.error) throw q.error;
      if (q.data.length) return q.data as TabRow[];
      if (!page) return [];
      const t = await supabase
        .from("page_tabs")
        .insert({
          page_id: page.id,
          user_id: page.user_id,
          name: "Links",
          position: 0,
        })
        .select("*")
        .single();
      if (t.error) throw t.error;
      const f = await supabase.from("page_folders").insert({
        page_id: page.id,
        tab_id: t.data.id,
        user_id: page.user_id,
        name: "Folder 1",
        position: 0,
      });
      if (f.error) throw f.error;
      return [t.data as TabRow];
    },
  });
  const foldersQ = useQuery({
    queryKey: ["folders", page?.id],
    enabled: !!page,
    queryFn: async (): Promise<FolderRow[]> => {
      const q = await supabase
        .from("page_folders")
        .select("*")
        .eq("page_id", page?.id || "")
        .order("position");
      if (q.error) throw q.error;
      return q.data as FolderRow[];
    },
  });
  const linksQ = useQuery({
    queryKey: ["links", page?.id],
    enabled: !!page,
    queryFn: async (): Promise<LinkRow[]> => {
      const q = await supabase
        .from("links")
        .select(
          "id,platform,label,url,group_name,position,icon_only,favourite,tab_id,comment_text",
        )
        .eq("page_id", page?.id || "")
        .order("position");
      if (q.error) throw q.error;
      return q.data as LinkRow[];
    },
  });
  const commentsQ = useQuery({
    queryKey: ["link-comments", page?.id],
    enabled: !!page,
    queryFn: async (): Promise<LinkComment[]> => {
      const { data, error } = await supabase.from("link_comments")
        .select("id,link_id,body,author_kind,created_at")
        .eq("page_id", page?.id || "").order("created_at", { ascending: true }).limit(1000);
      if (error) throw error;
      return (data ?? []) as LinkComment[];
    },
  });
  useEffect(() => {
    if (linksQ.isSuccess && onboarding === null)
      setOnboarding((linksQ.data?.length ?? 0) === 0);
  }, [linksQ.isSuccess, linksQ.data, onboarding]);
  useEffect(() => {
    const first = tabsQ.data?.[0];
    if (
      !page ||
      !first ||
      !tabsQ.isSuccess ||
      !foldersQ.isSuccess ||
      !linksQ.isSuccess ||
      (foldersQ.data?.length ?? 0) > 0 ||
      (linksQ.data?.length ?? 0) > 0 ||
      defaultFolderPending.current
    )
      return;
    defaultFolderPending.current = true;
    void (async () => {
      const { error } = await supabase.from("page_folders").insert({
        page_id: page.id,
        tab_id: first.id,
        user_id: page.user_id,
        name: "Folder 1",
        position: 0,
      });
      if (error && !error.message.includes("duplicate"))
        toast.error("Couldn't prepare your first folder");
      await qc.invalidateQueries({ queryKey: ["folders", page.id] });
      defaultFolderPending.current = false;
    })();
  }, [
    page,
    tabsQ.data,
    tabsQ.isSuccess,
    foldersQ.data,
    foldersQ.isSuccess,
    linksQ.data,
    linksQ.isSuccess,
    qc,
  ]);
  const tabs = tabsQ.data || [];
  useEffect(() => {
    if (tabId !== "__home" && !(tabId === "__notepad" && page?.notepad_enabled) && tabs.length && !tabs.some((t) => t.id === tabId))
      setTabId(tabs[0]?.id || "__home");
  }, [tabs, tabId, page?.notepad_enabled]);
  useEffect(() => setNotepadDraft(page?.notepad_content ?? ""), [page?.id, page?.notepad_content]);
  const tab = tabs.find((t) => t.id === tabId) || tabs[0];
  const links = linksQ.data || [];
  const tabLinks = links.filter(
    (l) => l.tab_id === tab?.id || (!l.tab_id && tab === tabs[0]),
  );
  const archivedPage = isProfileArchived(
    pages.findIndex((p) => p.id === page?.id),
    plan,
  );
  const archivedTab = isTabArchived(
    tabs.findIndex((t) => t.id === tab?.id),
    plan,
    archivedPage,
  );
  const activeTabIds = new Set(
    (archivedPage ? [] : tabs.slice(0, MAX_TABS)).map((t) => t.id),
  );
  const folderRows = (foldersQ.data || []).filter((f) => f.tab_id === tab?.id);
  const folders = useMemo(
    () =>
      Array.from(
        new Set(
          [
            ...folderRows.map((f) => folderName(f.name)),
            ...tabLinks.map((l) => folderName(l.group_name)),
          ].filter(Boolean),
        ),
      ),
    [folderRows, tabLinks],
  );
  const nextFolderName = () => {
    let index = 1;
    while (folders.includes(`Folder ${index}`)) index++;
    return `Folder ${index}`;
  };
  const clocks = parseClocks(page?.clocks);
  const refresh = async () => {
    await Promise.all([
      qc.invalidateQueries({ queryKey: ["pages"] }),
      qc.invalidateQueries({ queryKey: ["tabs", page?.id] }),
      qc.invalidateQueries({ queryKey: ["folders", page?.id] }),
      qc.invalidateQueries({ queryKey: ["links", page?.id] }),
      qc.invalidateQueries({ queryKey: ["link-comments", page?.id] }),
    ]);
  };
  const savePage = useMutation({
    mutationFn: async (patch: Partial<PageRow>) => {
      if (!page) return;
      const q = await supabase.from("pages").update(patch).eq("id", page.id);
      if (q.error) throw q.error;
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["pages"] });
      toast.success("Changes saved");
    },
    onError: (e: Error) =>
      toast.error(
        e.message.includes("duplicate")
          ? "That page address is already taken"
          : "Couldn't save changes",
      ),
  });
  const createPage = useMutation({
    mutationFn: async () => {
      if (!page || pages.length >= MAX_PAGES)
        throw Error(limitMessage("profiles", plan));
      const c = await supabase
        .from("pages")
        .insert({
          user_id: page.user_id,
          name: "New profile",
          slug: `new-profile-${uidSuffix()}`,
          display_name: page.display_name,
          avatar_url: page.avatar_url,
          theme: page.theme,
          dark_mode: page.dark_mode,
        })
        .select("id")
        .single();
      if (c.error) throw c.error;
      const t = await supabase
        .from("page_tabs")
        .insert({
          page_id: c.data.id,
          user_id: page.user_id,
          name: "Links",
          position: 0,
        })
        .select("id")
        .single();
      if (t.error) throw t.error;
      const f = await supabase.from("page_folders").insert({
        page_id: c.data.id,
        tab_id: t.data.id,
        user_id: page.user_id,
        name: "Folder 1",
        position: 0,
      });
      if (f.error) throw f.error;
      return c.data.id;
    },
    onSuccess: async (id) => {
      await refresh();
      setPageId(id);
      setTabId("__home");
      toast.success("New profile created");
    },
    onError: (e: Error) => toast.error(limErr(e)),
  });
  const deletePage = useMutation({
    mutationFn: async () => {
      if (!page || pages.length <= 1)
        throw Error("You need at least one profile");
      const q = await supabase.from("pages").delete().eq("id", page.id);
      if (q.error) throw q.error;
    },
    onSuccess: async () => {
      const next = pages.find((p) => p.id !== page?.id);
      setPageId(next?.id || "");
      await refresh();
      toast.success("Profile deleted");
    },
    onError: (e: Error) => toast.error(e.message),
  });
  const createTab = useMutation({
    mutationFn: async () => {
      if (!page) return;
      const name = tabDraft.name.trim().slice(0, 30);
      if (!name) throw Error("Enter a tab name");
      if (tabs.length >= MAX_TABS) throw Error(limitMessage("tabs", plan));
      const q = await supabase
        .from("page_tabs")
        .insert({
          page_id: page.id,
          user_id: page.user_id,
          name,
          tab_color: tabDraft.tab_color,
          position: tabs.length,
        })
        .select("id")
        .single();
      if (q.error) throw q.error;
      return q.data.id;
    },
    onSuccess: async (id) => {
      await qc.invalidateQueries({ queryKey: ["tabs", page?.id] });
      if (id) setTabId(id);
      setDrawer(null);
      toast.success("Tab added");
    },
    onError: (e: Error) =>
      toast.error(
        e.message.includes("duplicate") ? "That tab already exists" : limErr(e),
      ),
  });
  const reorderTabs = useMutation({
    mutationFn: async (ids: string[]) => {
      if (!page || archivedPage) throw Error("This profile is archived");
      const q = await supabase.rpc("reorder_page_tabs", {p_page_id: page.id, p_ids: ids});
      if (q.error) throw q.error;
    },
    onSuccess: async () => { await refresh(); toast.success("Tab order saved"); },
    onError: (e: Error) => toast.error(e.message),
  });
  const transferFolder = useMutation({
    mutationFn: async () => {
      if (!page || !tab || archivedTab || !moveTarget) throw Error("Choose another active tab");
      const q = await supabase.rpc("move_page_folder", {p_page_id: page.id, p_source_tab: tab.id, p_target_tab: moveTarget, p_name: folderDraft.from});
      if (q.error) throw q.error;
      return {name: q.data, target: moveTarget};
    },
    onSuccess: async (result) => { await refresh(); setTabId(result.target); setQuery(""); setDrawer(null); setMoveTarget(""); toast.success(`Moved folder: ${result.name}`); },
    onError: (e: Error) => toast.error(e.message),
  });
  const updateTab = useMutation({
    mutationFn: async () => {
      if (specialTabDraft) {
        if (!page) throw Error("Choose a profile");
        const patch = tabDraft.id === "__home"
          ? { home_tab_color: tabDraft.tab_color }
          : { notepad_tab_color: tabDraft.tab_color };
        const q = await supabase.from("pages").update(patch).eq("id", page.id);
        if (q.error) throw q.error;
        return;
      }
      const name = tabDraft.name.trim().slice(0, 30);
      if (!name) throw Error("Enter a tab name");
      const q = await supabase
        .from("page_tabs")
        .update({ name, tab_color: tabDraft.tab_color })
        .eq("id", tabDraft.id);
      if (q.error) throw q.error;
    },
    onSuccess: async () => {
      await Promise.all([
        qc.invalidateQueries({ queryKey: ["tabs", page?.id] }),
        qc.invalidateQueries({ queryKey: ["pages"] }),
      ]);
      setDrawer(null);
      toast.success("Tab settings saved");
    },
    onError: (e: Error) => toast.error(e.message),
  });
  const deleteTab = useMutation({
    mutationFn: async () => {
      if (tabs.length <= 1) throw Error("Keep at least one tab");
      const target = tabs.find((t) => t.id !== tab?.id);
      if (!target || !tab) return;
      const move = await supabase
        .from("links")
        .update({ tab_id: target.id })
        .eq("tab_id", tab.id);
      if (move.error) throw move.error;
      const q = await supabase.from("page_tabs").delete().eq("id", tab.id);
      if (q.error) throw q.error;
      if (page?.landing_tab === tab.id) {
        const fallback = await supabase.from("pages").update({ landing_tab: target.id }).eq("id", page.id);
        if (fallback.error) throw fallback.error;
      }
      return target.id;
    },
    onSuccess: async (id) => {
      setTabId(id || "__home");
      await refresh();
      setDrawer(null);
      toast.success("Tab removed; its links were moved");
    },
    onError: (e: Error) => toast.error(e.message),
  });
  const saveLink = useMutation({
    mutationFn: async () => {
      if (!page || !tab || !isSafeUrl(linkDraft.url))
        throw Error("Enter a valid web address");
      const url = normalizeUrl(linkDraft.url).slice(0, 500);
      const comment_text = linkDraft.comment_text.trim();
      if (comment_text.split(/\s+/).filter(Boolean).length > 500) throw Error("Comments are limited to 500 words");
      const payload = {
        label: (
          linkDraft.label.trim() || hostOf(url).replace(/^www\./, "")
        ).slice(0, 60),
        url,
        group_name: folderName(linkDraft.group_name).slice(0, 40),
        icon_only: linkDraft.icon_only,
        favourite: linkDraft.favourite,
        tab_id: tab.id,
        comment_text,
      };
      const q = linkDraft.id
        ? await supabase.from("links").update(payload).eq("id", linkDraft.id)
        : await supabase.from("links").insert({
            ...payload,
            user_id: page.user_id,
            page_id: page.id,
            platform: "website",
            position: links.length,
          });
      if (q.error) throw q.error;
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["links", page?.id] });
      setDrawer(null);
      setTabId(tab?.id || "__home");
      toast.success(linkDraft.id ? "Link updated" : "Your first link is ready");
    },
    onError: (e: Error) => toast.error(e.message),
  });
  const submitOwnerComment = async (linkId: string, body: string): Promise<LinkComment> => {
    if (!page || !body.trim() || commentWordCount(body) > 500 || body.length > 10000)
      throw Error("Comments are limited to 500 words.");
    const { data, error } = await supabase.from("link_comments")
      .insert({ page_id: page.id, link_id: linkId, body: body.trim(), author_kind: "owner" })
      .select("id,link_id,body,author_kind,created_at").single();
    if (error || !data) throw Error("Could not add comment.");
    await qc.invalidateQueries({ queryKey: ["link-comments", page.id] });
    return data as LinkComment;
  };
  const deleteOwnerComment = async (id: string): Promise<void> => {
    if (!page) return;
    const { error } = await supabase.from("link_comments").delete().eq("id", id).eq("page_id", page.id);
    if (error) throw error;
    await qc.invalidateQueries({ queryKey: ["link-comments", page.id] });
  };
  const removeLink = useMutation({
    mutationFn: async (id: string) => {
      const q = await supabase.from("links").delete().eq("id", id);
      if (q.error) throw q.error;
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["links", page?.id] });
      setDrawer(null);
      toast.success("Link removed");
    },
  });
  const saveFolder = useMutation({
    mutationFn: async () => {
      if (!page || !tab) throw Error("Select a tab first");
      const name = folderDraft.name.trim().slice(0, 40);
      if (!name) throw Error("Enter a folder name");
      if (folderDraft.id) {
        const folder = await supabase
          .from("page_folders")
          .update({ name })
          .eq("id", folderDraft.id);
        if (folder.error) throw folder.error;
      } else {
        const q = await supabase.from("page_folders").insert({
          page_id: page.id,
          tab_id: tab.id,
          user_id: page.user_id,
          name,
          position: folders.length,
        });
        if (q.error) throw q.error;
      }
      if (folderDraft.from && folderDraft.from !== name && tabLinks.some(l => folderName(l.group_name) === folderDraft.from)) {
        const linksUpdate = await supabase
          .from("links")
          .update({ group_name: name })
          .eq("page_id", page.id)
          .in("id", tabLinks.filter(l => folderName(l.group_name) === folderDraft.from).map(l => l.id));
        if (linksUpdate.error) throw linksUpdate.error;
      }
    },
    onSuccess: async () => {
      await Promise.all([
        qc.invalidateQueries({ queryKey: ["folders", page?.id] }),
        qc.invalidateQueries({ queryKey: ["links", page?.id] }),
      ]);
      setDrawer(null);
      toast.success(folderDraft.from ? "Folder renamed" : "Folder created");
    },
    onError: (e: Error) =>
      toast.error(
        e.message.includes("duplicate")
          ? "That folder already exists in this tab"
          : e.message,
      ),
  });
  const importBookmarks = async (file: File) => importHtml(await file.text());
  const importHtml = async (html: string): Promise<string> => {
    if (!page)
      return "Your profile is still loading. Wait a moment, reload the dashboard and try again.";
    if (tabs.length >= MAX_TABS) {
      toast.error(
        `You already have ${MAX_TABS} tabs. Delete one to import bookmarks.`,
      );
      return `You already have ${MAX_TABS} tabs. Delete one in the builder, then try again.`;
    }
    try {
      const { parseBookmarksHtml } = await import("@/lib/bookmarks");
      const all = parseBookmarksHtml(html).tabs;
      if (!all.length) throw Error("No bookmarks found");
      const free = MAX_TABS - tabs.length;
      const pick = all.slice(0, free);
      let pos = links.length,
        total = 0,
        firstId = "";
      for (const [ti, bt] of pick.entries()) {
        const t = await supabase
          .from("page_tabs")
          .insert({
            page_id: page.id,
            user_id: page.user_id,
            name: bt.name,
            position: tabs.length + ti,
          })
          .select("id")
          .single();
        if (t.error) throw t.error;
        if (!firstId) firstId = t.data.id;
        const names = [...bt.folders.keys()];
        const f = await supabase.from("page_folders").insert(
          names.map((name, i) => ({
            page_id: page.id,
            tab_id: t.data.id,
            user_id: page.user_id,
            name,
            position: i,
          })),
        );
        if (f.error) throw f.error;
        const rows = names.flatMap((name) =>
          bt.folders.get(name)!.map((b) => ({
            page_id: page.id,
            user_id: page.user_id,
            tab_id: t.data.id,
            group_name: name,
            label: b.label,
            url: b.url,
            platform: "website",
            position: pos++,
          })),
        );
        total += rows.length;
        for (let i = 0; i < rows.length; i += 200) {
          const q = await supabase.from("links").insert(rows.slice(i, i + 200));
          if (q.error) throw q.error;
        }
      }
      await Promise.all([
        qc.invalidateQueries({ queryKey: ["tabs", page.id] }),
        qc.invalidateQueries({ queryKey: ["folders", page.id] }),
        qc.invalidateQueries({ queryKey: ["links", page.id] }),
      ]);
      setTabId(firstId);
      setImportOpen(false);
      if (all.length > pick.length)
        setImportNotice(
          `${plan === "free" ? `The Free plan allows up to ${MAX_TABS} tabs per profile (Premium, ${PREMIUM_PRICE_LABEL}, allows 50)` : `Premium allows up to ${MAX_TABS} tabs per profile`}. You already had ${tabs.length}, so only the first ${pick.length} bookmark folder${pick.length === 1 ? "" : "s"} (${pick.map((p) => p.name).join(", ")}) became tabs. Skipped: ${all
            .slice(free)
            .map((p) => p.name)
            .join(", ")}.`,
        );
      else
        toast.success(
          `Imported ${total} bookmarks into ${pick.length} tab${pick.length === 1 ? "" : "s"}`,
        );
      return `OK: imported ${total} bookmarks into ${pick.length} tab${pick.length === 1 ? "" : "s"}.`;
    } catch (e) {
      const m = e instanceof Error ? limErr(e) : "Couldn't import bookmarks";
      toast.error(m);
      return "Import failed: " + m;
    }
  };
  useEffect(() => {
    const on = (e: MessageEvent) => {
      if (e.origin !== window.location.origin) return;
      const d = e.data as { type?: string; html?: unknown };
      if (d?.type === "LPB_PING") {
        window.postMessage({ type: "LPB_PONG" }, window.location.origin);
        return;
      }
      if (
        d?.type === "LPB_BOOKMARKS" &&
        typeof d.html === "string" &&
        d.html.length < 20_000_000
      )
        void importHtml(d.html).then((msg) =>
          window.postMessage(
            { type: "LPB_BOOKMARKS_RESULT", msg },
            window.location.origin,
          ),
        );
    };
    window.addEventListener("message", on);
    return () => window.removeEventListener("message", on);
  });
  const reorderFolders = useMutation({
    mutationFn: async ({names, pageId, tabId}: {names: string[]; pageId: string; tabId: string}) => {
      const {error} = await supabase.rpc("reorder_page_folders", {p_page_id: pageId, p_tab_id: tabId, p_names: names});
      if (error) throw error;
    },
    onSuccess: async (_, variables) => {
      await qc.invalidateQueries({queryKey: ["folders", variables.pageId]});
      toast.success("Folder order saved");
    },
    onError: () => { toast.error("Couldn’t save folder order. Refresh and try again."); qc.invalidateQueries({queryKey: ["folders", page?.id]}); },
  });
  const folderDrag = useDragOrder(folders, `${page?.id}:${tab?.id}`, preview || archivedTab || reorderFolders.isPending, names => {
    if (page && tab) reorderFolders.mutate({names, pageId: page.id, tabId: tab.id});
  });
  const moveFolder = (index: number, delta: number) => {
    const next = moveItem(folders, index, index + delta);
    if (next !== folders && page && tab) reorderFolders.mutate({names: next, pageId: page.id, tabId: tab.id});
  };
  const moveLink = async (id: string, group_name: string) => {
    const l = links.find((x) => x.id === id);
    if (!l || l.group_name === group_name) return;
    const q = await supabase.from("links").update({ group_name }).eq("id", id);
    if (q.error) toast.error("Couldn't move link");
    else {
      qc.invalidateQueries({ queryKey: ["links", page?.id] });
      toast.success(`Moved to ${group_name || "Ungrouped"}`);
    }
  };
  const toggleFavourite = async (link: LinkRow) => {
    const q = await supabase
      .from("links")
      .update({ favourite: !link.favourite })
      .eq("id", link.id);
    if (q.error) toast.error("Couldn't update favourite");
    else qc.invalidateQueries({ queryKey: ["links", page?.id] });
  };
  const uploadAvatar = useMutation({
    mutationFn: async (file: File) => {
      if (!page) return;
      if (!file.type.startsWith("image/") || file.size > 5 * 1024 * 1024)
        throw Error("Choose an image under 5 MB");
      const ext = (file.name.split(".").pop() || "jpg").slice(0, 5);
      const path = `${page.user_id}/page-${page.id}-${Date.now()}.${ext}`;
      const up = await supabase.storage
        .from("avatars")
        .upload(path, file, { contentType: file.type });
      if (up.error) throw up.error;
      const signed = await supabase.storage
        .from("avatars")
        .createSignedUrl(path, 60 * 60 * 24 * 365 * 10);
      if (signed.error) throw signed.error;
      const q = await supabase
        .from("pages")
        .update({ avatar_url: signed.data.signedUrl })
        .eq("id", page.id);
      if (q.error) throw q.error;
    },
    onSuccess: async () => {
      setPhotoError("");
      await qc.invalidateQueries({ queryKey: ["pages"] });
      toast.success("Picture updated");
    },
    onError: (e: Error) => setPhotoError(e.message),
  });
  const openIdentity = () => {
    if (!page) return;
    setSocialDraft(parseSocialLinks(page.social_links));
    setIdentity({
      name: page.name,
      display_name: page.display_name,
      tagline: page.tagline,
      slug: page.slug,
    });
    setPhotoError("");
    setDrawer("identity");
  };
  const openAppearance = () => {
    if (!page) return;
    setAppearance({ theme: page.theme, dark_mode: page.dark_mode });
    setDrawer("appearance");
  };
  const completePublish = async () => {
    if (!page) return;
    await savePage.mutateAsync({ published: true });
    toast.success(page.published ? "Live page updated" : "Page published");
    setOnboarding(false);
    setDrawer("publish");
  };
  const publishWarningKey = page
    ? `lpb-public-warning:${page.user_id}:${page.id}`
    : "";
  const finishPublishRequest = async () => {
    if (page?.published) setDrawer("publish");
    else await completePublish();
  };
  const publish = async () => {
    if (!page) return;
    let dismissed = false;
    try {
      dismissed = localStorage.getItem(publishWarningKey) === "dismissed";
    } catch {
      /* Keep warning available if storage is blocked. */
    }
    if (!page.pin_protected && !dismissed) {
      setSkipPublishWarning(false);
      setPublishWarningPage(page.id);
      return;
    }
    await finishPublishRequest();
  };
  const saveClocks = async (next: StartPageClock[]) => {
    await savePage.mutateAsync({
      clocks: next.slice(0, MAX_CLOCKS),
    } as Partial<PageRow>);
  };
  const download = () => {
    if (!page) return;
    const exportLinks = links.filter(
      (l) =>
        !archivedPage &&
        (activeTabIds.has(l.tab_id ?? "") ||
          (!l.tab_id && activeTabIds.has(tabs[0]?.id ?? ""))),
    );
    const html = renderStartPageHtml(
      { ...page, clocks: parseClocks(page.clocks) },
      orderLinksByFolders(exportLinks, foldersQ.data || [], tabs[0]?.id),
    );
    const url = URL.createObjectURL(new Blob([html], { type: "text/html" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `${page.slug}.html`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("HTML downloaded");
  };
  const signOut = async () => {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  };
  const completeTour = async () => {
    setTourOpen(false);
    const { error } = await supabase.auth.updateUser({
      data: { builder_tour_v1: true },
    });
    if (error)
      toast.error("The tour was closed, but we couldn't save that preference");
  };
  if (pagesQ.isLoading || !page)
    return (
      <div
        data-colour-mode={dashboardMode}
        style={themeStyle("cobalt")}
        className="theme-scope grid min-h-screen place-items-center bg-hub-background text-hub-muted"
      >
        Loading your workspace…
      </div>
    );
  if (pagesQ.isError)
    return (
      <div className="dark grid min-h-screen place-items-center bg-hub-background text-hub-muted">
        Your workspace could not be loaded. Refresh to try again.
      </div>
    );
  const currentFolders = folders.length ? folders : ["Folder 1"];
  const publicUrl = publicPageUrl(page.slug);
  const firstRun = onboarding === true && !guideDismissed;
  return (
    <div>
      <BuilderShell
        pagePreset={readPageTheme(page.theme, page.dark_mode).preset}
        pageMode={readPageTheme(page.theme, page.dark_mode).mode}
        preview={preview}
        onPreviewChange={setPreview}
        profileName={page.name}
        published={page.published}
        publicUrl={publicUrl}
        tools={
          <>
            <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-hub-muted">
              Build your page
            </p>
            <Button
              variant="ghost"
              aria-current={!preview ? "page" : undefined}
              className="h-10 w-full justify-start rounded-xl text-sm text-hub-accent"
              onClick={() => setPreview(false)}
            >
              <Monitor />
              Page content
            </Button>
            <div className="mb-2 mt-7 px-3">
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-hub-muted">
                Profile settings
              </p>
              <p className="mt-1 truncate text-xs text-hub-foreground">
                {page.name}
              </p>
            </div>
            <Button
              variant="ghost"
              className="h-10 w-full justify-start rounded-xl text-xs text-hub-muted"
              onClick={() => {
                setPreview(false);
                openIdentity();
              }}
            >
              <Settings />
              Profile
            </Button>
            <Button
              variant="ghost"
              className="h-10 w-full justify-start rounded-xl text-xs text-hub-muted"
              onClick={() => {
                setPreview(false);
                openAppearance();
              }}
            >
              <Sparkles />
              Themes & appearance
            </Button>
            <Button
              data-tour="security"
              variant="ghost"
              className="h-10 w-full justify-start rounded-xl text-xs text-hub-muted"
              onClick={() => {
                setPreview(false);
                setDrawer("security");
              }}
            >
              <ShieldCheck />
              PIN & access
            </Button>
            <div className="my-5 border-t border-hub-border" />
            <Button
              variant="ghost"
              className="h-10 w-full justify-start rounded-xl text-xs text-hub-muted"
              onClick={() => setExtOpen(true)}
            >
              <Download />
              Import bookmarks
            </Button>
            <Button
              variant="ghost"
              className="h-10 w-full justify-start rounded-xl text-xs text-hub-muted"
              onClick={download}
            >
              <Download />
              Download HTML
            </Button>
          </>
        }
        account={
          <div className="flex items-center justify-between gap-2">
            <button
              type="button"
              className="min-w-0 rounded-lg px-2 py-1.5 text-left hover:bg-hub-elevated"
              onClick={() =>
                plan === "premium"
                  ? window.location.assign("/membership")
                  : setPremiumOpen(true)
              }
            >
              <span className="block truncate text-xs font-medium">
                {plan === "premium" ? "Premium active" : "Free plan"}
              </span>
              <span className="block text-[10px] text-hub-muted">
                Account & membership
              </span>
            </button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-8 text-hub-muted"
                  aria-label="Account menu"
                >
                  <Settings />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <div className="max-w-[240px] px-2 py-1.5">
                  <p className="text-[10px] uppercase text-muted-foreground">
                    Signed in as
                  </p>
                  <p className="truncate text-sm font-medium">
                    {email || "Your account"}
                  </p>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem onSelect={openIdentity}>
                  <Settings />
                  Profile settings
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={openAppearance}>
                  <Sparkles />
                  Themes & appearance
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={download}>
                  <Download />
                  Download HTML
                </DropdownMenuItem>
                {!firstRun ? (
                  <>
                    <DropdownMenuSeparator />
                    {plan === "premium" ? (
                      <DropdownMenuItem asChild>
                        <a href="/membership">
                          <Sparkles />
                          Membership · Active
                        </a>
                      </DropdownMenuItem>
                    ) : (
                      <DropdownMenuItem onSelect={() => setPremiumOpen(true)}>
                        <Sparkles />
                        Go Premium
                      </DropdownMenuItem>
                    )}
                  </>
                ) : null}
                <DropdownMenuSeparator />
                <DropdownMenuItem onSelect={signOut}>
                  <LogOut />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        }
        profilePicker={
          <div data-tour="profiles" className="flex min-w-0 items-center gap-2">
            <Select
              value={page.id}
              onValueChange={(id) => {
                setPageId(id);
                setTabId("__home");
                setQuery("");
              }}
            >
              <SelectTrigger
                className="h-8 w-[140px] border-hub-border bg-hub-background text-hub-foreground sm:w-[180px]"
                aria-label="Select profile"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {pages.map((p, index) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name}
                    {plan === "free" && index >= 2 ? " · Archived" : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              variant="ghost"
              size="icon"
              className="size-8 shrink-0 text-hub-accent"
              onClick={() => createPage.mutate()}
              disabled={pages.length >= MAX_PAGES || createPage.isPending}
              aria-label="Add profile"
              title="Add a separate profile, such as Personal or Work"
            >
              <Plus />
            </Button>
          </div>
        }
        publishAction={
          <Button
            data-tour="publish"
            size="sm"
            onClick={() => void publish()}
            disabled={savePage.isPending || (links.length === 0 && !page.notepad_enabled)}
          >
            <Check />
            {page.published ? "Publish settings" : "Publish page"}
          </Button>
        }
        tabs={
          <BuilderTabs
            tabs={tabs.map((t, index) => ({
              ...t,
              archived: archivedPage || index >= MAX_TABS,
            }))}
            activeId={tabId.startsWith("__") ? tabId : (tab?.id ?? "__home")}
            notepadEnabled={!!page.notepad_enabled}
            homeColor={page.home_tab_color}
            notepadColor={page.notepad_tab_color}
            onAddNotepad={async () => { await savePage.mutateAsync({ notepad_enabled: true }); setTabId("__notepad"); }}
            onSelect={(id) => {
              setTabId(id);
              setQuery("");
            }}
            onAdd={() => {
              setTabDraft({ id: "", name: "", tab_color: null });
              setDrawer("tab");
            }}
            onRename={(id) => {
              const selected = tabs.find((t) => t.id === id);
              if (selected) {
                setTabDraft({ id, name: selected.name, tab_color: selected.tab_color });
                setDrawer("tab");
              }
            }}
            onReorder={(ids) => reorderTabs.mutate(ids)}
            saving={reorderTabs.isPending || archivedPage}
            canAdd={tabs.length < MAX_TABS}
          />
        }
        guide={
          firstRun ? (
            <section className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-hub-accent/25 bg-hub-accent/5 px-4 py-3">
              <div className="min-w-0">
                <h2 className="text-sm font-semibold">
                  {links.length
                    ? "Your first link is ready"
                    : "Start with one link"}
                </h2>
                <p className="mt-1 text-xs text-hub-muted">
                  Add a website → organise your tabs → preview and publish.
                </p>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  data-tour="add-link"
                  size="sm"
                  disabled={!tabs.length}
                  onClick={() => {
                    if (links.length) {
                      setPreview(true);
                      return;
                    }
                    const firstTab = tabs[0];
                    if (!firstTab) return;
                    setTabId(firstTab.id);
                    setLinkDraft({
                      id: "",
                      label: "",
                      url: "",
                      group_name: folderRows[0]?.name || "Folder 1",
                      icon_only: false,
                      favourite: false,
                      comment_text: "",
                    });
                    setDrawer("link");
                  }}
                >
                  {links.length ? <Eye /> : <Plus />}
                  {links.length ? "Preview your page" : "Add your first link"}
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setGuideDismissed(true)}
                  aria-label="Dismiss getting started guide"
                >
                  <X />
                </Button>
              </div>
            </section>
          ) : null
        }
      >
        {preview ? (
          <PublishedTabs
            key={page.id + ":" + tabId}
            profile={{ ...page, clocks }}
            links={orderLinksByFolders(links, foldersQ.data || [], tabs[0]?.id)}
            comments={commentsQ.data || []}
            onAddComment={submitOwnerComment}
            tabs={tabs.map((t, index) => ({
              ...t,
              archived: archivedPage || index >= MAX_TABS,
            }))}
            archivedProfile={archivedPage}
            initialTabId={tabId}
            embedded
          />
        ) : (
          <div
            id="builder-tab-panel"
            role="tabpanel"
            aria-labelledby={
              "builder-tab-" +
              (tabId.startsWith("__") ? tabId : (tab?.id ?? "__home"))
            }
            data-colour-mode={readPageTheme(page.theme, page.dark_mode).mode}
            style={themeStyle(readPageTheme(page.theme).preset)}
            className="studio-builder-canvas theme-scope min-w-0 bg-hub-background px-4 py-5 text-hub-foreground sm:p-6"
          >
            {archivedPage || archivedTab ? (
              <div className="mb-4 rounded-md border border-hub-accent/40 bg-hub-surface p-3 text-sm">
                Archived on the Free plan. Your saved links remain visible, but
                cannot be opened until Premium is renewed.
              </div>
            ) : null}
            {tabId === "__notepad" && page.notepad_enabled ? (
              <section className="mx-auto max-w-3xl space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h1 className="font-display text-xl font-semibold">Notepad</h1>
                  <Button variant="outline" size="sm" className="border-hub-border" onClick={() => {
                    setTabDraft({ id: "__notepad", name: "Notepad", tab_color: page.notepad_tab_color });
                    setDrawer("tab");
                  }}>
                    <Ellipsis />
                    Tab settings
                  </Button>
                </div>
                <p className="text-sm text-hub-muted">Everyone visiting this page can read this note. Only you can edit it.</p>
                <textarea aria-label="Notepad content" value={notepadDraft} onChange={(e) => setNotepadDraft(e.target.value)} className="min-h-80 w-full rounded-md border border-hub-border bg-hub-background p-4 text-sm leading-6" placeholder="Write a note for visitors…" />
                <Button disabled={savePage.isPending || notepadDraft === page.notepad_content} onClick={() => savePage.mutate({ notepad_content: notepadDraft })}>Save Notepad</Button>
              </section>
            ) : tabId === "__home" ? (
              <div className="space-y-3">
                <div className="flex justify-end">
                  <Button variant="outline" size="sm" className="border-hub-border" onClick={() => {
                    setTabDraft({ id: "__home", name: "Home", tab_color: page.home_tab_color });
                    setDrawer("tab");
                  }}>
                    <Ellipsis />
                    Tab settings
                  </Button>
                </div>
              <HomeDashboard
                profileId={page.id}
                profileName={page.name}
                displayName={page.display_name}
                tagline={page.tagline}
                socialLinks={page.social_links}
                socialDisabled={archivedPage}
                avatarUrl={page.avatar_url}
                slug={page.slug}
                published={page.published}
                links={links
                  .filter(
                    (l) =>
                      !archivedPage &&
                      (activeTabIds.has(l.tab_id ?? "") ||
                        (!l.tab_id && activeTabIds.has(tabs[0]?.id ?? ""))),
                  )
                  .map((l) => ({
                    id: l.id,
                    name: l.label || l.platform,
                    url: l.url,
                    favourite: l.favourite,
                  }))}
                widgets={page.home_widgets}
                saving={savePage.isPending}
                onAddWidget={() => setDrawer("widgets")}
                onWidgetsChange={(widgets) =>
                  savePage.mutate({ home_widgets: widgets })
                }
                clocks={clocks}
                editing={!preview}
                onEditIdentity={openIdentity}
                onEditClocks={() => setDrawer("clocks")}
                onPublish={publish}
              />
              </div>
            ) : (
              <>
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-hub-border pb-4">
                  <div className="flex min-w-0 items-center gap-3">
                    {page.avatar_url ? (
                      <img
                        src={page.avatar_url}
                        alt=""
                        className="size-10 rounded-md border border-hub-border object-cover"
                      />
                    ) : (
                      <span className="grid size-10 place-items-center rounded-md border border-hub-border bg-hub-elevated font-display text-sm font-semibold text-hub-accent">
                        {initials(page.display_name)}
                      </span>
                    )}
                    <div className="min-w-0">
                      <h1 className="truncate font-display text-xl font-semibold">
                        {tab?.name}
                      </h1>
                      <p className="truncate text-xs text-hub-muted">
                        {page.name} profile · {folders.length} folders ·{" "}
                        {tabLinks.length} links
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          className="border-hub-border"
                          aria-label="Tab settings"
                        >
                          <Ellipsis />
                          <span className="sr-only sm:not-sr-only">
                            Tab settings
                          </span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onSelect={() => {
                            if (tab) {
                              setTabDraft({ id: tab.id, name: tab.name, tab_color: tab.tab_color });
                              setDrawer("tab");
                            }
                          }}
                        >
                          <Pencil />
                          Tab settings
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          disabled={tabs.length <= 1}
                          onSelect={() => {
                            if (
                              tab &&
                              confirm(
                                `Delete the ${tab.name} tab? Its links will move to another tab.`,
                              )
                            )
                              deleteTab.mutate();
                          }}
                        >
                          <Trash2 />
                          Delete tab
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                    <div className="relative w-40 sm:w-64">
                      <Search className="pointer-events-none absolute left-2.5 top-2.5 size-4 text-hub-muted" />
                      <Input
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder={`Search ${tab?.name || "tab"}`}
                        className="border-hub-border bg-hub-surface pl-9 text-hub-foreground"
                      />
                    </div>
                  </div>
                </div>
                <div
                  className={`mt-5 columns-1 gap-4 space-y-4 ${readPageTheme(page.theme).layout === "list" ? "mx-auto max-w-3xl" : "md:columns-2 xl:columns-3"}`}
                >
                  {currentFolders.map((folder, folderIndex) => {
                    const items = tabLinks.filter(
                      (l) =>
                        folderName(l.group_name) === folder &&
                        `${l.label} ${hostOf(l.url)}`
                          .toLowerCase()
                          .includes(query.toLowerCase()),
                    );
                    const row = folderRows.find((item) => item.name === folder);
                    return (
                      <section
                        key={folder || "ungrouped"}
                        onDragOver={(e) => {
                          if (!preview && !archivedTab && e.dataTransfer.types.includes("text/link-id")) e.preventDefault();
                        }}
                        onDrop={(e) => {
                          if (preview || archivedTab) return;
                          e.preventDefault();
                          const id = e.dataTransfer.getData("text/link-id");
                          if (id) moveLink(id, folder);
                        }}
                        {...folderDrag.targetProps(folder)}
                        style={folderDrag.over === folder ? {outline: "2px solid var(--hub-accent)", outlineOffset: 2} : undefined}
                        className="studio-builder-folder break-inside-avoid overflow-hidden rounded-md border border-hub-border bg-hub-surface"
                      >
                        <header className="flex min-h-10 items-center gap-2 border-b border-hub-border bg-hub-elevated/45 px-3">
                          {!preview && <Button variant="ghost" size="icon" className="size-6 shrink-0 cursor-grab active:cursor-grabbing" aria-label={`Drag folder ${folder}`} title="Drag to reorder folders" disabled={archivedTab || reorderFolders.isPending || folders.length < 2} {...folderDrag.handleProps(folder)}><GripVertical className="size-4" /></Button>}
                          <Folder className="size-4 text-hub-accent" />
                          <h2 className="min-w-0 flex-1 truncate font-display text-xs font-semibold">
                            {folderName(folder)}
                          </h2>
                          <span className="text-[10px] text-hub-muted">
                            {items.length}
                          </span>
                          {!preview && <span className="flex shrink-0">
                            <Button variant="ghost" size="icon" className="size-6" aria-label={`Move folder ${folder} up`} disabled={archivedTab || reorderFolders.isPending || folderIndex === 0} onClick={() => moveFolder(folderIndex, -1)}><ArrowUp className="size-3" /></Button>
                            <Button variant="ghost" size="icon" className="size-6" aria-label={`Move folder ${folder} down`} disabled={archivedTab || reorderFolders.isPending || folderIndex === folders.length - 1} onClick={() => moveFolder(folderIndex, 1)}><ArrowDown className="size-3" /></Button>
                          </span>}
                          {!preview && folder ? (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-7 text-hub-muted"
                              aria-label={`Folder actions for ${folder}`}
                              onClick={() => {
                                setMoveTarget("");
                                setFolderDraft({
                                  id: row?.id || "",
                                  from: folder,
                                  name: folder,
                                });
                                setDrawer("folder");
                              }}
                            >
                              <Ellipsis className="size-4" />
                            </Button>
                          ) : null}
                        </header>
                        {items.map((l) => (
                          <div
                            key={l.id}
                            draggable={!preview}
                            onDragStart={(e) => {
                              e.dataTransfer.setData("text/link-id", l.id);
                              e.dataTransfer.effectAllowed = "move";
                            }}
                            className={
                              !preview
                                ? "cursor-grab active:cursor-grabbing"
                                : ""
                            }
                          >
                            <LinkItem
                              link={l}
                              comments={(commentsQ.data || []).filter((item) => item.link_id === l.id)}
                              onAddComment={async (body) => { await submitOwnerComment(l.id, body); }}
                              onDeleteComment={deleteOwnerComment}
                              editing={!preview}
                              archived={archivedTab}
                              onFavourite={() => toggleFavourite(l)}
                              onEdit={() => {
                                setLinkDraft({
                                  id: l.id,
                                  label: l.label,
                                  url: l.url,
                                  group_name: folderName(l.group_name),
                                  icon_only: !!l.icon_only,
                                  favourite: l.favourite,
                                  comment_text: l.comment_text || "",
                                });
                                setDrawer("link");
                              }}
                              onDelete={() => {
                                if (
                                  confirm(
                                    `Delete the ${l.label || l.platform} link?`,
                                  )
                                )
                                  removeLink.mutate(l.id);
                              }}
                            />
                          </div>
                        ))}
                        {!preview ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-9 w-full justify-start rounded-none text-hub-muted"
                            onClick={() => {
                              setLinkDraft({
                                id: "",
                                label: "",
                                url: "",
                                group_name: folder,
                                icon_only: false,
                                favourite: false,
                                comment_text: "",
                              });
                              setDrawer("link");
                            }}
                          >
                            <Plus />
                            Add link to {folder || "this tab"}
                          </Button>
                        ) : null}
                      </section>
                    );
                  })}
                  {!preview ? (
                    <Button
                      variant="outline"
                      className="min-h-20 w-full border-dashed border-hub-border bg-transparent text-hub-muted"
                      onClick={() => {
                        setFolderDraft({ id: "", from: "", name: nextFolderName() });
                        setDrawer("folder");
                      }}
                    >
                      <Plus />
                      Add folder to {tab?.name}
                    </Button>
                  ) : null}
                </div>
              </>
            )}
          </div>
        )}
      </BuilderShell>
      <Dialog
        open={!!importNotice}
        onOpenChange={(o) => {
          if (!o) setImportNotice("");
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Some folders were skipped</DialogTitle>
            <DialogDescription>{importNotice}</DialogDescription>
          </DialogHeader>
          <Button onClick={() => setImportNotice("")}>Got it</Button>
        </DialogContent>
      </Dialog>
      <ExtensionImportDialog
        open={extOpen}
        onOpenChange={setExtOpen}
        canUseChromeStore={canUseChromeStore}
        canImport={tabs.length < MAX_TABS}
        onImport={() => {
          setExtOpen(false);
          setImportOpen(true);
        }}
      />
      <Dialog open={importOpen} onOpenChange={setImportOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Import bookmarks from this browser</DialogTitle>
            <DialogDescription>
              Each top bookmark folder becomes its own tab (up to {MAX_TABS}{" "}
              tabs), folders inside it become folders, and loose bookmarks go
              into "Ungrouped". Using our browser extension? Just click its
              button — no file needed.
            </DialogDescription>
          </DialogHeader>
          <ol className="list-decimal space-y-1 pl-5 text-sm text-muted-foreground">
            <li>
              <b>Chrome / Edge / Brave:</b> press Ctrl+Shift+O (Cmd+Shift+O on
              Mac) → ⋮ menu → Export bookmarks.
            </li>
            <li>
              <b>Firefox:</b> Ctrl+Shift+O → Import and Backup → Export
              Bookmarks to HTML.
            </li>
            <li>
              <b>Safari:</b> File → Export → Bookmarks.
            </li>
            <li>Choose the saved file below.</li>
          </ol>
          <p className="text-xs text-muted-foreground">
            For privacy, browsers don't let websites read bookmarks directly, so
            a quick export is needed. Repeat on any other browser to import its
            bookmarks too.
          </p>
          <Input
            type="file"
            accept=".html,.htm,text/html"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) importBookmarks(f);
              e.target.value = "";
            }}
          />
        </DialogContent>
      </Dialog>
      <Sheet
        open={!!drawer}
        onOpenChange={(o) => {
          if (!o) setDrawer(null);
        }}
      >
        <SheetContent
          data-colour-mode={dashboardMode}
          style={themeStyle("cobalt")}
          className={`studio-builder-drawer theme-scope w-full overflow-y-auto border-hub-border bg-hub-surface text-hub-foreground ${drawer === "security" ? "sm:max-w-[50vw] lg:w-1/2" : "sm:max-w-md"}`}
        >
          <SheetHeader>
            <SheetTitle className="font-display text-hub-foreground">
              {drawer === "identity"
                ? "Profile settings"
                : drawer === "appearance"
                  ? "Themes & appearance"
                  : drawer === "security"
                    ? "PIN & trusted browsers"
                    : drawer === "widgets"
                      ? "Add Home widgets"
                      : drawer === "clocks"
                        ? "World clocks"
                        : drawer === "link"
                          ? linkDraft.id
                            ? "Edit link"
                            : "Add link"
                          : drawer === "folder"
                            ? "Folder"
                            : drawer === "tab"
                              ? "Tab settings"
                              : "Publish profile"}
            </SheetTitle>
            <SheetDescription className="text-hub-muted">
              Changes belong only to the {page.name} profile and follow your
              account to other browsers.
            </SheetDescription>
          </SheetHeader>
          {drawer === "identity" ? (
            <div className="mt-6 space-y-5">
              <div className="flex items-center gap-4 rounded-md border border-hub-border bg-hub-background p-4">
                {page.avatar_url ? (
                  <img
                    src={page.avatar_url}
                    alt=""
                    className="size-16 rounded-md object-cover"
                  />
                ) : (
                  <span className="grid size-16 place-items-center rounded-md border border-hub-border bg-hub-elevated text-xl font-semibold text-hub-accent">
                    {initials(page.display_name)}
                  </span>
                )}
                <div>
                  <Label
                    htmlFor="photo"
                    className="inline-flex h-9 cursor-pointer items-center gap-2 rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground"
                  >
                    <ImageIcon className="size-4" />
                    {page.avatar_url ? "Change picture" : "Add picture"}
                  </Label>
                  <input
                    id="photo"
                    type="file"
                    accept="image/*"
                    className="sr-only"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) uploadAvatar.mutate(f);
                    }}
                  />
                  {page.avatar_url ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="ml-2 text-hub-muted"
                      onClick={() => savePage.mutate({ avatar_url: null })}
                    >
                      Remove
                    </Button>
                  ) : null}
                  <p className="mt-2 text-xs text-hub-muted">
                    No picture? Your initials appear automatically.
                  </p>
                </div>
              </div>
              {photoError ? (
                <p className="text-xs text-destructive">{photoError}</p>
              ) : null}
              <div className="space-y-4">
                <div>
                  <Label htmlFor="page-name">Private profile name</Label>
                  <Input
                    id="page-name"
                    value={identity.name}
                    onChange={(e) =>
                      setIdentity({ ...identity, name: e.target.value })
                    }
                    className="mt-1 bg-hub-background"
                  />
                </div>
                <div>
                  <Label htmlFor="display-name">Display name</Label>
                  <Input
                    id="display-name"
                    value={identity.display_name}
                    onChange={(e) =>
                      setIdentity({ ...identity, display_name: e.target.value })
                    }
                    className="mt-1 bg-hub-background"
                  />
                </div>
                <div>
                  <Label htmlFor="tagline">Introduction</Label>
                  <Input
                    id="tagline"
                    value={identity.tagline}
                    onChange={(e) =>
                      setIdentity({ ...identity, tagline: e.target.value })
                    }
                    className="mt-1 bg-hub-background"
                  />
                </div>
                <fieldset className="space-y-3 rounded-lg border border-hub-border p-3">
                  <legend className="px-1 text-sm font-semibold">Social & website links</legend>
                  <p className="text-xs text-hub-muted">Icons appear beside your name on Home and below your introduction on each tab. Use the arrows to change display order, then Save profile.</p>
                  {socialDraft.map((item,index) => <div key={index} className="space-y-2 border-b border-hub-border pb-3">
                    <div className="flex items-center gap-2"><select aria-label={`Platform for social link ${index+1}`} className="min-w-0 flex-1 rounded border border-hub-border bg-hub-background p-2 text-sm" value={item.platform} onChange={e=>setSocialDraft(old=>old.map((l,i)=>i===index?{...l,platform:e.target.value as SocialLink['platform']}:l))}>{SOCIAL_PLATFORMS.map(p=><option key={p} value={p}>{socialName(p)}</option>)}</select><Button type="button" variant="ghost" size="icon" className="size-8 shrink-0" aria-label={`Move social link ${index+1} up`} title="Move up" disabled={index===0} onClick={()=>setSocialDraft(old=>moveItem(old,index,index-1))}><ArrowUp className="size-4"/></Button><Button type="button" variant="ghost" size="icon" className="size-8 shrink-0" aria-label={`Move social link ${index+1} down`} title="Move down" disabled={index===socialDraft.length-1} onClick={()=>setSocialDraft(old=>moveItem(old,index,index+1))}><ArrowDown className="size-4"/></Button><Button variant="ghost" size="icon" aria-label={`Remove social link ${index+1}`} onClick={()=>setSocialDraft(old=>old.filter((_,i)=>i!==index))}><Trash2 className="size-4"/></Button></div>
                    <Input aria-label={`Address for social link ${index+1}`} placeholder="https://instagram.com/yourname" maxLength={500} value={item.url} onChange={e=>setSocialDraft(old=>old.map((l,i)=>i===index?{...l,url:e.target.value}:l))}/>
                    <Input aria-label={`Label for social link ${index+1}`} placeholder="Optional label, e.g. Personal account" maxLength={60} value={item.label || ''} onChange={e=>setSocialDraft(old=>old.map((l,i)=>i===index?{...l,label:e.target.value}:l))}/>
                  </div>)}
                  <Button variant="outline" disabled={socialDraft.length>=20} onClick={()=>setSocialDraft(old=>[...old,{platform:'website',url:'',label:''}])}><Plus className="size-4"/>Add social link</Button>
                </fieldset>
                <div>
                  <Label htmlFor="slug">Published address</Label>
                  <Input
                    id="slug"
                    value={identity.slug}
                    onChange={(e) =>
                      setIdentity({
                        ...identity,
                        slug: slugify(e.target.value),
                      })
                    }
                    className="mt-1 bg-hub-background"
                  />
                  <p className="mt-1 text-xs text-hub-muted">
                    landingpage.aurunex.com/{identity.slug || "your-profile"}
                  </p>
                </div>
                <Button
                  disabled={
                    !identity.name.trim() || !identity.display_name.trim()
                  }
                  onClick={async () => {
                    if (socialDraft.some(l => !socialUrl(l.url))) { toast.error("Enter a valid website address for every social link"); return; }
                    try { await savePage.mutateAsync({
                      social_links: parseSocialLinks(socialDraft) as Json,
                      ...identity,
                      name: identity.name.trim(),
                      display_name: identity.display_name.trim(),
                      tagline: identity.tagline.trim(),
                      slug: slugify(identity.slug),
                    });
                    setDrawer(null); } catch { /* savePage displays the error */ }
                  }}
                >
                  Save profile
                </Button>
              </div>
              <div className="border-t border-hub-border pt-4">
                <Button
                  variant="destructive"
                  disabled={pages.length <= 1 || deletePage.isPending}
                  onClick={() => {
                    if (
                      confirm(
                        `Delete the ${page.name} profile and all its links?`,
                      )
                    )
                      deletePage.mutate();
                  }}
                >
                  <Trash2 />
                  Delete profile
                </Button>
              </div>
            </div>
          ) : null}
          {drawer === "appearance" ? (
            <div className="mt-6 space-y-5">
              <div className="rounded-md border border-hub-border bg-hub-background p-4">
                <Label htmlFor="layout">Page layout</Label>
                <Select
                  value={readPageTheme(appearance.theme).layout}
                  onValueChange={(layout) =>
                    setAppearance({
                      ...appearance,
                      theme: writePageTheme({
                        ...readPageTheme(
                          appearance.theme,
                          appearance.dark_mode,
                        ),
                        layout,
                      }),
                    })
                  }
                >
                  <SelectTrigger id="layout" className="mt-2 bg-hub-surface">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="grid">Dashboard grid</SelectItem>
                    <SelectItem value="list">Single column</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-3">
                <Label>Published page mode</Label>
                <ColourModeToggle
                  value={
                    readPageTheme(appearance.theme, appearance.dark_mode).mode
                  }
                  onChange={(mode) =>
                    setAppearance({
                      ...appearance,
                      dark_mode: mode !== "light",
                      theme: writePageTheme({
                        ...readPageTheme(
                          appearance.theme,
                          appearance.dark_mode,
                        ),
                        mode,
                      }),
                    })
                  }
                />
                <p className="text-xs text-hub-muted">
                  System follows the visitor’s device. This applies only to this
                  profile.
                </p>
                <Label>Choose a theme · 20 colour combinations</Label>
                <ThemePresets
                  value={readPageTheme(appearance.theme).preset}
                  onChange={(preset) =>
                    setAppearance({
                      ...appearance,
                      theme: writePageTheme({
                        ...readPageTheme(
                          appearance.theme,
                          appearance.dark_mode,
                        ),
                        preset,
                      }),
                    })
                  }
                />
                <div
                  className="theme-scope rounded-lg border border-hub-border bg-hub-background p-4 text-hub-foreground"
                  data-colour-mode={
                    readPageTheme(appearance.theme, appearance.dark_mode).mode
                  }
                  style={themeStyle(readPageTheme(appearance.theme).preset)}
                >
                  <p className="font-semibold">Your page preview</p>
                  <div className="mt-3 rounded border border-hub-border bg-hub-surface p-3">
                    <span className="text-hub-accent">★ Favourite links</span>
                    <p className="text-xs text-hub-muted">
                      Your websites, in your colours.
                    </p>
                  </div>
                </div>
              </div>
              <Button
                onClick={async () => {
                  await savePage.mutateAsync(appearance);
                  setDrawer(null);
                }}
              >
                Apply appearance
              </Button>
            </div>
          ) : null}
          {drawer === "security" ? (
            <div className="mt-6">
              <PinSecurityPanel
                key={page.id}
                pageId={page.id}
                pageName={page.name}
                pageProtected={page.pin_protected}
                toggling={savePage.isPending}
                onToggle={(pin_protected) => savePage.mutate({ pin_protected })}
                onSaved={() => void qc.invalidateQueries({ queryKey: ["pages"] })}
              />
            </div>
          ) : null}
          {drawer === "widgets" ? (
            <div className="mt-6 space-y-3">
              <p className="text-sm text-hub-muted">
                Choose what appears on this profile’s Home tab. Move, resize or
                remove widgets on the canvas.
              </p>
              {WIDGETS.map((widget) => {
                const current = parseWidgets(page.home_widgets);
                const added = current.some((w) => w.id === widget.id);
                return (
                  <div
                    key={widget.id}
                    className="rounded-md border border-hub-border p-4"
                  >
                    <h3 className="font-semibold">{widget.name}</h3>
                    <p className="my-2 text-sm text-hub-muted">
                      {widget.description}
                    </p>
                    <Button
                      disabled={added || savePage.isPending}
                      onClick={() =>
                        savePage.mutate({
                          home_widgets: [
                            ...current,
                            { id: widget.id, size: "wide" },
                          ],
                        })
                      }
                    >
                      {added ? "Added" : "Add widget"}
                    </Button>
                  </div>
                );
              })}
            </div>
          ) : null}
          {drawer === "clocks" ? (
            <div className="mt-6 space-y-3">
              {clocks.map((c, i) => (
                <div
                  key={`${c.tz}-${i}`}
                  className="flex items-center gap-2 rounded-md border border-hub-border bg-hub-background p-3"
                >
                  <Clock3 className="size-4 text-hub-accent" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm">{c.label}</p>
                    <p className="truncate text-xs text-hub-muted">{c.tz}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => saveClocks(clocks.filter((_, x) => x !== i))}
                  >
                    <Trash2 />
                  </Button>
                </div>
              ))}
              {clocks.length < MAX_CLOCKS ? (
                <div className="space-y-3 rounded-md border border-hub-border bg-hub-background p-4">
                  <Input
                    placeholder="City label"
                    value={clockDraft.label}
                    onChange={(e) =>
                      setClockDraft({ ...clockDraft, label: e.target.value })
                    }
                  />
                  <Select
                    value={clockDraft.tz}
                    onValueChange={(tz) =>
                      setClockDraft({
                        ...clockDraft,
                        tz,
                        label: clockDraft.label || timezoneLabel(tz),
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Time zone" />
                    </SelectTrigger>
                    <SelectContent>
                      {TIMEZONES.map((t) => (
                        <SelectItem key={t.tz} value={t.tz}>
                          {t.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    disabled={!clockDraft.tz}
                    onClick={async () => {
                      await saveClocks([
                        ...clocks,
                        {
                          tz: clockDraft.tz,
                          label:
                            clockDraft.label || timezoneLabel(clockDraft.tz),
                        },
                      ]);
                      setClockDraft({ label: "", tz: "" });
                    }}
                  >
                    <Plus />
                    Add clock
                  </Button>
                </div>
              ) : null}
            </div>
          ) : null}
          {drawer === "link" ? (
            <form
              className="mt-6 space-y-4"
              onSubmit={(e) => {
                e.preventDefault();
                saveLink.mutate();
              }}
            >
              <div>
                <Label htmlFor="url">URL</Label>
                <Input
                  id="url"
                  value={linkDraft.url}
                  onChange={(e) =>
                    setLinkDraft({ ...linkDraft, url: e.target.value })
                  }
                  placeholder="https://example.com"
                  className="mt-1 bg-hub-background"
                />
              </div>
              <div>
                <Label htmlFor="label">Display name</Label>
                <Input
                  id="label"
                  value={linkDraft.label}
                  onChange={(e) =>
                    setLinkDraft({ ...linkDraft, label: e.target.value })
                  }
                  placeholder="Website name"
                  className="mt-1 bg-hub-background"
                />
              </div>
              <div>
                <Label htmlFor="folder">Folder</Label>
                <Select
                  value={folderName(linkDraft.group_name)}
                  onValueChange={(v) =>
                    setLinkDraft({
                      ...linkDraft,
                      group_name: v,
                    })
                  }
                >
                  <SelectTrigger id="folder" className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from(new Set([...currentFolders, folderName(linkDraft.group_name)])).map((f) => (
                      <SelectItem key={f} value={f}>
                        {f}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center justify-between rounded-md border border-hub-border bg-hub-background p-3">
                <Label htmlFor="logo-only">Show logo only</Label>
                <Switch
                  id="logo-only"
                  checked={linkDraft.icon_only}
                  onCheckedChange={(icon_only) =>
                    setLinkDraft({ ...linkDraft, icon_only })
                  }
                />
              </div>
              <div>
                <Label htmlFor="link-comment">Comment for this link</Label>
                <textarea id="link-comment" value={linkDraft.comment_text} onChange={(e) => setLinkDraft({ ...linkDraft, comment_text: e.target.value })} className="mt-1 min-h-28 w-full rounded-md border border-hub-border bg-hub-background p-3 text-sm" placeholder="Add context about this website…" />
                <p className="text-right text-xs text-hub-muted">{linkDraft.comment_text.trim().split(/\s+/).filter(Boolean).length} / 500 words</p>
              </div>
              <div className="flex items-center justify-between rounded-md border border-hub-border bg-hub-background p-3">
                <Label htmlFor="favourite">Favourite on Home</Label>
                <Switch
                  id="favourite"
                  checked={linkDraft.favourite}
                  onCheckedChange={(favourite) =>
                    setLinkDraft({ ...linkDraft, favourite })
                  }
                />
              </div>
              <div className="flex gap-2">
                <Button type="submit" disabled={saveLink.isPending || linkDraft.comment_text.trim().split(/\s+/).filter(Boolean).length > 500}>
                  {linkDraft.id ? "Save link" : "Add link"}
                </Button>
                {linkDraft.id ? (
                  <Button
                    type="button"
                    variant="ghost"
                    className="text-destructive"
                    onClick={() => removeLink.mutate(linkDraft.id)}
                  >
                    Delete
                  </Button>
                ) : null}
              </div>
            </form>
          ) : null}
          {drawer === "folder" ? (
            <div className="mt-6 space-y-4">
              <Label htmlFor="folder-name">Folder name in {tab?.name}</Label>
              <Input
                id="folder-name"
                value={folderDraft.name}
                onChange={(e) =>
                  setFolderDraft({ ...folderDraft, name: e.target.value })
                }
                className="bg-hub-background"
              />
              <Button
                onClick={() => saveFolder.mutate()}
                disabled={saveFolder.isPending}
              >
                {folderDraft.from ? "Rename folder" : "Create empty folder"}
              </Button>
              {folderDraft.from ? <>
                <div className="space-y-2 border-t border-hub-border pt-4">
                  <Label htmlFor="move-folder-target">Move to another tab</Label>
                  <select id="move-folder-target" className="w-full rounded border border-hub-border bg-hub-background p-2 text-sm" value={moveTarget} onChange={e=>setMoveTarget(e.target.value)}><option value="">Choose a tab</option>{tabs.filter(t=>t.id!==tab?.id && activeTabIds.has(t.id)).map(t=><option key={t.id} value={t.id}>{t.name}</option>)}</select>
                  <p className="text-xs text-hub-muted">All links move together. If the name exists, a number is added so folders stay separate.</p>
                  <Button disabled={!moveTarget || archivedTab || transferFolder.isPending} onClick={()=>transferFolder.mutate()}>Move folder</Button>
                </div>
              </> : null}
              {folderDraft.from ? (
                <Button
                  variant="ghost"
                  className="ml-2 text-destructive"
                  onClick={async () => {
                    if (!page || !tab) return;
                    const linksUpdate = await supabase
                      .from("links")
                      .update({ group_name: folders.find(f => f !== folderDraft.from) || nextFolderName() })
                      .eq("page_id", page.id)
                      .in("id", tabLinks.filter(l => folderName(l.group_name) === folderDraft.from).map(l => l.id));
                    if (linksUpdate.error) {
                      toast.error("Couldn't remove folder");
                      return;
                    }
                    if (folderDraft.id) {
                      const q = await supabase
                        .from("page_folders")
                        .delete()
                        .eq("id", folderDraft.id);
                      if (q.error) {
                        toast.error("Couldn't remove folder");
                        return;
                      }
                    }
                    await Promise.all([
                      qc.invalidateQueries({ queryKey: ["folders", page.id] }),
                      qc.invalidateQueries({ queryKey: ["links", page.id] }),
                    ]);
                    setDrawer(null);
                    toast.success("Folder removed; links kept");
                  }}
                >
                  Remove folder
                </Button>
              ) : null}
            </div>
          ) : null}
          {drawer === "tab" ? (
            <div className="mt-6 space-y-4">
              {specialTabDraft ? (
                <p className="text-sm font-medium">{tabDraft.name}</p>
              ) : (
                <>
                  <Label htmlFor="tab-name">Tab name in {page.name}</Label>
                  <Input
                    id="tab-name"
                    value={tabDraft.name}
                    onChange={(e) =>
                      setTabDraft({ ...tabDraft, name: e.target.value })
                    }
                    placeholder="Creative"
                    className="bg-hub-background"
                  />
                </>
              )}
              <div className="space-y-2">
                <Label>Tab color</Label>
                <div className="flex flex-wrap items-center gap-2">
                  <button type="button" onClick={() => setTabDraft({ ...tabDraft, tab_color: null })} aria-pressed={tabDraft.tab_color === null} className="rounded border border-hub-border px-3 py-2 text-xs aria-pressed:ring-2 aria-pressed:ring-hub-accent">Use theme</button>
                  {TAB_COLORS.map((color) => <button key={color} type="button" onClick={() => setTabDraft({ ...tabDraft, tab_color: color })} aria-label={`Select ${color} tab color`} aria-pressed={tabDraft.tab_color === color} style={tabColorStyle(color)} className="size-9 rounded-full border aria-pressed:ring-2 aria-pressed:ring-offset-2" />)}
                </div>
              </div>
              <Button
                onClick={() =>
                  tabDraft.id ? updateTab.mutate() : createTab.mutate()
                }
                disabled={updateTab.isPending || createTab.isPending || (!tabDraft.id && tabs.length >= MAX_TABS)}
              >
                {tabDraft.id ? "Save tab settings" : "Add tab"}
              </Button>
              {tabDraft.id ? (
                <div className="space-y-2 border-t border-hub-border pt-4">
                  <Button variant="outline" className="w-full" disabled={savePage.isPending || page.landing_tab === tabDraft.id} onClick={() => savePage.mutate({ landing_tab: tabDraft.id })}>{page.landing_tab === tabDraft.id ? "This is the landing tab" : "Make this the landing tab"}</Button>
                  {!specialTabDraft ? (
                    <Button
                      variant="ghost"
                      className="text-destructive"
                      disabled={tabs.length <= 1}
                      onClick={() => deleteTab.mutate()}
                    >
                      Delete tab
                    </Button>
                  ) : null}
                </div>
              ) : (
                <div className="border-t border-hub-border pt-4">
                  <p className="text-sm font-medium">
                    Or start from browser bookmarks
                  </p>
                  <p className="mt-1 text-xs leading-5 text-hub-muted">
                    Importing creates a new tab and keeps your bookmark folders
                    together.
                  </p>
                  <Button
                    variant="outline"
                    className="mt-3 w-full"
                    onClick={() => {
                      setDrawer(null);
                      setImportOpen(true);
                    }}
                    disabled={tabs.length >= MAX_TABS}
                  >
                    <Download />
                    Import bookmarks
                  </Button>
                </div>
              )}
            </div>
          ) : null}
          {drawer === "publish" ? (
            <div className="mt-6 space-y-4">
              <div className="rounded-md border border-hub-accent/40 bg-hub-background p-4">
                <p className="flex items-center gap-2 font-semibold text-hub-accent">
                  <Check className="size-4" />
                  Your page is live
                </p>
                <p className="mt-2 break-all font-mono text-xs text-hub-muted">
                  {publicUrl}
                </p>
              </div>
              <div className="grid gap-2">
                <Button asChild>
                  <a href={publicUrl} target="_blank" rel="noopener noreferrer">
                    <Eye />
                    Open my page
                  </a>
                </Button>
                <LandingPageSetupGuide
                  triggerLabel="How to set it as my browser start page"
                  url={publicUrl}
                />
                <Button
                  variant="ghost"
                  onClick={() => {
                    navigator.clipboard.writeText(publicUrl);
                    toast.success("Link copied");
                  }}
                >
                  <Copy />
                  Copy link
                </Button>
              </div>
              <div className="border-t border-hub-border pt-3">
                <Button variant="outline" onClick={download}>
                  <Download />
                  Download HTML
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => savePage.mutate({ published: false })}
                >
                  Unpublish
                </Button>
              </div>
            </div>
          ) : null}
        </SheetContent>
      </Sheet>
      <Dialog
        open={publishWarningPage === page.id}
        onOpenChange={(open) => {
          if (!open) setPublishWarningPage(null);
        }}
      >
        <DialogContent className="border-hub-border bg-hub-surface text-hub-foreground">
          <DialogHeader>
            <DialogTitle>Secure your page before publishing?</DialogTitle>
            <DialogDescription>
              PIN protection is not enabled for “{page.name}”. This page has a
              public URL: anyone with the link can view its content. Would you
              like to secure this profile with a PIN?
              {page.published
                ? " Your page is already live and changes save automatically."
                : ""}
            </DialogDescription>
          </DialogHeader>
          <label className="flex items-start gap-3 text-sm">
            <input
              type="checkbox"
              className="mt-1"
              checked={skipPublishWarning}
              onChange={(event) => setSkipPublishWarning(event.target.checked)}
            />
            <span>
              Don’t show this message again for this profile on this browser.
            </span>
          </label>
          <div className="flex flex-wrap justify-end gap-2">
            <Button variant="ghost" onClick={() => setPublishWarningPage(null)}>
              Cancel
            </Button>
            <Button
              variant="outline"
              disabled={savePage.isPending}
              onClick={async () => {
                try {
                  await finishPublishRequest();
                  if (skipPublishWarning) {
                    try {
                      localStorage.setItem(publishWarningKey, "dismissed");
                    } catch {
                      toast.info(
                        "Your browser could not save this preference.",
                      );
                    }
                  }
                  setPublishWarningPage(null);
                } catch {
                  /* Existing mutation displays the save error; keep dialog open. */
                }
              }}
            >
              {page.published ? "Continue without PIN" : "Publish without PIN"}
            </Button>
            <Button
              onClick={() => {
                setPublishWarningPage(null);
                setDrawer("security");
              }}
            >
              Set a PIN
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      <PremiumDialog open={premiumOpen} onOpenChange={setPremiumOpen} />
      <AlertDialog
        open={!!notice}
        onOpenChange={(o) => {
          if (!o) setNotice(null);
        }}
      >
        <AlertDialogContent className="border-hub-border bg-hub-surface text-hub-foreground">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-display">
              {notice?.title}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-hub-muted">
              {notice?.body}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogAction className="bg-hub-accent text-hub-background">
            Got it
          </AlertDialogAction>
        </AlertDialogContent>
      </AlertDialog>
      <SaveCurrentPageDialog
        ready={!!page && tabsQ.isSuccess && linksQ.isSuccess}
        currentPageId={page?.id}
        currentTabId={tab?.id}
        onSaved={async (pid, tid) => {
          await Promise.all([
            qc.invalidateQueries({ queryKey: ["links"] }),
            qc.invalidateQueries({ queryKey: ["folders"] }),
          ]);
          setPageId(pid);
          setTabId(tid);
        }}
      />
      <GuidedTour
        open={tourOpen && !drawer && !importOpen}
        steps={TOUR_STEPS}
        onComplete={completeTour}
      />
    </div>
  );
}
