import { PanelsTopLeft } from "lucide-react";
import { cn } from "@/lib/utils";

export function Brand({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-2 font-display font-bold", className)}>
      <span className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
        <PanelsTopLeft className="h-4 w-4" />
      </span>
      <span>Homepage <span className="text-primary">Builder</span></span>
    </span>
  );
}
