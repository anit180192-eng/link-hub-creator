import { useState, type ReactNode } from "react";
import { ChevronDown } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

type CollapsibleSectionProps = {
  /** Heading shown in the always-visible header row. */
  title: ReactNode;
  /** Optional one-line subtitle under the heading. */
  subtitle?: ReactNode;
  /** Extra elements rendered on the right of the header (e.g. a primary button). */
  actions?: ReactNode;
  /** Whether the section starts open. Defaults to true. */
  defaultOpen?: boolean;
  /** Small badge shown next to the title when collapsed (e.g. "PIN on", "Live"). */
  collapsedBadge?: ReactNode;
  className?: string;
  /** Accessible id for the heading; links the trigger via aria-controls. */
  headingId?: string;
  children: ReactNode;
};

export function CollapsibleSection({
  title,
  subtitle,
  actions,
  defaultOpen = true,
  collapsedBadge,
  className,
  headingId,
  children,
}: CollapsibleSectionProps) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <Collapsible open={open} onOpenChange={setOpen} className={`rounded-xl border border-border bg-card ${className ?? ""}`}>
      <div className="flex flex-wrap items-center justify-between gap-3 p-6 pb-0">
        <CollapsibleTrigger
          className="group flex min-w-0 flex-1 items-start gap-2 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-md"
          aria-controls={headingId}
          aria-expanded={open}
        >
          <ChevronDown
            className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground transition-transform duration-200 group-data-[state=open]:rotate-180"
            aria-hidden="true"
          />
          <span className="min-w-0 flex-1">
            <span className="flex flex-wrap items-center gap-2">
              <span className="font-display text-lg leading-tight" id={headingId}>{title}</span>
              {!open && collapsedBadge ? collapsedBadge : null}
            </span>
            {subtitle ? <span className="mt-1 block text-sm text-muted-foreground">{subtitle}</span> : null}
          </span>
        </CollapsibleTrigger>
        {actions ? <div className="flex shrink-0 items-center gap-2">{actions}</div> : null}
      </div>
      <CollapsibleContent>
        <div className="p-6 pt-4">{children}</div>
      </CollapsibleContent>
    </Collapsible>
  );
}
