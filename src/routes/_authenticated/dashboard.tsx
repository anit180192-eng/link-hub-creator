import { createFileRoute } from "@tanstack/react-router";
import { WorkspaceEditor } from "@/components/workspace/WorkspaceEditor";

export const Route = createFileRoute("/_authenticated/dashboard")({
  staticData: { sitemap: false },
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
  component: WorkspaceEditor,
});
