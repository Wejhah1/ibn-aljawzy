import { type InputHTMLAttributes, type LabelHTMLAttributes, type TextareaHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils";

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        "h-11 w-full rounded-(--radius-sm) border border-line bg-surface-raised px-(--space-3) text-sm text-ink placeholder:text-ink-faint outline-none transition-shadow duration-(--duration-fast)",
        "focus:border-line-strong focus:shadow-[0_0_0_2px_var(--color-surface),0_0_0_4px_var(--color-brand)]",
        "disabled:opacity-(--opacity-disabled) disabled:cursor-not-allowed",
        className
      )}
      {...props}
    />
  )
);
Input.displayName = "Input";

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className, ...props }, ref) => (
    <textarea
      ref={ref}
      className={cn(
        "w-full rounded-(--radius-sm) border border-line bg-surface-raised px-(--space-3) py-(--space-2) text-sm text-ink placeholder:text-ink-faint outline-none transition-shadow duration-(--duration-fast)",
        "focus:border-line-strong focus:shadow-[0_0_0_2px_var(--color-surface),0_0_0_4px_var(--color-brand)]",
        "disabled:opacity-(--opacity-disabled) disabled:cursor-not-allowed",
        className
      )}
      {...props}
    />
  )
);
Textarea.displayName = "Textarea";

export function Label({ className, ...props }: LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label
      className={cn(
        "block text-[12px] leading-[16px] font-semibold tracking-[0.01em] text-ink-muted mb-(--space-2)",
        className
      )}
      {...props}
    />
  );
}
