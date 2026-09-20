import { type HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "bg-surface-raised border-bold border-line rounded-(--radius-md) shadow-sm p-(--space-4)",
        className
      )}
      {...props}
    />
  );
}

export function CardStat({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "bg-surface-raised border-bold border-line-strong rounded-(--radius-md) shadow-brutal-sm p-(--space-5)",
        className
      )}
      {...props}
    />
  );
}

export function CardTitle({ className, ...props }: HTMLAttributes<HTMLHeadingElement>) {
  return <h3 className={cn("text-[18px] leading-[26px] font-semibold text-ink", className)} {...props} />;
}

export function CardDescription({ className, ...props }: HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn("text-[12px] leading-[18px] font-medium text-ink-muted", className)} {...props} />;
}
