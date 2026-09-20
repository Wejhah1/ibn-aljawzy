import { type HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export type BadgeTone =
  | "brand"
  | "success"
  | "danger"
  | "warning"
  | "info"
  | "neutral"
  | "accent";

const toneClasses: Record<BadgeTone, string> = {
  brand: "bg-brand-soft text-brand-hover",
  success: "bg-success-soft text-brand-hover",
  danger: "bg-danger-soft text-danger",
  warning: "bg-warning-soft text-warning",
  info: "bg-info-soft text-info",
  neutral: "bg-neutral-soft text-ink-muted",
  accent: "bg-accent-soft text-accent",
};

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: BadgeTone;
}

export function Badge({ className, tone = "neutral", ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-(--radius-xs) px-(--space-2) py-[3px] text-[12px] leading-[16px] font-semibold",
        toneClasses[tone],
        className
      )}
      {...props}
    />
  );
}

const GROUP_TONES = [1, 2, 3, 4, 5, 6] as const;

export function groupColorToken(index: number) {
  const n = GROUP_TONES[index % GROUP_TONES.length];
  return { fg: `var(--color-group-${n}-fg)`, bg: `var(--color-group-${n}-bg)` };
}
