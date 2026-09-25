import { type ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
  compact = false,
}: {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
  compact?: boolean;
}) {
  return (
    <div className={cn("flex flex-col items-center text-center", compact ? "py-(--space-4)" : "py-(--space-10)", className)}>
      <span
        className={cn(
          "flex items-center justify-center rounded-full bg-surface-sunken text-ink-faint mb-(--space-3)",
          compact ? "h-11 w-11" : "h-14 w-14"
        )}
      >
        <Icon size={compact ? 20 : 26} strokeWidth={1.75} />
      </span>
      <p className="text-sm font-bold text-ink">{title}</p>
      {description && <p className="text-xs leading-relaxed text-ink-muted mt-1 max-w-[320px]">{description}</p>}
      {action && <div className="mt-(--space-4)">{action}</div>}
    </div>
  );
}
