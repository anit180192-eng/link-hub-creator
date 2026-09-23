import { createFileRoute } from "@tanstack/react-router";
import { WorkspacePrototype } from "@/components/workspace/WorkspacePrototype";

export const Route = createFileRoute("/workspace-preview")({
  staticData: { sitemap: false },
  head: () => ({
    meta: [
      { title: "Workspace preview — Landing Page Builder" },
      { name: "description", content: "Preview the compact profile, tab, folder and link workspace." },
      { name: "robots", content: "noindex" },
      { property: "og:title", content: "Workspace preview — Landing Page Builder" },
      { property: "og:description", content: "Preview the compact profile workspace redesign." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: WorkspacePrototype,
});